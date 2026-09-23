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

/**
 * Adapta el DTO de la API a la forma que consumen ServiceCard/ServiceGrid.
 * A diferencia de los productos, un servicio no tiene rating, oldPrice, badge
 * ni stock: lo que lo distingue es su duración.
 *
 * `id` se queda con el slug (es la `key` de las rejillas); el id numerico de la
 * base de datos viaja en `serviceId`, que es lo que necesitan el carrito y la
 * venta para escribir `sale_details.service_id`.
 */
export function toCardShape(service) {
  return {
    id: service.slug ?? String(service.id),
    serviceId: service.id,
    slug: service.slug,
    name: service.name,
    description: service.description ?? '',
    category: service.category?.slug ?? null,
    categoryName: service.category?.name ?? '',
    price: service.price,
    durationMinutes: service.durationMinutes,
    image: service.imageUrl,
  };
}

export default { listServices, getService, createService, updateService, updateServiceStatus, deleteService, toCardShape };
