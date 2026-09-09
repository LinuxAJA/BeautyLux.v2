import { z } from 'zod';

import {
    addressSchema,
    documentTypeSchema,
    emailSchema,
    nameSchema,
    passwordSchema,
    phoneSchema,
    validateDocumentNumber,
} from './common.js';

export const registerSchema = z
    .object({
        firstName: nameSchema('Nombre'),
        lastName: nameSchema('Apellido'),
        documentType: documentTypeSchema,
        documentNumber: z.string({ error: 'El número de documento es obligatorio.' }),
        address: addressSchema,
        phone: phoneSchema,
        email: emailSchema,
        password: passwordSchema,
        confirmPassword: z.string({ error: 'Debes confirmar la contraseña.' }),
    })
    .superRefine((data, ctx) => {
        validateDocumentNumber(data.documentType, data.documentNumber, ctx);
        if (data.password !== data.confirmPassword) {
            ctx.addIssue({ code: 'custom', message: 'Las contraseñas no coinciden.', path: ['confirmPassword'] });
        }
    });

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string({ error: 'La contraseña es obligatoria.' }).min(1, 'La contraseña es obligatoria.'),
    remember: z.boolean().optional().default(false),
});

export const updateProfileSchema = z.object({
    firstName: nameSchema('Nombre').optional(),
    lastName: nameSchema('Apellido').optional(),
    address: addressSchema.optional(),
    phone: phoneSchema.optional(),
});

export const changePasswordSchema = z
    .object({
        currentPassword: z.string({ error: 'Debes ingresar tu contraseña actual.' }).min(1),
        newPassword: passwordSchema,
        confirmNewPassword: z.string({ error: 'Debes confirmar la nueva contraseña.' }),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: 'Las contraseñas no coinciden.',
        path: ['confirmNewPassword'],
    });

export const forgotPasswordSchema = z.object({
    email: emailSchema,
});

export const resetPasswordSchema = z
    .object({
        token: z.string({ error: 'El token de recuperación es obligatorio.' }).min(1),
        password: passwordSchema,
        confirmPassword: z.string({ error: 'Debes confirmar la contraseña.' }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Las contraseñas no coinciden.',
        path: ['confirmPassword'],
    });

export default {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
};
