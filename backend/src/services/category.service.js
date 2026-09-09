import { categoryRepository } from '../repositories/category.repository.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import { auditService } from './audit.service.js';

function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

class CategoryService {
    async list({ type }) {
        if (type) {
            const rows = await categoryRepository.findByType(type, { status: 'active' });
            return rows.map((c) => c.toJSON());
        }
        const { rows } = await categoryRepository.findAll({ perPage: 100 });
        return rows.map((c) => c.toJSON());
    }

    async create(dto, ctx = {}) {
        const slug = slugify(dto.name);
        if (await categoryRepository.slugExists(slug)) {
            throw new ConflictError('Ya existe una categoría con un nombre muy similar.');
        }

        const id = await categoryRepository.create({
            slug,
            name: dto.name,
            description: dto.description ?? null,
            image_url: dto.imageUrl ?? null,
            type: dto.type,
            status: dto.status ?? 'active',
        });

        await auditService.record({ userId: ctx.actorId, action: 'category_created', entity: 'categories', entityId: id, ipAddress: ctx.ipAddress });
        return (await categoryRepository.findById(id)).toJSON();
    }

    async update(id, dto, ctx = {}) {
        const existing = await categoryRepository.findById(id);
        if (!existing) throw new NotFoundError('La categoría no existe.');

        const changes = {
            ...(dto.name && { name: dto.name, slug: slugify(dto.name) }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.imageUrl !== undefined && { image_url: dto.imageUrl }),
            ...(dto.type && { type: dto.type }),
            ...(dto.status && { status: dto.status }),
        };

        await categoryRepository.update(id, changes);
        await auditService.record({ userId: ctx.actorId, action: 'category_updated', entity: 'categories', entityId: id, changes: { after: dto }, ipAddress: ctx.ipAddress });
        return (await categoryRepository.findById(id)).toJSON();
    }

    async remove(id, ctx = {}) {
        const existing = await categoryRepository.findById(id);
        if (!existing) throw new NotFoundError('La categoría no existe.');

        const itemsCount = await categoryRepository.countItems(id);
        if (itemsCount > 0) {
            throw new ConflictError('No se puede eliminar: la categoría tiene productos o servicios asociados.');
        }

        await categoryRepository.hardDelete(id);
        await auditService.record({ userId: ctx.actorId, action: 'category_deleted', entity: 'categories', entityId: id, ipAddress: ctx.ipAddress });
    }
}

export const categoryService = new CategoryService();
export default categoryService;
