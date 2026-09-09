import { categoryService } from '../services/category.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { created, ok } from '../utils/apiResponse.js';

function actorCtx(req) {
    return { actorId: req.user?.id, ipAddress: req.ip };
}

export const list = asyncHandler(async (req, res) => {
    const categories = await categoryService.list({ type: req.validatedQuery?.type });
    ok(res, { data: categories });
});

export const create = asyncHandler(async (req, res) => {
    const category = await categoryService.create(req.body, actorCtx(req));
    created(res, { data: category, message: 'Categoría creada correctamente.' });
});

export const update = asyncHandler(async (req, res) => {
    const category = await categoryService.update(req.params.id, req.body, actorCtx(req));
    ok(res, { data: category, message: 'Categoría actualizada correctamente.' });
});

export const remove = asyncHandler(async (req, res) => {
    await categoryService.remove(req.params.id, actorCtx(req));
    ok(res, { data: null, message: 'Categoría eliminada correctamente.' });
});

export default { list, create, update, remove };
