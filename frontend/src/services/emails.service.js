import { apiRequest } from './api';

function toQueryString(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  }
  const string = query.toString();
  return string ? `?${string}` : '';
}

/** Registro de correos enviados (`email_logs`). Solo admin. */
export function listEmailLogs(params) {
  return apiRequest(`/emails/logs${toQueryString(params)}`);
}

/**
 * Envía un correo de prueba en la misma petición y devuelve lo que pasó:
 * `{ status: 'sent' | 'skipped' | 'failed', recipient, attempts, error, logId }`.
 * Sin `to`, el correo va a la cuenta del administrador.
 */
export function sendTestEmail(to) {
  return apiRequest('/emails/test', { method: 'POST', body: to ? { to } : {} });
}

export default { listEmailLogs, sendTestEmail };
