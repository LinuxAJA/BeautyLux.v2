/**
 * Envoltorio de `fetch` para hablar con la API de BeautyLux.
 *
 * - Guarda el access token únicamente en memoria (no en localStorage):
 *   se pierde al recargar la página, momento en el que `AuthProvider`
 *   lo recupera llamando a `/auth/refresh` con la cookie httpOnly.
 * - Ante un 401 con code `TOKEN_EXPIRED`, refresca una sola vez (single
 *   flight: las peticiones concurrentes esperan la misma promesa) y
 *   reintenta la petición original.
 */

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

export class ApiError extends Error {
  constructor({ status, code, message, errors }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors ?? [];
  }
}

let accessToken = null;
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function rawRequest(path, { method = 'GET', body, skipAuth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (!skipAuth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      code: payload?.code ?? 'UNKNOWN_ERROR',
      message: payload?.message ?? 'Ocurrió un error inesperado.',
      errors: payload?.errors,
    });
  }

  return payload;
}

/** Refresca el access token una sola vez aunque varias peticiones lo pidan a la vez. */
function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = rawRequest('/auth/refresh', { method: 'POST', skipAuth: true })
      .then((payload) => {
        setAccessToken(payload.data.accessToken);
        return payload.data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/** Punto de entrada usado por los servicios de dominio. */
export async function apiRequest(path, options = {}) {
  try {
    return await rawRequest(path, options);
  } catch (error) {
    const shouldRetry = error instanceof ApiError && error.code === 'TOKEN_EXPIRED' && !options.skipAuth;
    if (!shouldRetry) throw error;

    await refreshAccessToken();
    return rawRequest(path, options);
  }
}

/**
 * Extrae el nombre de archivo de la cabecera `Content-Disposition` que manda
 * el backend (`attachment; filename="FAC-2026-00001.pdf"`).
 */
function filenameFromDisposition(header) {
  if (!header) return null;
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Descarga un binario (PDF, Excel...) en vez de esperar JSON.
 *
 * `rawRequest` da por hecho que la respuesta es JSON — hace `JSON.stringify`
 * del body y `response.json()` de la respuesta — así que no sirve para los
 * archivos que descargan las facturas (etapa 7) y los reportes (etapa 8).
 * Comparte con `apiRequest` el mismo access token en memoria, `credentials:
 * 'include'` y el reintento único ante `TOKEN_EXPIRED`.
 */
async function rawDownload(path, { skipAuth = false } = {}) {
  const headers = {};
  if (!skipAuth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${API_URL}${path}`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const payload = isJson ? await response.json() : null;
    throw new ApiError({
      status: response.status,
      code: payload?.code ?? 'UNKNOWN_ERROR',
      message: payload?.message ?? 'No se pudo descargar el archivo.',
      errors: payload?.errors,
    });
  }

  const blob = await response.blob();
  const filename = filenameFromDisposition(response.headers.get('content-disposition'));
  return { blob, filename };
}

/** Punto de entrada para descargar binarios. Devuelve `{ blob, filename }`. */
export async function downloadRequest(path, options = {}) {
  try {
    return await rawDownload(path, options);
  } catch (error) {
    const shouldRetry = error instanceof ApiError && error.code === 'TOKEN_EXPIRED' && !options.skipAuth;
    if (!shouldRetry) throw error;

    await refreshAccessToken();
    return rawDownload(path, options);
  }
}

export default apiRequest;
