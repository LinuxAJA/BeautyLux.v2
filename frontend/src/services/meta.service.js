import { apiRequest } from './api';

export function getRoles() {
  return apiRequest('/roles');
}

export function getAuditLogs(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/audit-logs${query ? `?${query}` : ''}`);
}

export default { getRoles, getAuditLogs };
