import { apiRequest, downloadRequest } from './api';

function toQueryString(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  }
  const string = query.toString();
  return string ? `?${string}` : '';
}

export function listInvoices(params) {
  return apiRequest(`/invoices${toQueryString(params)}`);
}

export function getInvoice(id) {
  return apiRequest(`/invoices/${id}`);
}

/** Emisión manual, para una venta ya pagada a la que se le olvidó la factura. */
export function createInvoice(saleId) {
  return apiRequest('/invoices', { method: 'POST', body: { saleId } });
}

/** Devuelve `{ blob, filename }`; quien llama decide qué hacer con ellos. */
export function downloadInvoicePdf(id) {
  return downloadRequest(`/invoices/${id}/pdf`);
}

export default { listInvoices, getInvoice, createInvoice, downloadInvoicePdf };
