// 보증금 관련 API 서비스
import { API_BASE_URL, getAuthHeaders } from './apiConfig';

// 보증금 상태 조회
export const getDepositStatus = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/me/deposit`, {
      method: 'GET',
      headers,
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || '보증금 상태 조회 실패');
    }
  } catch (error) {
    console.error('보증금 상태 조회 에러:', error);
    throw error;
  }
};

// 보증금 납부 (추가/재충전)
export const payDeposit = async (amount = 5000) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/me/deposit`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amount,
      }),
    });

    if (response.status === 201 || response.status === 200) {
      const data = await response.json();
      return data;
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || '보증금 납부 실패');
    }
  } catch (error) {
    console.error('보증금 납부 에러:', error);
    throw error;
  }
};

// 보증금 반환
// ⚠️ API 명세서에 없지만 필요함 - 백엔드에 추가 요청 필요
export const refundDeposit = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/me/deposit/refund`, {
      method: 'POST',
      headers,
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || '보증금 반환 실패');
    }
  } catch (error) {
    console.error('보증금 반환 에러:', error);
    throw error;
  }
};

