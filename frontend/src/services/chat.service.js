import { apiRequest } from './api';

export function openConversation() {
  return apiRequest('/chat/conversations', { method: 'POST' });
}

export function listMessages(conversationId, sessionToken) {
  const query = sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : '';
  return apiRequest(`/chat/conversations/${conversationId}/messages${query}`);
}

export function sendMessage(conversationId, content, sessionToken) {
  return apiRequest(`/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: { content, sessionToken },
  });
}

export default { openConversation, listMessages, sendMessage };
