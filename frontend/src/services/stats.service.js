import { apiRequest } from './api';

function toQueryString(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  }
  const string = query.toString();
  return string ? `?${string}` : '';
}

/** Totales del negocio, admin. */
export function getOverview() {
  return apiRequest('/stats/overview');
}

/** Resumen operativo del día, admin y empleado. */
export function getEmployeeSummary() {
  return apiRequest('/stats/employee-summary');
}

/** Lo propio del cliente. */
export function getMySummary() {
  return apiRequest('/stats/my-summary');
}

/** Serie temporal para la gráfica lineal, admin y empleado. */
export function getSalesSeries(params) {
  return apiRequest(`/stats/sales-series${toQueryString(params)}`);
}

/** Ranking para la gráfica de barras, admin. */
export function getTopItems(params) {
  return apiRequest(`/stats/top-items${toQueryString(params)}`);
}

export default { getOverview, getEmployeeSummary, getMySummary, getSalesSeries, getTopItems };
