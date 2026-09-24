import { apiRequest } from './api';

function toQueryString(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  }
  const string = query.toString();
  return string ? `?${string}` : '';
}

export function listSales(params) {
  return apiRequest(`/sales${toQueryString(params)}`);
}

export function getSale(id) {
  return apiRequest(`/sales/${id}`);
}

export function getSaleByNumber(saleNumber) {
  return apiRequest(`/sales/number/${saleNumber}`);
}

/**
 * Registra la venta.
 *
 * Solo se envía qué se compra y cuánto: los precios y los totales los calcula
 * el servidor con el catálogo, así que lo que mande el cliente sobre importes
 * se ignora.
 */
export function createSale(data) {
  return apiRequest('/sales', { method: 'POST', body: data });
}

export function updateSaleStatus(id, status) {
  return apiRequest(`/sales/${id}/status`, { method: 'PATCH', body: { status } });
}

export default { listSales, getSale, getSaleByNumber, createSale, updateSaleStatus };
