// 마이페이지 관련 API 서비스
import { API_BASE_URL, getAuthHeaders } from './apiConfig';

// ==================== 프로필 관련 API ====================

// 프로필 조회
// ✅ Swagger: GET /me
export const getMyProfile = async () => {
  try {
    // 인증 헤더 가져오기
    const headers = await getAuthHeaders();
    
    // 디버깅: 요청 URL과 헤더 확인
    const url = `${API_BASE_URL}/me`;
    console.log('프로필 조회 요청:', url);
    console.log('인증 헤더:', headers.Authorization ? '있음' : '없음');
    
    let response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers,
      });
    } catch (fetchError) {
      // fetch 자체가 실패한 경우 (네트워크 에러, CORS 등)
      console.error('프로필 조회 Fetch 에러:', fetchError);
      console.error('에러 타입:', fetchError.constructor.name);
      console.error('에러 메시지:', fetchError.message);
      
      // 네트워크 에러는 조용히 처리 (프로필 조회 실패해도 앱은 계속 동작)
      if (fetchError.message && (
        fetchError.message.includes('Network request failed') ||
        fetchError.message.includes('Failed to fetch') ||
        fetchError.message.includes('NetworkError') ||
        fetchError.message.includes('status provided (0)')
      )) {
        console.warn('네트워크 연결 실패 - 프로필 조회 건너뜀');
        return null;
      }
      throw fetchError;
    }

    // 네트워크 에러 체크
    if (!response) {
      console.warn('프로필 조회: 서버 응답 없음');
      return null;
    }

    // response.status가 유효한 범위에 있는지 확인
    if (response.status === 0 || response.status < 200 || response.status >= 600) {
      console.warn('프로필 조회: 유효하지 않은 응답 상태:', response.status);
      return null;
    }

    // 디버깅: 응답 상태 확인
    console.log('프로필 조회 응답 상태:', response.status);

    if (response.status === 200) {
      const responseText = await response.text();
      
      // 응답이 비어있는 경우 처리
      if (!responseText || responseText.trim() === '') {
        console.warn('프로필 조회 응답이 비어있습니다.');
        return null;
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('프로필 조회 성공:', data);
        return data;
      } catch (parseError) {
        console.error('프로필 조회 JSON 파싱 에러:', parseError, '응답 텍스트:', responseText);
        return null;
      }
    } else if (response.status === 401) {
      // 인증 실패
      console.warn('프로필 조회: 인증 실패 (401)');
      return null;
    } else {
      // 기타 에러
      const responseText = await response.text().catch(() => '');
      let error;
      try {
        error = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        error = { message: responseText || '프로필 조회 실패' };
      }
      console.warn('프로필 조회 실패:', response.status, error.message || '알 수 없는 오류');
      return null;
    }
  } catch (error) {
    console.error('프로필 조회 에러:', error);
    // 모든 에러는 조용히 처리 (프로필 조회 실패해도 앱은 계속 동작)
    return null;
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

