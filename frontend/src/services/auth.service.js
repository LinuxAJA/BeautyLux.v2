import { apiRequest, setAccessToken } from './api';

export function register(data) {
  return apiRequest('/auth/register', { method: 'POST', body: data, skipAuth: true });
}

export async function login(email, password, remember) {
  const payload = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password, remember },
    skipAuth: true,
  });
  setAccessToken(payload.data.accessToken);
  return payload.data;
}

export async function refreshSession() {
  const payload = await apiRequest('/auth/refresh', { method: 'POST', skipAuth: true });
  setAccessToken(payload.data.accessToken);
  return payload.data;
}

export async function logout() {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } finally {
    setAccessToken(null);
  }
}

export function me() {
  return apiRequest('/auth/me');
}

export function updateProfile(data) {
  return apiRequest('/auth/me', { method: 'PATCH', body: data });
}

export function changePassword(data) {
  return apiRequest('/auth/me/password', { method: 'PATCH', body: data });
}

export function forgotPassword(email) {
  return apiRequest('/auth/forgot-password', { method: 'POST', body: { email }, skipAuth: true });
}

export function resetPassword(data) {
  return apiRequest('/auth/reset-password', { method: 'POST', body: data, skipAuth: true });
}

export default { register, login, refreshSession, logout, me, updateProfile, changePassword, forgotPassword, resetPassword };
