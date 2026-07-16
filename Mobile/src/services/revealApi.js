import { apiRequest } from './api';

export function requestReveal(roomId, userId) {
  return apiRequest(`/Reveal/${roomId}/${userId}`, { method: 'POST' });
}

export function getRevealStatus(roomId) {
  return apiRequest(`/Reveal/${roomId}`);
}

export function getRevealedIdentity(roomId, userId) {
  return apiRequest(`/Reveal/${roomId}/identity/${userId}`);
}