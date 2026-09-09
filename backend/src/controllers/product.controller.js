import { productService } from '../services/product.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { created, ok } from '../utils/apiResponse.js';

function actorCtx(req) {
    return { actorId: req.user?.id, ipAddress: req.ip };
}

export const list = asyncHandler(async (req, res) => {
    const { search, category, status, minPrice, maxPrice, page, perPage, orderBy, orderDir } = req.validatedQuery;
    const { data, meta } = await productService.list({
        isPublic: !req.user,
        search,
        category,
        status,
        minPrice,
        maxPrice,
        page,
        perPage,
        orderBy,
        orderDir,
    });
    ok(res, { data, meta });
});

export const getOne = asyncHandler(async (req, res) => {
    const product = await productService.getByIdOrSlug(req.params.idOrSlug, { isPublic: !req.user });
    ok(res, { data: product });
});

export const create = asyncHandler(async (req, res) => {
    const product = await productService.create(req.body, actorCtx(req));
    created(res, { data: product, message: 'Producto creado correctamente.' });
});

export const update = asyncHandler(async (req, res) => {
    const product = await productService.update(req.params.id, req.body, actorCtx(req));
    ok(res, { data: product, message: 'Producto actualizado correctamente.' });
});

export const updateStatus = asyncHandler(async (req, res) => {
    const product = await productService.updateStatus(req.params.id, req.body.status, actorCtx(req));
    ok(res, { data: product, message: 'Estado actualizado correctamente.' });
});

export const remove = asyncHandler(async (req, res) => {
    await productService.remove(req.params.id, actorCtx(req));
    ok(res, { data: null, message: 'Producto eliminado correctamente.' });
});

export default { list, getOne, create, update, updateStatus, remove };
