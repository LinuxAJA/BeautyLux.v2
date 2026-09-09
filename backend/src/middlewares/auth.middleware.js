import { userRepository } from '../repositories/usuario.repository.js';
import { UnauthorizedError } from '../utils/errors.js';
import { verifyAccessToken } from '../utils/jwt.js';

/**
 * Exige un access token válido en `Authorization: Bearer <token>`.
 * Carga `req.user = { id, role, permissions... }` para el resto de la cadena.
 */
export async function authenticate(req, res, next) {
    try {
        const header = req.headers.authorization || '';
        const [scheme, token] = header.split(' ');

        if (scheme !== 'Bearer' || !token) {
            throw new UnauthorizedError('Debes iniciar sesión para continuar.');
        }

        const payload = verifyAccessToken(token);
        const user = await userRepository.findByIdWithRole(payload.sub);

        if (!user) {
            throw new UnauthorizedError('El usuario ya no existe.');
        }
        if (user.status === 'inactive') {
            throw new UnauthorizedError('Tu cuenta está inactiva.', 'ACCOUNT_INACTIVE');
        }

        req.user = { id: user.id, role: user.role.name, status: user.status, email: user.email };
        next();
    } catch (error) {
        next(error);
    }
}

export default authenticate;
