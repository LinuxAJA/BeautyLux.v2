import crypto from 'node:crypto';

import { env } from '../config/env.js';
import { passwordResetRepository } from '../repositories/passwordReset.repository.js';
import { roleRepository } from '../repositories/role.repository.js';
import { userRepository } from '../repositories/usuario.repository.js';
import { AppError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/errors.js';
import { comparePassword, getDummyHash, hashPassword } from '../utils/password.js';
import { hashToken } from '../utils/cookies.js';
import { auditService } from './audit.service.js';
import { permissionService } from './permission.service.js';
import { tokenService } from './token.service.js';

const MINUTE_MS = 60 * 1000;

class AuthService {
    async register(dto, ctx = {}) {
        const email = dto.email.toLowerCase().trim();

        if (await userRepository.emailExists(email)) {
            throw new ConflictError('Ya existe una cuenta registrada con este correo electrónico.', 'EMAIL_ALREADY_EXISTS');
        }
        if (await userRepository.documentExists(dto.documentType, dto.documentNumber)) {
            throw new ConflictError('Ya existe una cuenta registrada con este número de documento.', 'DOCUMENT_ALREADY_EXISTS');
        }

        const clientRole = await roleRepository.findByName('client');
        if (!clientRole) throw new AppError('El rol de cliente no está configurado.', 500);

        const passwordHash = await hashPassword(dto.password);

        const userId = await userRepository.create({
            first_name: dto.firstName,
            last_name: dto.lastName,
            document_type_code: dto.documentType,
            document_number: dto.documentNumber,
            address: dto.address,
            phone: dto.phone,
            email,
            password_hash: passwordHash,
            role_id: clientRole.id,
            status: 'active',
        });

        await auditService.record({
            userId,
            action: 'user_registered',
            entity: 'users',
            entityId: userId,
            ipAddress: ctx.ipAddress,
        });

        const user = await userRepository.findByIdWithRole(userId);
        return user.toJSON();
    }

    async login(email, password, remember, ctx = {}) {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await userRepository.findByEmailWithPassword(normalizedEmail);

        // Compara siempre contra un hash, exista o no la cuenta, para no filtrar por tiempo.
        const passwordHash = user?.passwordHash ?? (await getDummyHash());
        const isValidPassword = await comparePassword(password, passwordHash);

        if (!user || !isValidPassword) {
            await auditService.record({
                action: 'login_failed',
                entity: 'users',
                changes: { email: normalizedEmail },
                ipAddress: ctx.ipAddress,
            });
            throw new UnauthorizedError('Correo electrónico o contraseña incorrectos.', 'INVALID_CREDENTIALS');
        }

        if (user.status === 'inactive') {
            throw new ForbiddenError('Tu cuenta está inactiva. Contacta al administrador.', 'ACCOUNT_INACTIVE');
        }

        await userRepository.touchLastLogin(user.id);
        await auditService.record({
            userId: user.id,
            action: 'login_succeeded',
            entity: 'users',
            entityId: user.id,
            ipAddress: ctx.ipAddress,
        });

        const accessToken = tokenService.signAccessToken(user);
        const refresh = await tokenService.issueRefreshToken(user.id, {
            remember,
            userAgent: ctx.userAgent,
            ipAddress: ctx.ipAddress,
        });

        return { user: user.toJSON(), accessToken, refresh };
    }

    async refresh(rawToken, ctx = {}) {
        const session = await tokenService.consumeRefreshToken(rawToken, ctx);
        const user = await userRepository.findByIdWithRole(session.user_id);

        if (!user || user.status === 'inactive') {
            throw new UnauthorizedError('La cuenta ya no está disponible.', 'ACCOUNT_INACTIVE');
        }

        const accessToken = tokenService.signAccessToken(user);
        const refresh = await tokenService.issueRefreshToken(user.id, {
            remember: Boolean(session.remember),
            userAgent: ctx.userAgent,
            ipAddress: ctx.ipAddress,
        });

        return { user: user.toJSON(), accessToken, refresh };
    }

    async logout(rawToken) {
        await tokenService.revokeByRawToken(rawToken);
    }

    async me(userId) {
        const user = await userRepository.findByIdWithRole(userId);
        if (!user) throw new NotFoundError('El usuario no existe.');
        return {
            ...user.toJSON(),
            permissions: permissionService.permissionsFor(user.role.name),
        };
    }

    async updateProfile(userId, dto) {
        const changed = await userRepository.update(userId, {
            ...(dto.firstName && { first_name: dto.firstName }),
            ...(dto.lastName && { last_name: dto.lastName }),
            ...(dto.address && { address: dto.address }),
            ...(dto.phone && { phone: dto.phone }),
        });
        if (!changed) throw new NotFoundError('El usuario no existe.');

        const user = await userRepository.findByIdWithRole(userId);
        return user.toJSON();
    }

    async changePassword(userId, currentPassword, newPassword) {
        const user = await userRepository.findByIdWithRole(userId);
        if (!user) throw new NotFoundError('El usuario no existe.');

        // findByIdWithRole no trae el hash; se recupera explícitamente.
        const withPassword = await userRepository.findByEmailWithPassword(user.email);
        const isValid = await comparePassword(currentPassword, withPassword.passwordHash);
        if (!isValid) {
            throw new UnauthorizedError('La contraseña actual es incorrecta.', 'INVALID_CREDENTIALS');
        }

        const newHash = await hashPassword(newPassword);
        await userRepository.updatePassword(userId, newHash);
        await tokenService.revokeAllForUser(userId);
        await auditService.record({ userId, action: 'password_changed', entity: 'users', entityId: userId });
    }

    async forgotPassword(email) {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await userRepository.findByEmailWithPassword(normalizedEmail);

        // Respuesta idéntica exista o no la cuenta, para no permitir enumeración de correos.
        const genericMessage = 'Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña.';
        if (!user) return { message: genericMessage };

        await passwordResetRepository.invalidatePrevious(user.id);

        const rawToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TTL_MINUTES * MINUTE_MS);

        await passwordResetRepository.create({
            userId: user.id,
            tokenHash: hashToken(rawToken),
            expiresAt,
        });

        await auditService.record({ userId: user.id, action: 'password_reset_requested', entity: 'users', entityId: user.id });

        const result = { message: genericMessage };
        if (env.EXPOSE_RESET_TOKEN) result.resetToken = rawToken;
        return result;
    }

    async resetPassword(rawToken, newPassword) {
        const record = await passwordResetRepository.findValidByTokenHash(hashToken(rawToken));
        if (!record) {
            throw new UnauthorizedError('El enlace de recuperación no es válido o expiró.', 'INVALID_RESET_TOKEN');
        }

        const newHash = await hashPassword(newPassword);
        await userRepository.updatePassword(record.user_id, newHash);
        await passwordResetRepository.markUsed(record.id);
        await tokenService.revokeAllForUser(record.user_id);
        await auditService.record({ userId: record.user_id, action: 'password_reset_completed', entity: 'users', entityId: record.user_id });
    }
}

export const authService = new AuthService();
export default authService;
