// 인증 관련 API 서비스
import { API_BASE_URL, getAuthHeaders, saveAuthToken, removeAuthToken, saveUserId } from './apiConfig';

// ==================== 회원가입 관련 API ====================

// 1. 이메일 인증 코드 발송
export const sendVerificationCode = async (email) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/auth/send-verification-code?email=${encodeURIComponent(email)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200) {
      return { success: true };
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || '인증 코드 발송 실패');
    }
  } catch (error) {
    console.error('인증 코드 발송 에러:', error);
    throw error;
  }
};

// 2. 이메일 인증 코드 확인
export const verifyCode = async (email, code) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/auth/verify-code?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200) {
      const result = await response.text();
      return { success: true, message: result };
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || '인증 코드 확인 실패');
    }
  } catch (error) {
    console.error('인증 코드 확인 에러:', error);
    throw error;
  }
};

// 3. 회원가입
export const signup = async (username, email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    if (response.status === 200) {
      return { success: true };
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || '회원가입 실패');
    }
  } catch (error) {
    console.error('회원가입 에러:', error);
    throw error;
  }
};

// ==================== 로그인 관련 API ====================

// 로그인
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (response.status === 200) {
      const data = await response.json();
      // 토큰 저장
      if (data.accessToken) {
        await saveAuthToken(data.accessToken);
      }
      // 사용자 ID 저장 (응답에 userId가 있는 경우)
      if (data.userId || data.id || data.user_id) {
        await saveUserId(data.userId || data.id || data.user_id);
      }
      return {
        success: true,
        accessToken: data.accessToken,
        userId: data.userId || data.id || data.user_id,
      };
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || '로그인 실패');
    }
  } catch (error) {
    console.error('로그인 에러:', error);
    throw error;
  }
};

// 로그아웃
export const logout = async () => {
  try {
    await removeAuthToken();
    return { success: true };
  } catch (error) {
    console.error('로그아웃 에러:', error);
    throw error;
  }
};

