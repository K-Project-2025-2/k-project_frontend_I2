// 택시 API 서비스
// 백엔드 API 연동 함수들
import { API_BASE_URL, getAuthHeaders } from './apiConfig';

// ==================== 방 관련 API ====================

// 방 생성 (Swagger 명세에 맞게 수정)
// Swagger: POST /api/taxi/rooms
// 요청: { meetingPoint, destination, meetingTime, capacity, isPublic }
export const createRoom = async (meetingPoint, destination, meetingTime, capacity, isPublic = true) => {
  try {
    const headers = await getAuthHeaders();
    const requestBody = {
      meetingPoint,
      destination,
      meetingTime, // ISO 8601 형식 (예: "2024-01-01T10:00:00")
      capacity,
    };
    
    // isPublic 필드가 있으면 추가
    if (isPublic !== undefined) {
      requestBody.isPublic = isPublic;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/taxi/rooms`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else if (response.status === 400 || response.status === 409) {
      // 400: Bad Request (이미 방이 있는 경우 등)
      // 409: Conflict (이미 방이 있는 경우 등)
      const error = await response.json().catch(() => ({}));
      const errorMessage = error.message || error.error || '기존의 방을 나가주세요.';
      throw new Error(errorMessage);
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '방 생성 실패');
    }
  } catch (error) {
    console.error('방 생성 에러:', error);
    throw error;
  }
};

// 내가 속한 택시 방 목록 조회
// ✅ Swagger: GET /api/taxi/rooms/my
export const getMyRooms = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/taxi/rooms/my`, {
      method: 'GET',
      headers,
    });

    if (response.status === 200) {
      const data = await response.json();
      // 배열로 반환
      return Array.isArray(data) ? data : [];
    } else {
      // 에러 발생 시 빈 배열 반환 (에러를 throw하지 않음)
      const errorText = await response.text().catch(() => '');
      console.log('내 방 목록 조회 실패:', response.status, errorText);
      return [];
    }
  } catch (error) {
    // 네트워크 에러나 기타 에러 발생 시 빈 배열 반환 (에러를 throw하지 않음)
    // console.error('내 방 목록 조회 에러:', error);
    return [];
  }
};

// 방 목록 조회 (전체 공개 방 목록 - Swagger에 없지만 필요시 사용)
// ⚠️ Swagger에 없는 API - 백엔드에 추가 요청 필요
// 모든 택시 방 목록 조회 (Swagger: GET /api/taxi/rooms)
export const getRooms = async () => {
  try {
    const headers = await getAuthHeaders();
    console.log('getRooms API 호출:', `${API_BASE_URL}/api/taxi/rooms`);
    const response = await fetch(`${API_BASE_URL}/api/taxi/rooms`, {
      method: 'GET',
      headers,
    });

    console.log('getRooms 응답 상태:', response.status);
    if (response.status === 200) {
      const data = await response.json();
      console.log('getRooms 응답 데이터:', JSON.stringify(data, null, 2));
      
      // Swagger 명세에 따르면 배열로 반환됨
      if (Array.isArray(data)) {
        console.log('getRooms 반환할 방 개수:', data.length);
        return data;
      } else {
        // 혹시 객체로 감싸져 있을 경우 처리
        const rooms = data.rooms || data.data || [];
        console.log('getRooms 반환할 방 개수:', rooms.length);
        return Array.isArray(rooms) ? rooms : [];
      }
    } else {
      const errorText = await response.text();
      console.log('getRooms 응답 에러:', response.status, errorText);
      return [];
    }
  } catch (error) {
    console.error('전체 방 목록 조회 실패:', error);
    console.error('에러 상세:', error.message, error.stack);
    return [];
  }
};

// 특정 방 정보 조회
// ⚠️ Swagger에 없는 API - 백엔드에 추가 요청 필요
// 에러 발생 시 null을 반환하여 앱이 중단되지 않도록 처리
export const getRoomDetail = async (roomCode) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/taxi/rooms/${roomCode}`, {
      method: 'GET',
      headers,
    });

    if (response.status === 200) {
      const data = await response.json();
      return data.data || data;
    } else if (response.status === 404) {
      console.log('방 정보 조회: 방을 찾을 수 없습니다.');
      return null;
    } else {
      const errorText = await response.text().catch(() => '');
      console.log('방 정보 조회 실패:', response.status, errorText);
      return null;
    }
  } catch (error) {
    // 네트워크 에러나 기타 에러 발생 시 null 반환 (에러 로그는 출력하지 않음)
    // console.error('방 정보 조회 에러:', error);
    return null;
  }
};

// 방 참여 (Swagger 명세에 맞게 수정)
// Swagger: POST /api/taxi/rooms/join
// 요청: { roomCode }
export const joinRoom = async (roomCode) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/taxi/rooms/join`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        roomCode,
      }),
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else if (response.status === 400) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '인원 초과');
    } else if (response.status === 404) {
      throw new Error('Room not found');
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '방 참여 실패');
    }
  } catch (error) {
    console.error('방 참여 에러:', error);
    throw error;
  }
};

// 방 나가기
// ✅ Swagger에 추가됨: POST /api/taxi/rooms/leave
export const leaveRoom = async (roomCode) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/taxi/rooms/leave`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        roomCode,
      }),
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else if (response.status === 400) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '정산이 완료되지 않아 나갈 수 없습니다.');
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '방 나가기 실패');
    }
  } catch (error) {
    console.error('방 나가기 에러:', error);
    throw error;
  }
};

// 방 종료 (방장만 가능)
// ⚠️ Swagger에 없는 API - 백엔드에 추가 요청 필요
export const closeRoom = async (roomId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/taxi/rooms/${roomId}/close`, {
      method: 'POST',
      headers,
    });

    if (response.status === 200) {
      const data = await response.json();
      return data.data || data;
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '방 종료 실패');
    }
  } catch (error) {
    console.error('방 종료 에러:', error);
    throw error;
  }
};

// ==================== 메시지 관련 API ====================

// 채팅 메시지 보내기
// ✅ Swagger에 추가됨: POST /api/taxi/rooms/{roomCode}/messages
export const sendMessage = async (roomCode, content) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/taxi/rooms/${roomCode}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        content, // Swagger 명세: content 필드 사용
      }),
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else if (response.status === 404) {
      throw new Error('Room not found');
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '메시지 전송 실패');
    }
  } catch (error) {
    console.error('메시지 전송 에러:', error);
    throw error;
  }
};

// 채팅 메시지 조회
// ✅ Swagger에 추가됨: GET /api/taxi/rooms/{roomCode}/messages
export const getMessages = async (roomCode, page = 0, size = 50) => {
  try {
    const headers = await getAuthHeaders();
    let url = `${API_BASE_URL}/api/taxi/rooms/${roomCode}/messages?page=${page}&size=${size}`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (response.status === 200) {
      const data = await response.json();
      // Swagger 명세: 배열로 직접 반환하거나 Page 객체로 반환
      // 배열인 경우 그대로 반환, 객체인 경우 content 필드 확인
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.content)) {
        return data; // Page 객체 반환 (content 필드 포함)
      } else {
        return data.messages || data.data || [];
      }
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '메시지 조회 실패');
    }
  } catch (error) {
    console.error('메시지 조회 에러:', error);
    throw error;
  }
};

// ==================== 운행 수락 관련 API ====================

// 운행 시작 API
// ✅ Swagger: POST /api/taxi/rooms/{roomCode}/operation/start
export const startOperation = async (roomCode) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/taxi/rooms/${roomCode}/operation/start`, {
      method: 'POST',
      headers,
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else if (response.status === 400) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '운행 시작 실패');
    } else if (response.status === 404) {
      throw new Error('Room not found');
    } else if (response.status === 403) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '방장만 운행을 시작할 수 있습니다.');
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '운행 시작 실패');
    }
  } catch (error) {
    console.error('운행 시작 에러:', error);
    throw error;
  }
};

// 운행 수락 API
// ✅ Swagger: POST /api/taxi/rooms/{roomCode}/operation/accept
export const acceptOperation = async (roomCode) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/taxi/rooms/${roomCode}/operation/accept`, {
      method: 'POST',
      headers,
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else if (response.status === 400) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '운행 수락 실패');
    } else if (response.status === 404) {
      throw new Error('Room not found');
    } else if (response.status === 403) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '방장은 수락할 수 없습니다.');
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '운행 수락 실패');
    }
  } catch (error) {
    console.error('운행 수락 에러:', error);
    throw error;
  }
};


// ✅ Swagger: POST /api/taxi/rooms/{roomCode}/operation/end
export const endOperation = async (roomCode) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/taxi/rooms/${roomCode}/operation/end`, {
      method: 'POST',
      headers,
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else if (response.status === 400) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '운행 출발 실패');
    } else if (response.status === 404) {
      throw new Error('Room not found');
    } else if (response.status === 403) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '방장만 출발을 확정할 수 있습니다.');
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '운행 출발 실패');
    }
  } catch (error) {
    console.error('운행 출발 에러:', error);
    throw error;
  }
};

// ==================== 정산 관련 API ====================

// 정산 생성 API (방장만 가능)
// ✅ Swagger: POST /api/taxi/rooms/{roomCode}/split
export const createSplit = async (roomCode, totalAmount) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/taxi/rooms/${roomCode}/split`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        totalAmount,
      }),
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else if (response.status === 400) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '정산 생성 실패');
    } else if (response.status === 404) {
      throw new Error('Room not found');
    } else if (response.status === 403) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '방장만 정산을 생성할 수 있습니다.');
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '정산 생성 실패');
    }
  } catch (error) {
    console.error('정산 생성 에러:', error);
    throw error;
  }
};

// 정산 정보 조회 API
// ✅ Swagger: GET /api/taxi/rooms/{roomCode}/split
export const getSplit = async (roomCode) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/taxi/rooms/${roomCode}/split`, {
      method: 'GET',
      headers,
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else if (response.status === 404) {
      throw new Error('정산 정보를 찾을 수 없습니다.');
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '정산 정보 조회 실패');
    }
  } catch (error) {
    console.error('정산 정보 조회 에러:', error);
    throw error;
  }
};

// 송금 완료 체크 API
// ✅ Swagger: POST /api/taxi/rooms/{roomCode}/split/confirm
export const confirmPayment = async (roomCode) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/taxi/rooms/${roomCode}/split/confirm`, {
      method: 'POST',
      headers,
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else if (response.status === 400) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '송금 완료 체크 실패');
    } else if (response.status === 404) {
      throw new Error('정산 정보를 찾을 수 없습니다.');
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '송금 완료 체크 실패');
    }
  } catch (error) {
    console.error('송금 완료 체크 에러:', error);
    throw error;
  }
};

// ==================== 신고 관련 API ====================

// 분실물 신고 (Swagger 명세에 맞게 수정)
// Swagger: POST /lost-and-found
export const reportLostAndFound = async (reportData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/lost-and-found`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        location: reportData.location,
        description: reportData.description,
      }),
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '분실물 신고 실패');
    }
  } catch (error) {
    console.error('분실물 신고 에러:', error);
    throw error;
  }
};

// 이용자 신고 (Swagger 명세에 맞게 수정)
// Swagger: POST /me/report
export const reportUser = async (reportData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/me/report`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        reported_user_id: reportData.reported_user_id,
        reason: reportData.reason,
        details: reportData.details || '',
      }),
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || '이용자 신고 실패');
    }
  } catch (error) {
    console.error('이용자 신고 에러:', error);
    throw error;
  }
};
