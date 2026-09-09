import { apiRequest } from './api';

export function listCategories(type) {
  return apiRequest(`/categories${type ? `?type=${type}` : ''}`);
}

export function createCategory(data) {
  return apiRequest('/categories', { method: 'POST', body: data });
}

export function updateCategory(id, data) {
  return apiRequest(`/categories/${id}`, { method: 'PUT', body: data });
}

export function deleteCategory(id) {
  return apiRequest(`/categories/${id}`, { method: 'DELETE' });
}

export default { listCategories, createCategory, updateCategory, deleteCategory };
