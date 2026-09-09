import { userService } from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { created, ok } from '../utils/apiResponse.js';

function actorCtx(req) {
    return { actorId: req.user.id, actorRole: req.user.role, ipAddress: req.ip };
}

export const list = asyncHandler(async (req, res) => {
    const { search, role, status, page, perPage, orderBy, orderDir } = req.validatedQuery;
    const { data, meta } = await userService.list({
        actorRole: req.user.role,
        search,
        role,
        status,
        page,
        perPage,
        orderBy,
        orderDir,
    });
    ok(res, { data, meta });
});

export const getById = asyncHandler(async (req, res) => {
    const user = await userService.getById(req.params.id, { actorRole: req.user.role });
    ok(res, { data: user });
});

export const create = asyncHandler(async (req, res) => {
    const user = await userService.create(req.body, actorCtx(req));
    created(res, { data: user, message: 'Usuario creado correctamente.' });
});

export const update = asyncHandler(async (req, res) => {
    const user = await userService.update(req.params.id, req.body, actorCtx(req));
    ok(res, { data: user, message: 'Usuario actualizado correctamente.' });
});

export const updateStatus = asyncHandler(async (req, res) => {
    const user = await userService.updateStatus(req.params.id, req.body.status, actorCtx(req));
    ok(res, { data: user, message: 'Estado actualizado correctamente.' });
});

export const remove = asyncHandler(async (req, res) => {
    await userService.remove(req.params.id, actorCtx(req));
    ok(res, { data: null, message: 'Usuario eliminado correctamente.' });
});

export default { list, getById, create, update, updateStatus, remove };
