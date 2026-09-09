import { z } from 'zod';

export const createCategorySchema = z.object({
    name: z.string({ error: 'El nombre es obligatorio.' }).trim().min(2).max(80),
    description: z.string().trim().max(300).optional(),
    imageUrl: z.string().trim().max(500).optional(),
    type: z.enum(['product', 'service'], { error: 'El tipo debe ser "product" o "service".' }),
    status: z.enum(['active', 'inactive']).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const listCategoriesQuerySchema = z.object({
    type: z.enum(['product', 'service']).optional(),
});

export default { createCategorySchema, updateCategorySchema, listCategoriesQuerySchema };
