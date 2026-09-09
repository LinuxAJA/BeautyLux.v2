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

/** Asuntos del formulario de contacto. */
export const contactSubjects = [
  { value: 'pedido', label: 'Estado de mi pedido' },
  { value: 'producto', label: 'Consulta sobre un producto' },
  { value: 'devolucion', label: 'Cambios y devoluciones' },
  { value: 'mayorista', label: 'Compras al por mayor' },
  { value: 'otro', label: 'Otro tema' },
];

export default documentTypes;
