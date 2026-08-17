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

export function getMyReports() {
  return apiRequest('/ChatReports/my');
}

export function getAdminReports({ page = 1, pageSize = 10, status = '', type = '', sortOrder = 'desc' } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sortBy: 'createdAt',
    sortOrder,
  });

  if (status) params.set('status', status);
  if (type) params.set('type', type);

  return apiRequest(`/ChatReports?${params.toString()}`);
}

export function banReportedUser(reportId) {
  return apiRequest(`/ChatReports/${reportId}/ban`, { method: 'POST' });
}

export function unbanReportedUser(reportId) {
  return apiRequest(`/ChatReports/${reportId}/unban`, { method: 'POST' });
}

// Badge kiểu Zalo trên nút "ADMIN REPORTS" ở HomeScreen.
export function getUnreadReportCount() {
  return apiRequest('/ChatReports/unread-count');
}

// Gọi khi Admin mở AdminReportListScreen -> badge biến mất.
export function markReportsSeen() {
  return apiRequest('/ChatReports/mark-seen', { method: 'POST' });
}

export function updateReportStatus(reportId, status) {
  return apiRequest(`/ChatReports/${reportId}`, {
    method: 'PUT',
    body: JSON.stringify({ Status: status }),
  });
}

export function deleteReport(reportId) {
  return apiRequest(`/ChatReports/${reportId}`, { method: 'DELETE' });
}

export function logoutRequest() {
  return apiRequest('/Auth/logout', { method: 'POST' });
}

// Soft delete tài khoản — backend bắt xác thực lại mật khẩu trước khi xóa,
// chỉ đánh dấu IsDeleted chứ không xóa data liên quan.
export function deleteAccount(userId, password) {
  return apiRequest(`/Users/${userId}`, {
    method: 'DELETE',
    body: JSON.stringify({ Password: password }),
  });
}

export function getMyProfile() {
  return apiRequest('/Users/me');
}

// ChatRooms.Status là enum bên backend (Waiting/Active/Disconnected/Closed/Expired),
// không có JsonStringEnumConverter nên JSON trả về là số — map lại để hiển thị.
export const ROOM_STATUS_LABELS = ['Waiting', 'Active', 'Disconnected', 'Closed', 'Expired'];

export function getChatHistory(userId) {
  return apiRequest(`/ChatRooms/history/${userId}`);
}

export function getChatRoomDetail(roomId) {
  return apiRequest(`/ChatRooms/${roomId}`);
}

export function getMessages(roomId) {
  return apiRequest(`/Messages/${roomId}`);
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
