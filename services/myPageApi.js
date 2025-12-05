// 마이페이지 관련 API 서비스
import { API_BASE_URL, getAuthHeaders } from './apiConfig';

// ==================== 프로필 관련 API ====================

// 프로필 조회
// ✅ Swagger: GET /me
export const getMyProfile = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'GET',
      headers,
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || '프로필 조회 실패');
    }
  } catch (error) {
    console.error('프로필 조회 에러:', error);
    throw error;
  }
};

// 프로필 수정
// ✅ Swagger: PUT /me
export const updateMyProfile = async (name, phone, studentId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        name,
        phone,
        studentId,
      }),
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || '프로필 수정 실패');
    }
  } catch (error) {
    console.error('프로필 수정 에러:', error);
    throw error;
  }
};

// ==================== 알림 설정 관련 API ====================

// 알림 설정 조회
// ✅ Swagger: GET /me/notifications
export const getNotificationSettings = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/me/notifications`, {
      method: 'GET',
      headers,
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || '알림 설정 조회 실패');
    }
  } catch (error) {
    console.error('알림 설정 조회 에러:', error);
    throw error;
  }
};

// 알림 설정 수정
// ✅ Swagger: PUT /me/notifications
export const updateNotificationSettings = async (pushNotifications, shuttleAlert, taxiAlert) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/me/notifications`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        push_notifications: pushNotifications,
        shuttle_alert: shuttleAlert,
        taxi_alert: taxiAlert,
      }),
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || '알림 설정 수정 실패');
    }
  } catch (error) {
    console.error('알림 설정 수정 에러:', error);
    throw error;
  }
};

// ==================== 이용자 신고 관련 API ====================

// 이용자 신고
// ✅ Swagger: POST /me/report
export const reportUser = async (reportedUserId, reason, details) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/me/report`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        reported_user_id: reportedUserId,
        reason,
        details,
      }),
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || '이용자 신고 실패');
    }
  } catch (error) {
    console.error('이용자 신고 에러:', error);
    throw error;
  }
};

