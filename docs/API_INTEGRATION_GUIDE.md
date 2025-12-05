# API 통합 가이드

## 개요

이 문서는 Swagger 문서(`http://3.36.32.57:8080/swagger-ui/index.html`)를 기반으로 프론트엔드 API 호출 코드를 작성한 내용을 정리합니다.

## 생성된 파일

### 1. `services/apiConfig.js`
- API 기본 URL 설정
- 인증 토큰 관리 (AsyncStorage 사용)
- 공통 헤더 생성 함수

### 2. `services/authApi.js`
- 인증 관련 API
  - `sendVerificationCode`: 이메일 인증 코드 발송
  - `verifyCode`: 이메일 인증 코드 확인
  - `signup`: 회원가입
  - `login`: 로그인
  - `logout`: 로그아웃

### 3. `services/shuttleApi.js`
- 셔틀 버스 관련 API
  - `getShuttleRoutes`: 셔틀 노선 조회
  - `getShuttleTimetable`: 셔틀 시간표 조회
  - `getShuttleLocations`: 셔틀 위치 조회
  - `getShuttleCongestion`: 셔틀 혼잡도 조회
  - `getFavoriteStations`: 즐겨찾기 조회
  - `addFavoriteStation`: 즐겨찾기 추가
  - `removeFavoriteStation`: 즐겨찾기 삭제

### 4. `services/taxiApi.js` (수정됨)
- 택시 방 관련 API (Swagger 명세에 맞게 수정)
  - `createRoom`: 방 생성 (Swagger 명세 반영)
  - `joinRoom`: 방 참여 (Swagger 명세 반영)
  - `getRooms`: 방 목록 조회 (⚠️ Swagger에 없음)
  - `getRoomDetail`: 방 상세 조회 (⚠️ Swagger에 없음)
  - `closeRoom`: 방 종료 (⚠️ Swagger에 없음)
  - `sendMessage`: 메시지 전송 (⚠️ Swagger에 없음)
  - `getMessages`: 메시지 조회 (⚠️ Swagger에 없음)
  - `startOperation`: 운행 시작 (⚠️ Swagger에 없음)
  - `acceptOperation`: 운행 수락 (⚠️ Swagger에 없음)
  - `getOperationStatus`: 운행 상태 조회 (⚠️ Swagger에 없음)
  - `endOperation`: 운행 종료 (⚠️ Swagger에 없음)
  - `createSplit`: 정산 생성 (⚠️ Swagger에 없음)
  - `getSplit`: 정산 조회 (⚠️ Swagger에 없음)
  - `confirmPayment`: 송금 완료 체크 (⚠️ Swagger에 없음)
- 신고 관련 API
  - `reportLostAndFound`: 분실물 신고 (Swagger 명세 반영)
  - `reportUser`: 이용자 신고 (Swagger 명세 반영)

## Swagger에 정의된 API

### 인증 (Auth)
- ✅ `POST /api/auth/send-verification-code` - 이메일 인증 코드 발송
- ✅ `POST /api/auth/verify-code` - 이메일 인증 코드 확인
- ✅ `POST /api/auth/signup` - 회원가입
- ✅ `POST /api/auth/login` - 로그인

### 택시 방 (Taxi Room)
- ✅ `POST /api/taxi/rooms` - 방 생성
- ✅ `POST /api/taxi/rooms/join` - 방 참여

### 신고
- ✅ `POST /lost-and-found` - 분실물 신고
- ✅ `POST /me/report` - 이용자 신고

### 셔틀 버스 (Shuttle)
- ✅ `GET /shuttle/routes` - 셔틀 노선 조회
- ✅ `GET /shuttle/timetable` - 셔틀 시간표 조회
- ✅ `GET /shuttle/locations` - 셔틀 위치 조회
- ✅ `GET /shuttle/congestion` - 셔틀 혼잡도 조회
- ✅ `GET /shuttle/favorites` - 즐겨찾기 조회
- ✅ `POST /shuttle/favorites` - 즐겨찾기 추가
- ✅ `DELETE /shuttle/favorites/{id}` - 즐겨찾기 삭제

## Swagger에 없는 API (백엔드 추가 요청 필요)

자세한 내용은 `docs/MISSING_APIS.md` 파일을 참고하세요.

### 택시 방 관련
- ⚠️ `GET /api/taxi/rooms` - 방 목록 조회
- ⚠️ `GET /api/taxi/rooms/{roomId}` - 방 상세 조회
- ⚠️ `POST /api/taxi/rooms/{roomId}/close` - 방 종료

### 메시지 관련
- ⚠️ `POST /api/taxi/rooms/{roomId}/messages` - 메시지 전송
- ⚠️ `GET /api/taxi/rooms/{roomId}/messages` - 메시지 조회

### 운행 관련
- ⚠️ `POST /api/taxi/rooms/{roomId}/operation/start` - 운행 시작
- ⚠️ `POST /api/taxi/rooms/{roomId}/operation/accept` - 운행 수락
- ⚠️ `GET /api/taxi/rooms/{roomId}/operation/status` - 운행 상태 조회
- ⚠️ `POST /api/taxi/rooms/{roomId}/operation/end` - 운행 종료

### 정산 관련
- ⚠️ `POST /api/taxi/rooms/{roomId}/split` - 정산 생성
- ⚠️ `GET /api/taxi/rooms/{roomId}/split` - 정산 조회
- ⚠️ `POST /api/taxi/rooms/{roomId}/split/confirm` - 송금 완료 체크

### 사용자 관련
- ⚠️ `POST /api/users/account` 또는 `POST /me/account` - 계좌 등록
- ⚠️ `GET /api/users/account` 또는 `GET /me/account` - 계좌 조회
- ⚠️ `PUT /api/users/profile` 또는 `PUT /me/profile` - 프로필 수정

## 사용 방법

### 1. 인증 API 사용 예시

```javascript
import { login, signup, sendVerificationCode, verifyCode } from './services/authApi';

// 로그인
try {
  const result = await login('user@kangnam.ac.kr', 'password123');
  console.log('로그인 성공:', result.accessToken);
} catch (error) {
  console.error('로그인 실패:', error.message);
}

// 회원가입
try {
  // 1. 인증 코드 발송
  await sendVerificationCode('user@kangnam.ac.kr');
  
  // 2. 인증 코드 확인
  await verifyCode('user@kangnam.ac.kr', '123456');
  
  // 3. 회원가입
  await signup('홍길동', 'user@kangnam.ac.kr', 'password123');
} catch (error) {
  console.error('회원가입 실패:', error.message);
}
```

### 2. 택시 방 API 사용 예시

```javascript
import { createRoom, joinRoom, getRooms } from './services/taxiApi';

// 방 생성
try {
  const room = await createRoom(
    '기흥역',                    // meetingPoint
    '강남대학교',                // destination
    '2024-01-01T10:00:00',      // meetingTime (ISO 8601)
    4                           // capacity
  );
  console.log('방 생성 성공:', room);
} catch (error) {
  console.error('방 생성 실패:', error.message);
}

// 방 참여
try {
  const room = await joinRoom('ABC123'); // roomCode
  console.log('방 참여 성공:', room);
} catch (error) {
  console.error('방 참여 실패:', error.message);
}
```

### 3. 셔틀 API 사용 예시

```javascript
import { 
  getShuttleRoutes, 
  getShuttleTimetable,
  getShuttleLocations,
  getShuttleCongestion 
} from './services/shuttleApi';

// 노선 조회
const routes = await getShuttleRoutes(true); // active만 조회

// 시간표 조회
const timetable = await getShuttleTimetable(1, '2024-01-01');

// 위치 조회
const locations = await getShuttleLocations(1);

// 혼잡도 조회
const congestion = await getShuttleCongestion(1);
```

## 주의사항

1. **API_BASE_URL**: 현재 `http://3.36.32.57:8080`로 설정되어 있습니다. 프로덕션 환경에서는 환경 변수로 관리하는 것을 권장합니다.

2. **인증 토큰**: 로그인 시 자동으로 토큰이 저장되며, 이후 API 호출 시 자동으로 헤더에 포함됩니다.

3. **에러 처리**: 모든 API 함수는 에러 발생 시 예외를 throw하므로 try-catch로 처리해야 합니다.

4. **Swagger에 없는 API**: `taxiApi.js`에 있는 일부 함수들은 Swagger에 정의되지 않았습니다. 백엔드 팀에 추가 요청이 필요합니다.

## 다음 단계

1. 각 화면에서 실제 API 호출 코드 연동
2. Swagger에 없는 API에 대한 백엔드 추가 요청
3. 에러 처리 및 로딩 상태 관리 개선
4. 환경 변수를 통한 API_BASE_URL 관리

