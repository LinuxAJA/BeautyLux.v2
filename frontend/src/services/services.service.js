import { apiRequest } from './api';

function toQueryString(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  }
  const string = query.toString();
  return string ? `?${string}` : '';
}

export function listServices(params) {
  return apiRequest(`/services${toQueryString(params)}`);
}

export function getService(idOrSlug) {
  return apiRequest(`/services/${idOrSlug}`);
}

export function createService(data) {
  return apiRequest('/services', { method: 'POST', body: data });
}

export function updateService(id, data) {
  return apiRequest(`/services/${id}`, { method: 'PUT', body: data });
}

export function updateServiceStatus(id, status) {
  return apiRequest(`/services/${id}/status`, { method: 'PATCH', body: { status } });
}

export function deleteService(id) {
  return apiRequest(`/services/${id}`, { method: 'DELETE' });
}

export default { listServices, getService, createService, updateService, updateServiceStatus, deleteService };
