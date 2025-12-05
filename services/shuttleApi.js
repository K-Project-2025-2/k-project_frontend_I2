// 셔틀 버스 관련 API 서비스
import { API_BASE_URL, getAuthHeaders } from './apiConfig';

// ==================== 셔틀 노선 관련 API ====================

// 셔틀 노선 목록 조회
export const getShuttleRoutes = async (active = null) => {
  try {
    let url = `${API_BASE_URL}/shuttle/routes`;
    if (active !== null) {
      url += `?active=${active}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      const data = await response.json();
      return data.routes || [];
    } else {
      throw new Error('셔틀 노선 조회 실패');
    }
  } catch (error) {
    console.error('셔틀 노선 조회 에러:', error);
    throw error;
  }
};

// ==================== 셔틀 시간표 관련 API ====================

// 셔틀 시간표 조회
export const getShuttleTimetable = async (routeId, date = null) => {
  try {
    let url = `${API_BASE_URL}/shuttle/timetable?routeId=${routeId}`;
    if (date) {
      url += `&date=${encodeURIComponent(date)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else {
      throw new Error('셔틀 시간표 조회 실패');
    }
  } catch (error) {
    console.error('셔틀 시간표 조회 에러:', error);
    throw error;
  }
};

// ==================== 셔틀 위치 관련 API ====================

// 셔틀 위치 조회
export const getShuttleLocations = async (routeId = null) => {
  try {
    let url = `${API_BASE_URL}/shuttle/locations`;
    if (routeId !== null) {
      url += `?routeId=${routeId}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      const data = await response.json();
      return data.buses || [];
    } else {
      throw new Error('셔틀 위치 조회 실패');
    }
  } catch (error) {
    console.error('셔틀 위치 조회 에러:', error);
    throw error;
  }
};

// ==================== 셔틀 혼잡도 관련 API ====================

// 셔틀 혼잡도 조회
export const getShuttleCongestion = async (routeId = null) => {
  try {
    let url = `${API_BASE_URL}/shuttle/congestion`;
    if (routeId !== null) {
      url += `?routeId=${routeId}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else {
      throw new Error('셔틀 혼잡도 조회 실패');
    }
  } catch (error) {
    console.error('셔틀 혼잡도 조회 에러:', error);
    throw error;
  }
};

// ==================== 즐겨찾기 관련 API ====================

// 즐겨찾기 목록 조회
export const getFavoriteStations = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/shuttle/favorites`, {
      method: 'GET',
      headers,
    });

    if (response.status === 200) {
      const data = await response.json();
      return data.favorites || [];
    } else {
      throw new Error('즐겨찾기 조회 실패');
    }
  } catch (error) {
    console.error('즐겨찾기 조회 에러:', error);
    throw error;
  }
};

// 즐겨찾기 추가
export const addFavoriteStation = async (station) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/shuttle/favorites`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        station,
      }),
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || '즐겨찾기 추가 실패');
    }
  } catch (error) {
    console.error('즐겨찾기 추가 에러:', error);
    throw error;
  }
};

// 즐겨찾기 삭제
export const removeFavoriteStation = async (id) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/shuttle/favorites/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || '즐겨찾기 삭제 실패');
    }
  } catch (error) {
    console.error('즐겨찾기 삭제 에러:', error);
    throw error;
  }
};

