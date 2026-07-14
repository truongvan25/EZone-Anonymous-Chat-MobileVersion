import { API_BASE_URL } from '../constants/config';
import { getSession } from './storage';

export async function apiRequest(endpoint, options = {}) {
  const { token } = await getSession();

  // FormData tự set Content-Type (kèm boundary) khi fetch gửi đi — nếu ép
  // "application/json" đè lên thì backend không parse được multipart nữa.
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message = typeof data === 'string' ? data : data?.message;
    throw new Error(message || 'Request failed');
  }

  return data;
}

export function login(email, password) {
  return apiRequest('/Auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function registerUser({ fullname, email, password, majorCode }) {
  return apiRequest('/Users/register', {
    method: 'POST',
    body: JSON.stringify({
      Fullname: fullname,
      Email: email,
      Password: password,
      MajorCode: majorCode,
    }),
  });
}

export function activateAccount({ email, code }) {
  return apiRequest('/Users/activate', {
    method: 'POST',
    body: JSON.stringify({ Email: email, Code: code }),
  });
}

export function createReport({ roomId, reporterId, violatingMessage, reason }) {
  return apiRequest('/ChatReports', {
    method: 'POST',
    body: JSON.stringify({
      RoomId: Number(roomId),
      ReporterId: Number(reporterId),
      ReportedUserId: 0,
      ViolatingMessage: violatingMessage || 'Reported from mobile app',
      Reason: reason,
    }),
  });
}

export function getAdminReports({ page = 1, pageSize = 10, status = '', sortOrder = 'desc' } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sortBy: 'createdAt',
    sortOrder,
  });

  if (status) params.set('status', status);

  return apiRequest(`/ChatReports?${params.toString()}`);
}

export function banReportedUser(reportId) {
  return apiRequest(`/ChatReports/${reportId}/ban`, { method: 'POST' });
}

export function deleteReport(reportId) {
  return apiRequest(`/ChatReports/${reportId}`, { method: 'DELETE' });
}

export function logoutRequest() {
  return apiRequest('/Auth/logout', { method: 'POST' });
}

export function getMyProfile() {
  return apiRequest('/Users/me');
}


export function updateProfile(userId, { fullname, gender, majorCode, socialLink, avatarFile }) {
  const form = new FormData();

  form.append('Fullname', fullname ?? '');
  form.append('Gender', gender ?? '');
  form.append('MajorCode', majorCode ?? '');
  form.append('SocialLink', socialLink ?? '');
  
  if (avatarFile) {
    form.append('AvatarFile', {
      uri: avatarFile.uri,
      type: avatarFile.type || 'image/jpeg',
      name: avatarFile.fileName || 'avatar.jpg',
    });
  }

  return apiRequest(`/Users/${userId}`, {
    method: 'PUT',
    body: form,
  });
}
