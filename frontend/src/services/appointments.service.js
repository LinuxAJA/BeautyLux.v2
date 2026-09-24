import { apiRequest } from './api';

function toQueryString(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  }
  const string = query.toString();
  return string ? `?${string}` : '';
}

/**
 * Horarios de un día para un servicio. Es público: los horarios se consultan
 * antes de iniciar sesión, igual que el catálogo.
 * `date` va en formato `AAAA-MM-DD`.
 */
export function getAvailability(date, serviceId) {
  return apiRequest(`/appointments/availability${toQueryString({ date, serviceId })}`);
}

export function listAppointments(params) {
  return apiRequest(`/appointments${toQueryString(params)}`);
}

export function getAppointment(id) {
  return apiRequest(`/appointments/${id}`);
}

/** Reserva temporal de una franja mientras se termina el checkout. */
export function holdAppointment(data) {
  return apiRequest('/appointments/hold', { method: 'POST', body: data });
}

export function createAppointment(data) {
  return apiRequest('/appointments', { method: 'POST', body: data });
}

export function rescheduleAppointment(id, data) {
  return apiRequest(`/appointments/${id}/reschedule`, { method: 'PATCH', body: data });
}

export function cancelAppointment(id) {
  return apiRequest(`/appointments/${id}/cancel`, { method: 'PATCH' });
}

export function updateAppointmentStatus(id, status) {
  return apiRequest(`/appointments/${id}/status`, { method: 'PATCH', body: { status } });
}

export default {
  getAvailability,
  listAppointments,
  getAppointment,
  holdAppointment,
  createAppointment,
  rescheduleAppointment,
  cancelAppointment,
  updateAppointmentStatus,
};
