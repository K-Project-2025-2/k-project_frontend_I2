# 택시 채팅방 기능 추가를 위한 백엔드 API 요청 명세서

## 개요

택시 채팅방의 완전한 기능 구현을 위해 백엔드에 추가 요청이 필요한 API 명세서입니다.

---

## 1. 계좌 정보 조회 및 전송 API

### 1.1 내 계좌 정보 조회

**엔드포인트**: `GET /me/account`

**설명**: 사용자가 마이페이지에 등록한 계좌 정보를 조회합니다.

**인증**: Bearer Token 필요

**요청 본문**: 없음

**응답** (200 OK):
```json
{
  "accountNumber": "123-456-789012",
  "bankName": "KB국민은행",
  "accountHolder": "홍길동"
}
```

**에러 응답**:
- `404 Not Found`: 계좌 정보가 등록되지 않은 경우

---

### 1.2 계좌 정보 전송 (채팅방)

**엔드포인트**: `POST /api/taxi/rooms/{roomCode}/account/send`

**설명**: 방장이 채팅방에 자신의 계좌 정보를 전송합니다.

**인증**: Bearer Token 필요

**경로 파라미터**:
- `roomCode` (string, required): 방 코드

**요청 본문**: 없음 (현재 사용자의 계좌 정보는 토큰에서 가져옴)

**응답** (200 OK):
```json
{
  "roomCode": "ABC123",
  "accountNumber": "123-456-789012",
  "bankName": "KB국민은행",
  "accountHolder": "홍길동",
  "sentAt": "2024-01-01T10:30:00",
  "message": "계좌 정보가 전송되었습니다."
}
```

**에러 응답**:
- `400 Bad Request`: 계좌 정보가 등록되지 않았거나, 방장이 아닌 경우
- `404 Not Found`: 방을 찾을 수 없는 경우
- `403 Forbidden`: 방장이 아닌 경우

---

## 2. 송금 완료 알림 API

### 2.1 송금 완료 알림

**엔드포인트**: `POST /api/taxi/rooms/{roomCode}/payment/complete`

**설명**: 방장 제외 이용자가 송금 완료를 알립니다. 채팅방에 "@@@님 송금완료" 메시지가 표시됩니다.

**인증**: Bearer Token 필요

**경로 파라미터**:
- `roomCode` (string, required): 방 코드

**요청 본문**: 없음 (현재 사용자 정보는 토큰에서 가져옴)

**응답** (200 OK):
```json
{
  "roomCode": "ABC123",
  "userId": 3,
  "userName": "홍길동",
  "completedAt": "2024-01-01T10:35:00",
  "message": "홍길동님 송금완료"
}
```

**에러 응답**:
- `400 Bad Request`: 이미 송금 완료를 알린 경우, 또는 방장인 경우
- `404 Not Found`: 방을 찾을 수 없거나, 정산이 생성되지 않은 경우

---

## 3. 방 인원 수 실시간 업데이트

### 3.1 방 상세 정보 조회 (인원 수 포함)

**엔드포인트**: `GET /api/taxi/rooms/{roomCode}`

**설명**: 방의 상세 정보를 조회합니다. 인원 수가 실시간으로 반영되어야 합니다.

**인증**: Bearer Token 필요

**경로 파라미터**:
- `roomCode` (string, required): 방 코드

**응답** (200 OK):
```json
{
  "roomCode": "ABC123",
  "meetingPoint": "기흥역",
  "destination": "이공관",
  "meetingTime": "2024-01-01T10:00:00",
  "capacity": 4,
  "currentCount": 3,
  "leaderId": 1,
  "status": "ACTIVE",
  "members": [
    {
      "userId": 1,
      "userName": "방장",
      "joinedAt": "2024-01-01T09:00:00"
    },
    {
      "userId": 2,
      "userName": "홍길동",
      "joinedAt": "2024-01-01T09:05:00"
    },
    {
      "userId": 3,
      "userName": "김철수",
      "joinedAt": "2024-01-01T09:10:00"
    }
  ]
}
```

**에러 응답**:
- `404 Not Found`: 방을 찾을 수 없는 경우

**참고**: 이 API는 Polling으로 주기적으로 호출되어 인원 수를 실시간으로 업데이트합니다.

---

## 4. 운행 시작 완료 알림

### 4.1 모든 인원 수락 완료 시 알림

**엔드포인트**: `GET /api/taxi/rooms/{roomCode}/operation/status` (기존 API 활용)

**설명**: 기존 API의 응답에 `isAllAccepted` 필드가 `true`일 때, 프론트엔드에서 "운행이 시작되었습니다." 메시지를 표시합니다.

**응답 예시**:
```json
{
  "roomCode": "ABC123",
  "operationStatus": "ACCEPTED",
  "startedAt": "2024-01-01T10:00:00",
  "totalMembers": 4,
  "acceptedMembers": [
    {
      "userId": 1,
      "userName": "방장",
      "acceptedAt": "2024-01-01T10:00:00"
    },
    {
      "userId": 2,
      "userName": "홍길동",
      "acceptedAt": "2024-01-01T10:05:00"
    },
    {
      "userId": 3,
      "userName": "김철수",
      "acceptedAt": "2024-01-01T10:06:00"
    },
    {
      "userId": 4,
      "userName": "이영희",
      "acceptedAt": "2024-01-01T10:07:00"
    }
  ],
  "acceptedCount": 4,
  "isAllAccepted": true
}
```

---

## 5. 채팅방 나가기 제한 로직

### 5.1 방 나가기 API (기존 API 활용)

**엔드포인트**: `POST /api/taxi/rooms/leave`

**설명**: 기존 API를 사용하되, 다음 조건에서만 나가기를 허용해야 합니다:
- 운행 시작 전 (운행 수락 전)
- 또는 정산 완료 후 (모든 이용자가 송금 완료)

**에러 응답 추가**:
- `400 Bad Request`: 운행 수락 후 정산 완료 전에는 나갈 수 없음
  ```json
  {
    "error": "운행이 시작되어 정산 완료 전까지는 나갈 수 없습니다.",
    "message": "정산이 완료되어야 채팅방을 나갈 수 있습니다."
  }
  ```

---

## 요약

### 새로 추가해야 할 API
1. `GET /me/account` - 내 계좌 정보 조회
2. `POST /api/taxi/rooms/{roomCode}/account/send` - 계좌 정보 전송
3. `POST /api/taxi/rooms/{roomCode}/payment/complete` - 송금 완료 알림

### 기존 API 개선 필요
1. `GET /api/taxi/rooms/{roomCode}` - 인원 수 실시간 반영
2. `GET /api/taxi/rooms/{roomCode}/operation/status` - `isAllAccepted` 필드 확인
3. `POST /api/taxi/rooms/leave` - 나가기 제한 로직 추가

---

## 우선순위

1. **높음 (즉시 필요)**
   - `POST /api/taxi/rooms/{roomCode}/payment/complete` - 송금 완료 알림
   - `GET /me/account` - 계좌 정보 조회
   - `POST /api/taxi/rooms/{roomCode}/account/send` - 계좌 전송

2. **중간 (곧 필요)**
   - 방 인원 수 실시간 업데이트 개선
   - 채팅방 나가기 제한 로직 추가

3. **낮음 (개선 사항)**
   - WebSocket을 통한 실시간 동기화 (선택 사항)

