import { apiRequest } from './api';

function toQueryString(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  }
  const string = query.toString();
  return string ? `?${string}` : '';
}

export function listUsers(params) {
  return apiRequest(`/users${toQueryString(params)}`);
}

export function getUser(id) {
  return apiRequest(`/users/${id}`);
}

export function createUser(data) {
  return apiRequest('/users', { method: 'POST', body: data });
}

export function updateUser(id, data) {
  return apiRequest(`/users/${id}`, { method: 'PUT', body: data });
}

export function updateUserStatus(id, status) {
  return apiRequest(`/users/${id}/status`, { method: 'PATCH', body: { status } });
}

export function deleteUser(id) {
  return apiRequest(`/users/${id}`, { method: 'DELETE' });
}

export default { listUsers, getUser, createUser, updateUser, updateUserStatus, deleteUser };
