import { apiRequest } from './api';

function toQueryString(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  }
  const string = query.toString();
  return string ? `?${string}` : '';
}

export function listProducts(params) {
  return apiRequest(`/products${toQueryString(params)}`);
}

export function getProduct(idOrSlug) {
  return apiRequest(`/products/${idOrSlug}`);
}

export function createProduct(data) {
  return apiRequest('/products', { method: 'POST', body: data });
}

export function updateProduct(id, data) {
  return apiRequest(`/products/${id}`, { method: 'PUT', body: data });
}

export function updateProductStatus(id, status) {
  return apiRequest(`/products/${id}/status`, { method: 'PATCH', body: { status } });
}

export function deleteProduct(id) {
  return apiRequest(`/products/${id}`, { method: 'DELETE' });
}

/**
 * Adapta el DTO de la API a la forma que ya consumen ProductCard/ProductGrid.
 *
 * `id` se queda con el slug porque es lo que usan las rejillas como `key` y lo
 * que leen las rutas; el id numerico de la base de datos viaja aparte en
 * `productId`, que es lo que necesitan el carrito y, mas adelante, la venta
 * para escribir `sale_details.product_id`.
 */
export function toCardShape(product) {
  return {
    id: product.slug ?? String(product.id),
    productId: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category?.slug ?? null,
    categoryName: product.category?.name ?? '',
    price: product.price,
    oldPrice: product.oldPrice,
    rating: product.rating,
    reviews: product.reviewsCount,
    image: product.imageUrl,
    badge: product.badge,
    stock: product.stock,
  };
}

export default { listProducts, getProduct, createProduct, updateProduct, updateProductStatus, deleteProduct, toCardShape };
