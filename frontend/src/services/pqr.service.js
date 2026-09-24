import { apiRequest } from './api';

function toQueryString(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  }
  const string = query.toString();
  return string ? `?${string}` : '';
}

/** Radica una PQR. Funciona con o sin sesión: si hay sesión, queda ligada a la cuenta. */
export function createPqr(data) {
  return apiRequest('/pqr', { method: 'POST', body: data });
}

export function listPqr(params) {
  return apiRequest(`/pqr${toQueryString(params)}`);
}

/** Consulta pública de estado, sin sesión: exige el número de ticket y el correo de contacto. */
export function getPqrByTicket(ticketNumber, email) {
  return apiRequest(`/pqr/${encodeURIComponent(ticketNumber)}${toQueryString({ email })}`);
}

export function updatePqrStatus(id, status) {
  return apiRequest(`/pqr/${id}/status`, { method: 'PATCH', body: { status } });
}

export function respondPqr(id, response) {
  return apiRequest(`/pqr/${id}/response`, { method: 'POST', body: { response } });
}

export default { createPqr, listPqr, getPqrByTicket, updatePqrStatus, respondPqr };
