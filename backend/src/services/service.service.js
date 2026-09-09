import { categoryRepository } from '../repositories/category.repository.js';
import { serviceRepository } from '../repositories/service.repository.js';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors.js';
import { buildMeta } from '../utils/pagination.js';
import { auditService } from './audit.service.js';

function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

class ServiceCatalogService {
    async list({ isPublic, search, category, status, page = 1, perPage = 12, orderBy, orderDir }) {
        const { rows, total } = await serviceRepository.findAllWithCategory({
            search,
            categorySlug: category,
            status: isPublic ? 'active' : status,
            page,
            perPage,
            orderBy,
            orderDir,
        });

        return { data: rows.map((s) => s.toJSON()), meta: buildMeta({ page, perPage, total }) };
    }

    async getByIdOrSlug(idOrSlug, { isPublic }) {
        const isNumeric = /^\d+$/.test(idOrSlug);
        const service = isNumeric
            ? await serviceRepository.findByIdWithCategory(Number(idOrSlug))
            : await serviceRepository.findBySlug(idOrSlug);

        if (!service || (isPublic && service.status !== 'active')) {
            throw new NotFoundError('El servicio no existe.');
        }
        return service.toJSON();
    }

    async create(dto, ctx = {}) {
        if (dto.categoryId && !(await categoryRepository.findById(dto.categoryId))) {
            throw new BadRequestError('La categoría seleccionada no existe.');
        }

        const slug = slugify(dto.name);
        if (await serviceRepository.slugExists(slug)) {
            throw new ConflictError('Ya existe un servicio con un nombre muy similar.');
        }

        const id = await serviceRepository.create({
            slug,
            name: dto.name,
            description: dto.description ?? null,
            category_id: dto.categoryId ?? null,
            price: dto.price,
            duration_minutes: dto.durationMinutes,
            image_url: dto.imageUrl ?? null,
            status: dto.status ?? 'active',
        });

        await auditService.record({ userId: ctx.actorId, action: 'service_created', entity: 'services', entityId: id, ipAddress: ctx.ipAddress });

        const service = await serviceRepository.findByIdWithCategory(id);
        return service.toJSON();
    }

    async update(id, dto, ctx = {}) {
        const existing = await serviceRepository.findByIdWithCategory(id);
        if (!existing) throw new NotFoundError('El servicio no existe.');

        if (dto.categoryId && !(await categoryRepository.findById(dto.categoryId))) {
            throw new BadRequestError('La categoría seleccionada no existe.');
        }

        const changes = {
            ...(dto.name && { name: dto.name, slug: slugify(dto.name) }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.categoryId !== undefined && { category_id: dto.categoryId }),
            ...(dto.price !== undefined && { price: dto.price }),
            ...(dto.durationMinutes !== undefined && { duration_minutes: dto.durationMinutes }),
            ...(dto.imageUrl !== undefined && { image_url: dto.imageUrl }),
            ...(dto.status && { status: dto.status }),
        };

        await serviceRepository.update(id, changes);
        await auditService.record({ userId: ctx.actorId, action: 'service_updated', entity: 'services', entityId: id, changes: { after: dto }, ipAddress: ctx.ipAddress });

        const updated = await serviceRepository.findByIdWithCategory(id);
        return updated.toJSON();
    }

    async updateStatus(id, status, ctx = {}) {
        const existing = await serviceRepository.findByIdWithCategory(id);
        if (!existing) throw new NotFoundError('El servicio no existe.');

        await serviceRepository.update(id, { status });
        await auditService.record({ userId: ctx.actorId, action: 'service_status_changed', entity: 'services', entityId: id, changes: { after: { status } }, ipAddress: ctx.ipAddress });

        const updated = await serviceRepository.findByIdWithCategory(id);
        return updated.toJSON();
    }

    async remove(id, ctx = {}) {
        const existing = await serviceRepository.findByIdWithCategory(id);
        if (!existing) throw new NotFoundError('El servicio no existe.');

        await serviceRepository.softDeleteById(id);
        await auditService.record({ userId: ctx.actorId, action: 'service_deleted', entity: 'services', entityId: id, ipAddress: ctx.ipAddress });
    }
}

export const serviceCatalogService = new ServiceCatalogService();
export default serviceCatalogService;
