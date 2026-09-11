/**
 * Expresiones regulares y reglas de validación reutilizables.
 *
 * Cada regla es un objeto declarativo que consume el hook `useForm`:
 *   { label, required, minLength, maxLength, pattern, sanitize, match, validate, messages }
 *
 * - `sanitize` se aplica ANTES de validar, mientras el usuario escribe:
 *   bloquea caracteres no permitidos y limita la longitud máxima.
 * - `validate` permite reglas compuestas (por ejemplo, la fortaleza de la contraseña).
 */

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

/* ------------------------------------------------------------------ */
/* Sanitizadores: restringen los caracteres que el usuario puede teclear */
/* ------------------------------------------------------------------ */

/** Deja solo letras (con tildes y ñ), espacios y apóstrofos. */
export const sanitizeName = (value) =>
  value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]/g, '').replace(/\s{2,}/g, ' ');

/** Deja solo dígitos. */
export const sanitizeDigits = (value) => value.replace(/\D/g, '');

/** Deja letras y números, sin espacios (pasaportes). */
export const sanitizeAlphanumeric = (value) => value.replace(/[^A-Za-z0-9]/g, '');

/** Quita espacios y pasa a minúsculas: los correos no distinguen mayúsculas. */
export const sanitizeEmail = (value) => value.replace(/\s/g, '').toLowerCase();

/** Las contraseñas no admiten espacios. */
export const sanitizePassword = (value) => value.replace(/\s/g, '');

/** Direcciones: letras, números y la puntuación habitual de una dirección. */
export const sanitizeAddress = (value) =>
  value.replace(/[^\wÁÉÍÓÚÜÑáéíóúüñ\s#\-.,°]/g, '');

/* ------------------------------------------------------------------ */
/* Reglas por tipo de documento                                        */
/* ------------------------------------------------------------------ */

/**
 * El número de documento cambia de formato según el tipo seleccionado,
 * así que su regla se calcula a partir del valor actual del formulario.
 */
export function getDocumentNumberRule(documentType) {
  if (documentType === 'PA') {
    return {
      minLength: 6,
      maxLength: 15,
      pattern: REGEX.alphanumeric,
      sanitize: sanitizeAlphanumeric,
      patternMessage: 'El pasaporte solo admite letras y números.',
      lengthMessage: 'El pasaporte debe tener entre 6 y 15 caracteres.',
    };
  }

  if (documentType === 'CE') {
    return {
      minLength: 6,
      maxLength: 15,
      pattern: REGEX.digits,
      sanitize: sanitizeDigits,
      patternMessage: 'El número de documento solo admite dígitos.',
      lengthMessage: 'La cédula de extranjería debe tener entre 6 y 15 dígitos.',
    };
  }

  return {
    minLength: 6,
    maxLength: 12,
    pattern: REGEX.digits,
    sanitize: sanitizeDigits,
    patternMessage: 'El número de documento solo admite dígitos.',
    lengthMessage: 'El número de documento debe tener entre 6 y 12 dígitos.',
  };
}

/* ------------------------------------------------------------------ */
/* Reglas de campo reutilizables                                       */
/* ------------------------------------------------------------------ */

export const nameRule = (label) => ({
  label,
  required: true,
  minLength: 2,
  maxLength: 40,
  pattern: REGEX.name,
  sanitize: sanitizeName,
  messages: {
    required: `El campo ${label.toLowerCase()} es obligatorio.`,
    minLength: `El ${label.toLowerCase()} debe tener al menos 2 caracteres.`,
    maxLength: `El ${label.toLowerCase()} no puede superar los 40 caracteres.`,
    pattern: `El ${label.toLowerCase()} solo admite letras.`,
  },
});

export const emailRule = {
  label: 'Correo electrónico',
  required: true,
  maxLength: 60,
  pattern: REGEX.email,
  sanitize: sanitizeEmail,
  messages: {
    required: 'El correo electrónico es obligatorio.',
    maxLength: 'El correo electrónico no puede superar los 60 caracteres.',
    pattern: 'Escribe un correo válido, por ejemplo: nombre@correo.com',
  },
};

export const phoneRule = {
  label: 'Teléfono',
  required: true,
  minLength: 10,
  maxLength: 10,
  pattern: REGEX.colombianMobile,
  sanitize: sanitizeDigits,
  messages: {
    required: 'El número de teléfono es obligatorio.',
    minLength: 'El teléfono debe tener 10 dígitos.',
    maxLength: 'El teléfono debe tener 10 dígitos.',
    pattern: 'Ingresa un celular colombiano válido de 10 dígitos que inicie en 3.',
  },
};

export const addressRule = {
  label: 'Dirección',
  required: true,
  minLength: 5,
  maxLength: 80,
  pattern: REGEX.address,
  sanitize: sanitizeAddress,
  messages: {
    required: 'La dirección es obligatoria.',
    minLength: 'La dirección debe tener al menos 5 caracteres.',
    maxLength: 'La dirección no puede superar los 80 caracteres.',
    pattern: 'La dirección contiene caracteres no permitidos.',
  },
};

export const passwordRule = {
  label: 'Contraseña',
  required: true,
  minLength: 8,
  maxLength: 32,
  sanitize: sanitizePassword,
  messages: {
    required: 'La contraseña es obligatoria.',
    minLength: 'La contraseña debe tener al menos 8 caracteres.',
    maxLength: 'La contraseña no puede superar los 32 caracteres.',
  },
  validate: (value) => {
    if (!REGEX.hasLowercase.test(value)) return 'Debe incluir al menos una letra minúscula.';
    if (!REGEX.hasUppercase.test(value)) return 'Debe incluir al menos una letra mayúscula.';
    if (!REGEX.hasNumber.test(value)) return 'Debe incluir al menos un número.';
    if (!REGEX.hasSymbol.test(value)) return 'Debe incluir al menos un símbolo (!, @, #, $…).';
    return null;
  },
};

export const confirmPasswordRule = {
  label: 'Confirmar contraseña',
  required: true,
  maxLength: 32,
  sanitize: sanitizePassword,
  match: 'password',
  messages: {
    required: 'Debes confirmar la contraseña.',
    match: 'Las contraseñas no coinciden.',
  },
};

/** Contraseña del login: solo obligatoria (no se revalida la política aquí). */
export const loginPasswordRule = {
  label: 'Contraseña',
  required: true,
  maxLength: 32,
  sanitize: sanitizePassword,
  messages: {
    required: 'La contraseña es obligatoria.',
  },
};

/* ------------------------------------------------------------------ */
/* Reglas de catálogo (productos, servicios, categorías)                */
/* Mismos límites que backendFastAPI/app/schemas/{product,service,category}.py */
/* ------------------------------------------------------------------ */

/** Precio requerido: entero o decimal, entre 0 y 99 999 999.99. */
export const priceRule = {
  label: 'Precio',
  required: true,
  messages: { required: 'El precio es obligatorio.' },
  validate: (value) => {
    const number = Number(value);
    if (Number.isNaN(number)) return 'Escribe un precio válido.';
    if (number < 0) return 'El precio no puede ser negativo.';
    if (number > 99999999.99) return 'El precio es demasiado alto.';
    return null;
  },
};

/** Precio anterior (oldPrice): opcional, mismas reglas si se escribe algo. */
export const optionalPriceRule = {
  label: 'Precio anterior',
  validate: (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const number = Number(value);
    if (Number.isNaN(number)) return 'Escribe un precio válido.';
    if (number < 0) return 'El precio anterior no puede ser negativo.';
    if (number > 99999999.99) return 'El precio anterior es demasiado alto.';
    return null;
  },
};

/** Stock: opcional, entero ≥ 0. */
export const stockRule = {
  label: 'Stock',
  validate: (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const number = Number(value);
    if (!Number.isInteger(number)) return 'El stock debe ser un número entero.';
    if (number < 0) return 'El stock no puede ser negativo.';
    return null;
  },
};

/** Duración en minutos de un servicio: requerida, entre 1 y 600. */
export const durationRule = {
  label: 'Duración',
  required: true,
  messages: { required: 'La duración es obligatoria.' },
  validate: (value) => {
    const number = Number(value);
    if (!Number.isInteger(number)) return 'La duración debe ser un número entero de minutos.';
    if (number <= 0) return 'La duración debe ser mayor a 0 minutos.';
    if (number > 600) return 'La duración no puede superar los 600 minutos.';
    return null;
  },
};

/** Descripción de longitud variable (2000 en productos/servicios, 255 en categorías). */
export const descriptionRule = (maxLength = 2000) => ({
  label: 'Descripción',
  maxLength,
  messages: { maxLength: `La descripción no puede superar los ${maxLength} caracteres.` },
});

/** URL de imagen: opcional, hasta 500 caracteres. */
export const imageUrlRule = {
  label: 'Imagen (URL)',
  maxLength: 500,
  messages: { maxLength: 'La URL de la imagen es demasiado larga.' },
};

/** Etiqueta de producto ("Nuevo", "Oferta"...): opcional, hasta 40 caracteres. */
export const badgeRule = {
  label: 'Etiqueta',
  maxLength: 40,
  messages: { maxLength: 'La etiqueta no puede superar los 40 caracteres.' },
};

/**
 * Calcula la fortaleza de una contraseña de 0 a 4 para la barra visual.
 * @returns {{score: number, label: string}}
 */
export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '' };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (REGEX.hasUppercase.test(password) && REGEX.hasLowercase.test(password)) score += 1;
  if (REGEX.hasNumber.test(password) && REGEX.hasSymbol.test(password)) score += 1;

  const labels = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Excelente'];
  return { score, label: labels[score] };
}
