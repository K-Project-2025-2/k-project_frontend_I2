# Swagger에 없는 API 목록

현재 프론트엔드에서 사용 중이지만 Swagger 문서에 정의되지 않은 API들입니다. 백엔드 팀에 추가 요청이 필요합니다.

## 택시 방 관련 API

### 1. 방 목록 조회
- **엔드포인트**: `GET /api/taxi/rooms`
- **설명**: 현재 활성화된 모든 택시 방 목록을 조회합니다.
- **인증**: 불필요
- **응답 예시**:
```json
{
  "rooms": [
    {
      "id": 1,
      "roomCode": "ABC123",
      "meetingPoint": "기흥역",
      "destination": "강남대학교",
      "meetingTime": "2024-01-01T10:00:00",
      "capacity": 4,
      "status": "ACTIVE",
      "memberCount": 2,
      "leaderId": 1
    }
  ]
}
```

### 2. 방 상세 조회
- **엔드포인트**: `GET /api/taxi/rooms/{roomId}`
- **설명**: 특정 방의 상세 정보를 조회합니다.
- **인증**: 불필요
- **파라미터**: `roomId` (path parameter)
- **응답 예시**:
```json
{
  "id": 1,
  "roomCode": "ABC123",
  "meetingPoint": "기흥역",
  "destination": "강남대학교",
  "meetingTime": "2024-01-01T10:00:00",
  "capacity": 4,
  "status": "ACTIVE",
  "memberCount": 2,
  "leaderId": 1,
  "members": [
    {
      "userId": 1,
      "username": "홍길동"
    }
  ]
}
```

### 3. 방 나가기
- **엔드포인트**: `POST /api/taxi/rooms/{roomId}/leave`
- **설명**: 참여자가 방에서 나갑니다. 정산이 완료되지 않은 경우 나가기 불가.
- **인증**: 필요
- **파라미터**: `roomId` (path parameter)
- **응답 예시**:
```json
{
  "message": "방에서 나갔습니다."
}
```
- **에러 응답** (정산 미완료 시):
```json
{
  "error": "모든 참여자의 송금이 완료되어야 방을 나갈 수 있습니다.",
  "code": "SETTLEMENT_INCOMPLETE"
}
```

### 4. 방 종료
- **엔드포인트**: `POST /api/taxi/rooms/{roomId}/close`
- **설명**: 방장이 방을 종료합니다.
- **인증**: 필요 (방장만 가능)
- **파라미터**: `roomId` (path parameter)
- **응답 예시**:
```json
{
  "message": "방이 종료되었습니다."
}
```

## 메시지 관련 API

### 5. 채팅 메시지 전송
- **엔드포인트**: `POST /api/taxi/rooms/{roomId}/messages`
- **설명**: 채팅방에 메시지를 전송합니다.
- **인증**: 필요
- **파라미터**: `roomId` (path parameter)
- **요청 본문**:
```json
{
  "message": "안녕하세요"
}
```
- **응답 예시**:
```json
{
  "messageId": 1,
  "roomId": 1,
  "senderId": 1,
  "senderName": "홍길동",
  "message": "안녕하세요",
  "createdAt": "2024-01-01T10:00:00"
}
```

### 6. 채팅 메시지 조회
- **엔드포인트**: `GET /api/taxi/rooms/{roomId}/messages`
- **설명**: 채팅방의 메시지 목록을 조회합니다.
- **인증**: 불필요
- **파라미터**: 
  - `roomId` (path parameter)
  - `after` (query parameter, optional) - 특정 시간 이후의 메시지만 조회
- **응답 예시**:
```json
{
  "messages": [
    {
      "messageId": 1,
      "roomId": 1,
      "senderId": 1,
      "senderName": "홍길동",
      "message": "안녕하세요",
      "createdAt": "2024-01-01T10:00:00"
    }
  ]
}
```

## 운행 관련 API

### 7. 운행 시작
- **엔드포인트**: `POST /api/taxi/rooms/{roomId}/operation/start`
- **설명**: 방장이 운행을 시작합니다.
- **인증**: 필요 (방장만 가능)
- **파라미터**: `roomId` (path parameter)
- **응답 예시**:
```json
{
  "message": "운행이 시작되었습니다.",
  "operationId": 1
}
```

### 8. 운행 수락
- **엔드포인트**: `POST /api/taxi/rooms/{roomId}/operation/accept`
- **설명**: 참여자가 운행을 수락합니다.
- **인증**: 필요
- **파라미터**: `roomId` (path parameter)
- **응답 예시**:
```json
{
  "message": "운행을 수락했습니다.",
  "acceptedAt": "2024-01-01T10:00:00"
}
```


### 9. 운행 수락 상태 조회
- **엔드포인트**: `GET /api/taxi/rooms/{roomId}/operation/status`
- **설명**: 운행 수락 상태를 조회합니다.
- **인증**: 필요
- **파라미터**: 
  - `roomId` (path parameter)
  - `lastAcceptedAt` (query parameter, optional) - 특정 시간 이후의 수락 정보만 조회
- **응답 예시**:
```json
{
  "roomId": 1,
  "operationStarted": true,
  "acceptedUsers": [1, 2, 3],
  "totalMembers": 4
}
```

### 10. 운행 종료
- **엔드포인트**: `POST /api/taxi/rooms/{roomId}/operation/end`
- **설명**: 방장이 운행을 종료합니다.
- **인증**: 필요 (방장만 가능)
- **파라미터**: `roomId` (path parameter)
- **응답 예시**:
```json
{
  "message": "운행이 종료되었습니다."
}
```

## 정산 관련 API

### 11. 정산 생성
- **엔드포인트**: `POST /api/taxi/rooms/{roomId}/split`
- **설명**: 방장이 정산 금액을 입력합니다.
- **인증**: 필요 (방장만 가능)
- **파라미터**: `roomId` (path parameter)
- **요청 본문**:
```json
{
  "totalAmount": 10000
}
```
- **응답 예시**:
```json
{
  "splitId": 1,
  "roomId": 1,
  "totalAmount": 10000,
  "perPersonAmount": 2500,
  "members": [
    {
      "userId": 1,
      "username": "홍길동",
      "amount": 2500,
      "paid": false
    }
  ]
}
```

### 12. 정산 정보 조회
- **엔드포인트**: `GET /api/taxi/rooms/{roomId}/split`
- **설명**: 정산 정보를 조회합니다.
- **인증**: 불필요
- **파라미터**: `roomId` (path parameter)
- **응답 예시**:
```json
{
  "splitId": 1,
  "roomId": 1,
  "totalAmount": 10000,
  "perPersonAmount": 2500,
  "members": [
    {
      "userId": 1,
      "username": "홍길동",
      "amount": 2500,
      "paid": true
    }
  ]
}
```

### 13. 송금 완료 체크
- **엔드포인트**: `POST /api/taxi/rooms/{roomId}/split/confirm`
- **설명**: 참여자가 송금 완료를 체크합니다.
- **인증**: 필요
- **파라미터**: `roomId` (path parameter)
- **응답 예시**:
```json
{
  "message": "송금 완료가 확인되었습니다."
}
```

## 사용자 관련 API

### 14. 계좌 등록
- **엔드포인트**: `POST /api/users/account` 또는 `POST /me/account`
- **설명**: 사용자의 계좌 정보를 등록합니다.
- **인증**: 필요
- **요청 본문**:
```json
{
  "bank": "국민은행",
  "accountNumber": "1234567890"
}
```
- **응답 예시**:
```json
{
  "message": "계좌가 등록되었습니다.",
  "accountId": 1
}
```

### 15. 계좌 조회
- **엔드포인트**: `GET /api/users/account` 또는 `GET /me/account`
- **설명**: 사용자의 계좌 정보를 조회합니다.
- **인증**: 필요
- **응답 예시**:
```json
{
  "bank": "국민은행",
  "accountNumber": "1234567890"
}
```

### 16. 프로필 수정
- **엔드포인트**: `PUT /api/users/profile` 또는 `PUT /me/profile`
- **설명**: 사용자의 프로필 정보를 수정합니다.
- **인증**: 필요
- **요청 본문**:
```json
{
  "username": "홍길동",
  "password": "newpassword123"
}
```
- **응답 예시**:
```json
{
  "message": "프로필이 수정되었습니다."
}
```

## 참고사항

- 모든 API는 Swagger 문서에 추가되어야 합니다.
- 인증이 필요한 API는 Bearer 토큰을 Authorization 헤더에 포함해야 합니다.
- 에러 응답은 일관된 형식으로 반환되어야 합니다 (예: `{ "message": "에러 메시지" }`).

