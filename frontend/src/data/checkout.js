/**
 * Opciones del checkout.
 *
 * Los valores (`standard`, `card`…) son exactamente los que aceptan los ENUM
 * de `sales.shipping_method` y `sales.payment_method`, y los importes son los
 * mismos que aplica `app/services/sale.py`. Aquí están para mostrarlos; el
 * cobro real lo calcula siempre el servidor.
 */

export const FREE_SHIPPING_THRESHOLD = 150000;

export const shippingOptions = [
  {
    value: 'standard',
    label: 'Envío estándar',
    description: 'Llega en 2 a 4 días hábiles. Gratis desde $150.000 en productos.',
    cost: 12000,
  },
  {
    value: 'express',
    label: 'Envío exprés',
    description: 'Llega en 24 horas dentro de la ciudad.',
    cost: 20000,
  },
  {
    value: 'pickup',
    label: 'Recoger en tienda',
    description: 'Retíralo en nuestro atelier sin costo de envío.',
    cost: 0,
  },
];

/**
 * Métodos de pago. La pasarela no está integrada: el checkout solo registra
 * cuál eligió el cliente y **nunca pide datos de tarjeta**.
 */
export const paymentMethods = [
  { value: 'card', label: 'Tarjeta de crédito o débito', description: 'Visa, Mastercard o American Express.' },
  { value: 'pse', label: 'PSE', description: 'Débito desde tu cuenta bancaria.' },
  { value: 'nequi', label: 'Nequi', description: 'Paga desde la aplicación con tu celular.' },
  { value: 'cash', label: 'Efectivo contra entrega', description: 'Pagas al recibir el pedido.' },
];

/** Cuánto cuesta el envío elegido, con la misma regla que aplica el servidor. */
export function estimateShippingCost(method, productsSubtotal) {
  if (productsSubtotal <= 0) return 0;
  if (method === 'pickup') return 0;
  if (method === 'standard' && productsSubtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return shippingOptions.find((option) => option.value === method)?.cost ?? 0;
}

export default { shippingOptions, paymentMethods, estimateShippingCost };
