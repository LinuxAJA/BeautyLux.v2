import { serviceCatalogService } from '../services/service.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { created, ok } from '../utils/apiResponse.js';

function actorCtx(req) {
    return { actorId: req.user?.id, ipAddress: req.ip };
}

export const list = asyncHandler(async (req, res) => {
    const { search, category, status, page, perPage, orderBy, orderDir } = req.validatedQuery;
    const { data, meta } = await serviceCatalogService.list({
        isPublic: !req.user,
        search,
        category,
        status,
        page,
        perPage,
        orderBy,
        orderDir,
    });
    ok(res, { data, meta });
});

export const getOne = asyncHandler(async (req, res) => {
    const service = await serviceCatalogService.getByIdOrSlug(req.params.idOrSlug, { isPublic: !req.user });
    ok(res, { data: service });
});

export const create = asyncHandler(async (req, res) => {
    const service = await serviceCatalogService.create(req.body, actorCtx(req));
    created(res, { data: service, message: 'Servicio creado correctamente.' });
});

export const update = asyncHandler(async (req, res) => {
    const service = await serviceCatalogService.update(req.params.id, req.body, actorCtx(req));
    ok(res, { data: service, message: 'Servicio actualizado correctamente.' });
});

export const updateStatus = asyncHandler(async (req, res) => {
    const service = await serviceCatalogService.updateStatus(req.params.id, req.body.status, actorCtx(req));
    ok(res, { data: service, message: 'Estado actualizado correctamente.' });
});

export const remove = asyncHandler(async (req, res) => {
    await serviceCatalogService.remove(req.params.id, actorCtx(req));
    ok(res, { data: null, message: 'Servicio eliminado correctamente.' });
});

export default { list, getOne, create, update, updateStatus, remove };
