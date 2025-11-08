// 택시 API 서비스
// 나중에 백엔드 연동 시 사용할 API 함수들

const API_BASE_URL = 'https://your-api-domain.com'; // 실제 API 주소로 변경 필요

// 인증 토큰 가져오기 (AsyncStorage나 Context에서 가져올 예정)
const getAuthToken = async () => {
  // TODO: 실제 토큰 가져오기 로직 구현
  return 'Bearer token'; // 임시
};

// 방 생성
export const createRoom = async (departure, destination, maxMembers) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/taxi/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify({
        departure,
        destination,
        max_members: maxMembers,
      }),
    });

    if (response.status === 201) {
      return await response.json();
    } else {
      const error = await response.json();
      throw new Error(error.error || '방 생성 실패');
    }
  } catch (error) {
    console.error('방 생성 에러:', error);
    throw error;
  }
};

// 방 목록 조회
export const getRooms = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/taxi/rooms`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      const data = await response.json();
      return data.rooms;
    } else {
      throw new Error('방 목록 조회 실패');
    }
  } catch (error) {
    console.error('방 목록 조회 에러:', error);
    throw error;
  }
};

// 특정 방 정보 조회
export const getRoomDetail = async (roomId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/taxi/rooms/${roomId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      return await response.json();
    } else if (response.status === 404) {
      throw new Error('Room not found');
    } else {
      throw new Error('방 정보 조회 실패');
    }
  } catch (error) {
    console.error('방 정보 조회 에러:', error);
    throw error;
  }
};

// 방 참여
export const joinRoom = async (roomId) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/taxi/rooms/${roomId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
    });

    if (response.status === 200) {
      return await response.json();
    } else if (response.status === 400) {
      const error = await response.json();
      throw new Error(error.error || '인원 초과');
    } else if (response.status === 404) {
      throw new Error('Room not found');
    } else {
      throw new Error('방 참여 실패');
    }
  } catch (error) {
    console.error('방 참여 에러:', error);
    throw error;
  }
};

// 채팅 메시지 보내기
export const sendMessage = async (roomId, message) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/taxi/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify({
        message,
      }),
    });

    if (response.status === 201) {
      return await response.json();
    } else if (response.status === 404) {
      throw new Error('Room not found');
    } else {
      throw new Error('메시지 전송 실패');
    }
  } catch (error) {
    console.error('메시지 전송 에러:', error);
    throw error;
  }
};

// 채팅 메시지 조회
export const getMessages = async (roomId, after = null) => {
  try {
    let url = `${API_BASE_URL}/taxi/rooms/${roomId}/messages`;
    if (after) {
      url += `?after=${after}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      const data = await response.json();
      return data.messages;
    } else {
      throw new Error('메시지 조회 실패');
    }
  } catch (error) {
    console.error('메시지 조회 에러:', error);
    throw error;
  }
};

// 정산 금액 입력 (방장만 가능)
export const createSplit = async (roomId, totalAmount) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/taxi/rooms/${roomId}/split`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify({
        total_amount: totalAmount,
      }),
    });

    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error('정산 생성 실패');
    }
  } catch (error) {
    console.error('정산 생성 에러:', error);
    throw error;
  }
};

// 정산 정보 조회
export const getSplit = async (roomId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/taxi/rooms/${roomId}/split`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error('정산 정보 조회 실패');
    }
  } catch (error) {
    console.error('정산 정보 조회 에러:', error);
    throw error;
  }
};

// 송금 완료 체크
export const confirmPayment = async (roomId) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/taxi/rooms/${roomId}/split/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
    });

    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error('송금 완료 체크 실패');
    }
  } catch (error) {
    console.error('송금 완료 체크 에러:', error);
    throw error;
  }
};

// 방 종료 (방장만 가능)
export const closeRoom = async (roomId) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/taxi/rooms/${roomId}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
    });

    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error('방 종료 실패');
    }
  } catch (error) {
    console.error('방 종료 에러:', error);
    throw error;
  }
};

