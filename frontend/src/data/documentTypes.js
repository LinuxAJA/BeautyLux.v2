/**
 * Tipos de documento admitidos en el registro de clientes.
 * El formato de validación de cada uno se resuelve en
 * `utils/validators.js` → `getDocumentNumberRule(documentType)`.
 */
export const documentTypes = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'TI', label: 'Tarjeta de identidad' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'NIT', label: 'NIT' },
];

/** Asuntos del formulario de contacto. También los reutiliza el formulario
 * de PQR para el campo `subject`: mismas opciones, mismos textos. */
export const contactSubjects = [
  { value: 'pedido', label: 'Estado de mi pedido' },
  { value: 'producto', label: 'Consulta sobre un producto' },
  { value: 'devolucion', label: 'Cambios y devoluciones' },
  { value: 'mayorista', label: 'Compras al por mayor' },
  { value: 'otro', label: 'Otro tema' },
];

/**
 * Tipos de PQR (petición, queja, reclamo, sugerencia) — mismos valores que
 * el `ENUM` de `pqr.type` en el backend.
 */
export const pqrTypes = [
  { value: 'peticion', label: 'Petición' },
  { value: 'queja', label: 'Queja' },
  { value: 'reclamo', label: 'Reclamo' },
  { value: 'sugerencia', label: 'Sugerencia' },
];

export default documentTypes;
