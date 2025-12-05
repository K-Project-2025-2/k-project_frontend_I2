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

    // 네트워크 에러 체크
    if (!response || response.status === 0) {
      throw new Error('네트워크 연결에 실패했습니다. 서버에 연결할 수 없습니다.');
    }

    if (response.status === 200) {
      return { success: true };
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || '인증 코드 발송 실패');
    }
  } catch (error) {
    console.error('인증 코드 발송 에러:', error);
    if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed') || error.message.includes('status provided (0)')) {
      throw new Error('네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.');
    }
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

    // 네트워크 에러 체크
    if (!response || response.status === 0) {
      throw new Error('네트워크 연결에 실패했습니다. 서버에 연결할 수 없습니다.');
    }

    if (response.status === 200) {
      const result = await response.text();
      return { success: true, message: result };
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || '인증 코드 확인 실패');
    }
  } catch (error) {
    console.error('인증 코드 확인 에러:', error);
    if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed') || error.message.includes('status provided (0)')) {
      throw new Error('네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.');
    }
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

    // 네트워크 에러 체크
    if (!response || response.status === 0) {
      throw new Error('네트워크 연결에 실패했습니다. 서버에 연결할 수 없습니다.');
    }

    if (response.status === 200) {
      return { success: true };
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || '회원가입 실패');
    }
  } catch (error) {
    console.error('회원가입 에러:', error);
    if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed') || error.message.includes('status provided (0)')) {
      throw new Error('네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.');
    }
    throw error;
  }
};

// ==================== 로그인 관련 API ====================

// 로그인
export const login = async (email, password) => {
  try {
    const url = `${API_BASE_URL}/api/auth/login`;
    console.log('로그인 요청 URL:', url);
    
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
    } catch (fetchError) {
      // fetch 자체가 실패한 경우 (네트워크 에러, CORS 등)
      console.error('로그인 Fetch 에러:', fetchError);
      console.error('에러 타입:', fetchError.constructor.name);
      console.error('에러 메시지:', fetchError.message);
      console.error('에러 스택:', fetchError.stack);
      
      // 네트워크 에러 메시지 개선
      let errorMessage = '네트워크 연결에 실패했습니다.';
      if (fetchError.message) {
        if (fetchError.message.includes('Network request failed')) {
          errorMessage = '네트워크 요청이 실패했습니다. 인터넷 연결과 서버 상태를 확인해주세요.';
        } else if (fetchError.message.includes('Failed to fetch')) {
          errorMessage = '서버에 연결할 수 없습니다. 서버 주소와 네트워크 연결을 확인해주세요.';
        } else if (fetchError.message.includes('status provided (0)')) {
          errorMessage = '서버 응답을 받을 수 없습니다. 서버가 실행 중인지 확인해주세요.';
        }
      }
      throw new Error(errorMessage);
    }

    // 네트워크 에러 체크 (status가 0이거나 response가 없을 때)
    if (!response) {
      throw new Error('서버 응답을 받을 수 없습니다.');
    }

    // response.status가 유효한 범위에 있는지 확인
    if (response.status === 0 || response.status < 200 || response.status >= 600) {
      throw new Error('네트워크 연결에 실패했습니다. 서버에 연결할 수 없습니다.');
    }

    if (response.status === 200) {
      // 헤더에서 토큰 확인 (일부 서버는 헤더에 토큰을 보냄)
      const authHeader = response.headers.get('Authorization') || response.headers.get('authorization');
      const tokenFromHeader = authHeader ? authHeader.replace('Bearer ', '') : null;
      
      const responseText = await response.text();
      
      // 응답이 비어있는 경우 처리
      if (!responseText || responseText.trim() === '') {
        // 헤더에 토큰이 있으면 사용
        if (tokenFromHeader) {
          await saveAuthToken(tokenFromHeader);
          return {
            success: true,
            accessToken: tokenFromHeader,
            userId: null,
          };
        }
        // 응답이 비어있고 헤더에도 토큰이 없으면 성공으로 처리 (일부 서버는 빈 응답을 보냄)
        console.warn('서버 응답이 비어있지만 로그인은 성공했습니다.');
        return {
          success: true,
          accessToken: null,
          userId: null,
        };
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON 파싱 에러:', parseError, '응답 텍스트:', responseText);
        // JSON 파싱 실패해도 헤더에 토큰이 있으면 성공으로 처리
        if (tokenFromHeader) {
          await saveAuthToken(tokenFromHeader);
          return {
            success: true,
            accessToken: tokenFromHeader,
            userId: null,
          };
        }
        throw new Error('서버 응답 형식이 올바르지 않습니다.');
      }
      
      // 토큰 저장 (응답 본문 또는 헤더에서)
      const accessToken = data.accessToken || tokenFromHeader;
      if (accessToken) {
        await saveAuthToken(accessToken);
      }
      // 사용자 ID 저장 (응답에 userId가 있는 경우)
      if (data.userId || data.id || data.user_id) {
        await saveUserId(data.userId || data.id || data.user_id);
      }
      return {
        success: true,
        accessToken: accessToken,
        userId: data.userId || data.id || data.user_id,
      };
    } else {
      const responseText = await response.text().catch(() => '');
      let error;
      try {
        error = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        error = { message: responseText || '로그인 실패' };
      }
      throw new Error(error.message || '로그인 실패');
    }
  } catch (error) {
    console.error('로그인 에러:', error);
    // 네트워크 에러나 기타 에러를 사용자 친화적인 메시지로 변환
    const errorMessage = error.message || error.toString();
    if (errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('Network request failed') ||
        errorMessage.includes('status provided (0)') ||
        errorMessage.includes('NetworkError')) {
      throw new Error('네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.');
    }
    // 이미 처리된 에러는 그대로 전달
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
// ==================== 비밀번호 재설정 관련 API ====================

// 비밀번호 재설정 인증 코드 발송
export const sendPasswordResetCode = async (email) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/auth/password-reset/send-code?email=${encodeURIComponent(email)}`,
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
    console.error('비밀번호 재설정 인증 코드 발송 에러:', error);
    throw error;
  }
};

// 비밀번호 재설정 (인증 코드와 새 비밀번호를 함께 전송)
// Swagger: POST /api/auth/password-reset
export const resetPassword = async (email, code, newPassword) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        code,
        newPassword,
      }),
    });

    if (response.status === 200) {
      const data = await response.json().catch(() => ({}));
      return { success: true, message: data.message || '비밀번호가 재설정되었습니다.' };
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '비밀번호 재설정 실패');
    }
  } catch (error) {
    console.error('비밀번호 재설정 에러:', error);
    throw error;
  }
};


