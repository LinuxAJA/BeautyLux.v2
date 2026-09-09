import { z } from 'zod';

import {
    addressSchema,
    documentTypeSchema,
    emailSchema,
    nameSchema,
    passwordSchema,
    paginationQuerySchema,
    phoneSchema,
    validateDocumentNumber,
} from './common.js';

export const createUserSchema = z
    .object({
        firstName: nameSchema('Nombre'),
        lastName: nameSchema('Apellido'),
        documentType: documentTypeSchema,
        documentNumber: z.string({ error: 'El número de documento es obligatorio.' }),
        address: addressSchema,
        phone: phoneSchema,
        email: emailSchema,
        password: passwordSchema,
        role: z.enum(['admin', 'employee', 'client'], { error: 'Selecciona un rol válido.' }),
    })
    .superRefine((data, ctx) => validateDocumentNumber(data.documentType, data.documentNumber, ctx));

export const updateUserSchema = z
    .object({
        firstName: nameSchema('Nombre').optional(),
        lastName: nameSchema('Apellido').optional(),
        documentType: documentTypeSchema.optional(),
        documentNumber: z.string().optional(),
        address: addressSchema.optional(),
        phone: phoneSchema.optional(),
        email: emailSchema.optional(),
        role: z.enum(['admin', 'employee', 'client']).optional(),
    })
    .superRefine((data, ctx) => {
        if (data.documentType && data.documentNumber) {
            validateDocumentNumber(data.documentType, data.documentNumber, ctx);
        }
    });

export const updateUserStatusSchema = z.object({
    status: z.enum(['active', 'inactive'], { error: 'El estado debe ser "active" o "inactive".' }),
});

export const listUsersQuerySchema = paginationQuerySchema.extend({
    role: z.enum(['admin', 'employee', 'client']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
});

export default { createUserSchema, updateUserSchema, updateUserStatusSchema, listUsersQuerySchema };
