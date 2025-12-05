// API 설정 및 인증 토큰 관리
import AsyncStorage from '@react-native-async-storage/async-storage';

// API 기본 URL (Swagger 문서 기준)
export const API_BASE_URL = 'http://3.36.32.57:8080';

// 토큰 저장 키
const TOKEN_KEY = '@auth_token';
const USERNAME_KEY = '@username';
const USER_ID_KEY = '@user_id';

// 인증 토큰 가져오기
export const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      return `Bearer ${token}`;
    }
    return null;
  } catch (error) {
    console.error('토큰 가져오기 에러:', error);
    return null;
  }
};

// 인증 토큰 저장
export const saveAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('토큰 저장 에러:', error);
  }
};

// 인증 토큰 삭제
export const removeAuthToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('토큰 삭제 에러:', error);
  }
};

// 사용자 이름 저장
export const saveUsername = async (username) => {
  try {
    await AsyncStorage.setItem(USERNAME_KEY, username);
  } catch (error) {
    console.error('사용자 이름 저장 에러:', error);
  }
};

// 사용자 이름 가져오기
export const getUsername = async () => {
  try {
    const username = await AsyncStorage.getItem(USERNAME_KEY);
    return username;
  } catch (error) {
    console.error('사용자 이름 가져오기 에러:', error);
    return null;
  }
};

// 사용자 이름 삭제
export const removeUsername = async () => {
  try {
    await AsyncStorage.removeItem(USERNAME_KEY);
  } catch (error) {
    console.error('사용자 이름 삭제 에러:', error);
  }
};

// 사용자 ID 저장
export const saveUserId = async (userId) => {
  try {
    await AsyncStorage.setItem(USER_ID_KEY, String(userId));
  } catch (error) {
    console.error('사용자 ID 저장 에러:', error);
  }
};

// 사용자 ID 가져오기
export const getUserId = async () => {
  try {
    const userId = await AsyncStorage.getItem(USER_ID_KEY);
    return userId ? String(userId) : null;
  } catch (error) {
    console.error('사용자 ID 가져오기 에러:', error);
    return null;
  }
};

// 사용자 ID 삭제
export const removeUserId = async () => {
  try {
    await AsyncStorage.removeItem(USER_ID_KEY);
  } catch (error) {
    console.error('사용자 ID 삭제 에러:', error);
  }
};

// 공통 API 요청 헤더 생성
export const getAuthHeaders = async () => {
  const token = await getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': token }),
  };
};
