import { categoryRepository } from '../repositories/category.repository.js';
import { productRepository } from '../repositories/product.repository.js';
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

class ProductService {
    /** El público solo ve productos activos; los paneles ven todo. */
    async list({ isPublic, search, category, status, minPrice, maxPrice, page = 1, perPage = 12, orderBy, orderDir }) {
        const { rows, total } = await productRepository.findAllWithCategory({
            search,
            categorySlug: category,
            status: isPublic ? 'active' : status,
            minPrice,
            maxPrice,
            page,
            perPage,
            orderBy,
            orderDir,
        });

        return { data: rows.map((p) => p.toJSON()), meta: buildMeta({ page, perPage, total }) };
    }

    async getByIdOrSlug(idOrSlug, { isPublic }) {
        const isNumeric = /^\d+$/.test(idOrSlug);
        const product = isNumeric
            ? await productRepository.findByIdWithCategory(Number(idOrSlug))
            : await productRepository.findBySlug(idOrSlug);

        if (!product || (isPublic && product.status !== 'active')) {
            throw new NotFoundError('El producto no existe.');
        }
        return product.toJSON();
    }

    async create(dto, ctx = {}) {
        if (await productRepository.skuExists(dto.sku)) {
            throw new ConflictError('Ya existe un producto con ese SKU.');
        }
        if (dto.categoryId && !(await categoryRepository.findById(dto.categoryId))) {
            throw new BadRequestError('La categoría seleccionada no existe.');
        }

        const slug = slugify(dto.name);
        if (await productRepository.slugExists(slug)) {
            throw new ConflictError('Ya existe un producto con un nombre muy similar.');
        }

        const id = await productRepository.create({
            sku: dto.sku,
            slug,
            name: dto.name,
            description: dto.description ?? null,
            category_id: dto.categoryId ?? null,
            price: dto.price,
            old_price: dto.oldPrice ?? null,
            stock: dto.stock ?? 0,
            rating: 0,
            reviews_count: 0,
            image_url: dto.imageUrl ?? null,
            badge: dto.badge ?? null,
            status: dto.status ?? 'active',
        });

        await auditService.record({ userId: ctx.actorId, action: 'product_created', entity: 'products', entityId: id, ipAddress: ctx.ipAddress });

        const product = await productRepository.findByIdWithCategory(id);
        return product.toJSON();
    }

    async update(id, dto, ctx = {}) {
        const existing = await productRepository.findByIdWithCategory(id);
        if (!existing) throw new NotFoundError('El producto no existe.');

        if (dto.sku && dto.sku !== existing.sku && (await productRepository.skuExists(dto.sku, { excludeId: id }))) {
            throw new ConflictError('Ya existe un producto con ese SKU.');
        }
        if (dto.categoryId && !(await categoryRepository.findById(dto.categoryId))) {
            throw new BadRequestError('La categoría seleccionada no existe.');
        }

        const changes = {
            ...(dto.sku && { sku: dto.sku }),
            ...(dto.name && { name: dto.name, slug: slugify(dto.name) }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.categoryId !== undefined && { category_id: dto.categoryId }),
            ...(dto.price !== undefined && { price: dto.price }),
            ...(dto.oldPrice !== undefined && { old_price: dto.oldPrice }),
            ...(dto.stock !== undefined && { stock: dto.stock }),
            ...(dto.imageUrl !== undefined && { image_url: dto.imageUrl }),
            ...(dto.badge !== undefined && { badge: dto.badge }),
            ...(dto.status && { status: dto.status }),
        };

        await productRepository.update(id, changes);
        await auditService.record({ userId: ctx.actorId, action: 'product_updated', entity: 'products', entityId: id, changes: { after: dto }, ipAddress: ctx.ipAddress });

        const updated = await productRepository.findByIdWithCategory(id);
        return updated.toJSON();
    }

    async updateStatus(id, status, ctx = {}) {
        const existing = await productRepository.findByIdWithCategory(id);
        if (!existing) throw new NotFoundError('El producto no existe.');

        await productRepository.update(id, { status });
        await auditService.record({ userId: ctx.actorId, action: 'product_status_changed', entity: 'products', entityId: id, changes: { after: { status } }, ipAddress: ctx.ipAddress });

        const updated = await productRepository.findByIdWithCategory(id);
        return updated.toJSON();
    }

    async remove(id, ctx = {}) {
        const existing = await productRepository.findByIdWithCategory(id);
        if (!existing) throw new NotFoundError('El producto no existe.');

        await productRepository.softDeleteById(id);
        await auditService.record({ userId: ctx.actorId, action: 'product_deleted', entity: 'products', entityId: id, ipAddress: ctx.ipAddress });
    }
}

export const productService = new ProductService();
export default productService;
