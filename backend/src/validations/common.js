import { z } from 'zod';

/** Expresiones regulares — deben coincidir exactamente con frontend/src/utils/validators.js */
export const REGEX = {
    name: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]+$/,
    email: /^[\w.+-]+@[\w-]+(\.[\w-]+)*\.[A-Za-z]{2,}$/,
    digits: /^\d+$/,
    alphanumeric: /^[A-Za-z0-9]+$/,
    colombianMobile: /^3\d{9}$/,
    address: /^[\wÁÉÍÓÚÜÑáéíóúüñ\s#\-.,°]+$/,
    hasLowercase: /[a-z]/,
    hasUppercase: /[A-Z]/,
    hasNumber: /\d/,
    hasSymbol: /[^A-Za-z0-9]/,
};

export const nameSchema = (label) =>
    z
        .string({ error: `El campo ${label.toLowerCase()} es obligatorio.` })
        .trim()
        .min(2, `El ${label.toLowerCase()} debe tener al menos 2 caracteres.`)
        .max(40, `El ${label.toLowerCase()} no puede superar los 40 caracteres.`)
        .regex(REGEX.name, `El ${label.toLowerCase()} solo admite letras.`);

export const emailSchema = z
    .string({ error: 'El correo electrónico es obligatorio.' })
    .trim()
    .toLowerCase()
    .max(60, 'El correo electrónico no puede superar los 60 caracteres.')
    .regex(REGEX.email, 'Escribe un correo válido, por ejemplo: nombre@correo.com');

export const phoneSchema = z
    .string({ error: 'El número de teléfono es obligatorio.' })
    .regex(REGEX.colombianMobile, 'Ingresa un celular colombiano válido de 10 dígitos que inicie en 3.');

export const addressSchema = z
    .string({ error: 'La dirección es obligatoria.' })
    .trim()
    .min(5, 'La dirección debe tener al menos 5 caracteres.')
    .max(80, 'La dirección no puede superar los 80 caracteres.')
    .regex(REGEX.address, 'La dirección contiene caracteres no permitidos.');

export const documentTypeSchema = z.enum(['CC', 'CE', 'TI', 'PA', 'NIT'], {
    error: 'Selecciona un tipo de documento válido.',
});

/** Reglas de documento por tipo, iguales a getDocumentNumberRule() del frontend. */
export const DOCUMENT_RULES = {
    CC: { min: 6, max: 12, pattern: REGEX.digits, message: 'El número de documento debe tener entre 6 y 12 dígitos.' },
    TI: { min: 6, max: 12, pattern: REGEX.digits, message: 'El número de documento debe tener entre 6 y 12 dígitos.' },
    NIT: { min: 6, max: 12, pattern: REGEX.digits, message: 'El número de documento debe tener entre 6 y 12 dígitos.' },
    CE: { min: 6, max: 15, pattern: REGEX.digits, message: 'La cédula de extranjería debe tener entre 6 y 15 dígitos.' },
    PA: { min: 6, max: 15, pattern: REGEX.alphanumeric, message: 'El pasaporte debe tener entre 6 y 15 caracteres alfanuméricos.' },
};

export function validateDocumentNumber(documentType, documentNumber, ctx) {
    const rule = DOCUMENT_RULES[documentType];
    if (!rule) return;
    if (
        documentNumber.length < rule.min ||
        documentNumber.length > rule.max ||
        !rule.pattern.test(documentNumber)
    ) {
        ctx.addIssue({ code: 'custom', message: rule.message, path: ['documentNumber'] });
    }
}

export const passwordSchema = z
    .string({ error: 'La contraseña es obligatoria.' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(32, 'La contraseña no puede superar los 32 caracteres.')
    .refine((v) => !/\s/.test(v), 'La contraseña no puede contener espacios.')
    .refine((v) => REGEX.hasLowercase.test(v), 'Debe incluir al menos una letra minúscula.')
    .refine((v) => REGEX.hasUppercase.test(v), 'Debe incluir al menos una letra mayúscula.')
    .refine((v) => REGEX.hasNumber.test(v), 'Debe incluir al menos un número.')
    .refine((v) => REGEX.hasSymbol.test(v), 'Debe incluir al menos un símbolo (!, @, #, $…).');

export const idParamSchema = z.object({
    id: z.coerce.number().int().positive('El identificador no es válido.'),
});

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    perPage: z.coerce.number().int().positive().max(100).optional(),
    orderBy: z.string().optional(),
    orderDir: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
    search: z.string().trim().max(100).optional(),
});

export default {
    REGEX,
    nameSchema,
    emailSchema,
    phoneSchema,
    addressSchema,
    documentTypeSchema,
    DOCUMENT_RULES,
    validateDocumentNumber,
    passwordSchema,
    idParamSchema,
    paginationQuerySchema,
};
