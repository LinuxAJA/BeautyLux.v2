import { roleRepository } from '../repositories/role.repository.js';
import { userRepository } from '../repositories/usuario.repository.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../utils/errors.js';
import { hashPassword } from '../utils/password.js';
import { buildMeta } from '../utils/pagination.js';
import { auditService } from './audit.service.js';
import { tokenService } from './token.service.js';

class UserService {
    /**
     * Lista usuarios. Un empleado solo puede ver clientes: el rol se fuerza
     * aquí, en el servicio, no en el controlador, para que no se pueda
     * saltar llamando el endpoint con otros parámetros.
     */
    async list({ actorRole, search, role, status, page = 1, perPage = 10, orderBy, orderDir }) {
        const roleName = actorRole === 'employee' ? 'client' : role;

        const { rows, total } = await userRepository.findAllWithRole({
            search,
            roleName,
            status,
            page,
            perPage,
            orderBy,
            orderDir,
        });

        return { data: rows.map((user) => user.toJSON()), meta: buildMeta({ page, perPage, total }) };
    }

    async getById(id, { actorRole }) {
        const user = await userRepository.findByIdWithRole(id);
        if (!user) throw new NotFoundError('El usuario no existe.');

        if (actorRole === 'employee' && user.role.name !== 'client') {
            throw new ForbiddenError('No tienes permisos para ver este usuario.');
        }
        return user.toJSON();
    }

    async create(dto, ctx = {}) {
        const email = dto.email.toLowerCase().trim();

        if (await userRepository.emailExists(email)) {
            throw new ConflictError('Ya existe una cuenta registrada con este correo electrónico.', 'EMAIL_ALREADY_EXISTS');
        }
        if (await userRepository.documentExists(dto.documentType, dto.documentNumber)) {
            throw new ConflictError('Ya existe una cuenta registrada con este número de documento.', 'DOCUMENT_ALREADY_EXISTS');
        }

        const role = await roleRepository.findByName(dto.role);
        if (!role) throw new BadRequestError('El rol seleccionado no existe.');

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
            role_id: role.id,
            status: 'active',
        });

        await auditService.record({
            userId: ctx.actorId,
            action: 'user_created',
            entity: 'users',
            entityId: userId,
            changes: { after: { email, role: dto.role } },
            ipAddress: ctx.ipAddress,
        });

        const user = await userRepository.findByIdWithRole(userId);
        return user.toJSON();
    }

    /** Un empleado solo puede editar clientes y no puede cambiarles el rol. */
    async update(id, dto, ctx = {}) {
        const target = await userRepository.findByIdWithRole(id);
        if (!target) throw new NotFoundError('El usuario no existe.');

        if (ctx.actorRole === 'employee' && target.role.name !== 'client') {
            throw new ForbiddenError('No tienes permisos para editar este usuario.');
        }
        if (dto.role && ctx.actorRole !== 'admin') {
            throw new ForbiddenError('Solo un administrador puede cambiar el rol de un usuario.');
        }

        if (dto.email && dto.email.toLowerCase() !== target.email) {
            const email = dto.email.toLowerCase().trim();
            if (await userRepository.emailExists(email, { excludeId: id })) {
                throw new ConflictError('Ya existe una cuenta registrada con este correo electrónico.', 'EMAIL_ALREADY_EXISTS');
            }
        }
        if (dto.documentType && dto.documentNumber) {
            const exists = await userRepository.documentExists(dto.documentType, dto.documentNumber, { excludeId: id });
            if (exists) throw new ConflictError('Ya existe una cuenta registrada con este número de documento.', 'DOCUMENT_ALREADY_EXISTS');
        }

        let roleId;
        if (dto.role) {
            const role = await roleRepository.findByName(dto.role);
            if (!role) throw new BadRequestError('El rol seleccionado no existe.');
            roleId = role.id;
        }

        await userRepository.update(id, {
            ...(dto.firstName && { first_name: dto.firstName }),
            ...(dto.lastName && { last_name: dto.lastName }),
            ...(dto.documentType && { document_type_code: dto.documentType }),
            ...(dto.documentNumber && { document_number: dto.documentNumber }),
            ...(dto.address && { address: dto.address }),
            ...(dto.phone && { phone: dto.phone }),
            ...(dto.email && { email: dto.email.toLowerCase().trim() }),
            ...(roleId && { role_id: roleId }),
        });

        await auditService.record({
            userId: ctx.actorId,
            action: 'user_updated',
            entity: 'users',
            entityId: id,
            changes: { after: dto },
            ipAddress: ctx.ipAddress,
        });

        const updated = await userRepository.findByIdWithRole(id);
        return updated.toJSON();
    }

    /** Activo/Inactivo. Un admin no puede desactivarse a sí mismo. */
    async updateStatus(id, status, ctx = {}) {
        const target = await userRepository.findByIdWithRole(id);
        if (!target) throw new NotFoundError('El usuario no existe.');

        if (id === ctx.actorId && status === 'inactive') {
            throw new ForbiddenError('No puedes desactivar tu propia cuenta.');
        }
        if (target.role.name === 'admin' && status === 'inactive') {
            const activeAdmins = await userRepository.countActiveAdmins({ excludeId: id });
            if (activeAdmins === 0) {
                throw new ForbiddenError('No puedes desactivar al último administrador activo.');
            }
        }

        await userRepository.updateStatus(id, status);
        if (status === 'inactive') await tokenService.revokeAllForUser(id);

        await auditService.record({
            userId: ctx.actorId,
            action: 'user_status_changed',
            entity: 'users',
            entityId: id,
            changes: { before: { status: target.status }, after: { status } },
            ipAddress: ctx.ipAddress,
        });

        const updated = await userRepository.findByIdWithRole(id);
        return updated.toJSON();
    }

    /** Soft delete. No permite eliminarse a sí mismo ni al último admin. */
    async remove(id, ctx = {}) {
        const target = await userRepository.findByIdWithRole(id);
        if (!target) throw new NotFoundError('El usuario no existe.');

        if (id === ctx.actorId) {
            throw new ForbiddenError('No puedes eliminar tu propia cuenta.');
        }
        if (target.role.name === 'admin') {
            const activeAdmins = await userRepository.countActiveAdmins({ excludeId: id });
            if (activeAdmins === 0) {
                throw new ForbiddenError('No puedes eliminar al último administrador activo.');
            }
        }

        await userRepository.softDeleteById(id);
        await tokenService.revokeAllForUser(id);

        await auditService.record({
            userId: ctx.actorId,
            action: 'user_deleted',
            entity: 'users',
            entityId: id,
            ipAddress: ctx.ipAddress,
        });
    }
}

export const userService = new UserService();
export default userService;
