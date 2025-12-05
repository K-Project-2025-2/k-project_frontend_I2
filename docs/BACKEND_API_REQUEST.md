# 백엔드 API 추가 요청서

## 개요
프론트엔드 개발 중 필요한 API들이 Swagger 문서에 누락되어 있어 추가 요청드립니다.
현재 Swagger 문서: `http://3.36.32.57:8080/swagger-ui/index.html`

## 우선순위

### 🔴 높음 (즉시 필요)
- 방 목록 조회
- 방 상세 조회
- 메시지 전송/조회

### 🟡 중간 (곧 필요)
- 운행 관련 API (start, accept, status, end)
- 정산 관련 API (split, confirm)
- 방 종료

### 🟢 낮음 (추후 필요)
- 계좌 등록/조회
- 프로필 수정

---

## 상세 API 명세

### 1. 방 목록 조회
```
GET /api/taxi/rooms
인증: 불필요
응답: 200 OK
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
```
GET /api/taxi/rooms/{roomId}
인증: 불필요
Path Parameter: roomId (Long)
응답: 200 OK
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

### 3. 방 종료
```
POST /api/taxi/rooms/{roomId}/close
인증: 필요 (Bearer Token, 방장만 가능)
Path Parameter: roomId (Long)
응답: 200 OK
{
  "message": "방이 종료되었습니다."
}
```

### 4. 채팅 메시지 전송
```
POST /api/taxi/rooms/{roomId}/messages
인증: 필요 (Bearer Token)
Path Parameter: roomId (Long)
Request Body:
{
  "message": "안녕하세요"
}
응답: 201 Created 또는 200 OK
{
  "messageId": 1,
  "roomId": 1,
  "senderId": 1,
  "senderName": "홍길동",
  "message": "안녕하세요",
  "createdAt": "2024-01-01T10:00:00"
}
```

### 5. 채팅 메시지 조회
```
GET /api/taxi/rooms/{roomId}/messages
인증: 불필요
Path Parameter: roomId (Long)
Query Parameter: after (String, optional) - ISO 8601 형식의 시간
응답: 200 OK
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

### 6. 운행 시작
```
POST /api/taxi/rooms/{roomId}/operation/start
인증: 필요 (Bearer Token, 방장만 가능)
Path Parameter: roomId (Long)
응답: 200 OK
{
  "message": "운행이 시작되었습니다.",
  "operationId": 1
}
```

### 7. 운행 수락
```
POST /api/taxi/rooms/{roomId}/operation/accept
인증: 필요 (Bearer Token)
Path Parameter: roomId (Long)
응답: 200 OK
{
  "message": "운행을 수락했습니다.",
  "acceptedAt": "2024-01-01T10:00:00"
}
```

### 8. 운행 수락 상태 조회
```
GET /api/taxi/rooms/{roomId}/operation/status
인증: 필요 (Bearer Token)
Path Parameter: roomId (Long)
Query Parameter: lastAcceptedAt (String, optional) - ISO 8601 형식의 시간
응답: 200 OK
{
  "roomId": 1,
  "operationStarted": true,
  "acceptedUsers": [1, 2, 3],
  "totalMembers": 4
}
```

### 9. 운행 종료
```
POST /api/taxi/rooms/{roomId}/operation/end
인증: 필요 (Bearer Token, 방장만 가능)
Path Parameter: roomId (Long)
응답: 200 OK
{
  "message": "운행이 종료되었습니다."
}
```

### 10. 정산 생성
```
POST /api/taxi/rooms/{roomId}/split
인증: 필요 (Bearer Token, 방장만 가능)
Path Parameter: roomId (Long)
Request Body:
{
  "totalAmount": 10000
}
응답: 200 OK
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

### 11. 정산 정보 조회
```
GET /api/taxi/rooms/{roomId}/split
인증: 불필요
Path Parameter: roomId (Long)
응답: 200 OK
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

### 12. 송금 완료 체크
```
POST /api/taxi/rooms/{roomId}/split/confirm
인증: 필요 (Bearer Token)
Path Parameter: roomId (Long)
응답: 200 OK
{
  "message": "송금 완료가 확인되었습니다."
}
```

### 13. 계좌 등록
```
POST /me/account
인증: 필요 (Bearer Token)
Request Body:
{
  "bank": "국민은행",
  "accountNumber": "1234567890"
}
응답: 200 OK 또는 201 Created
{
  "message": "계좌가 등록되었습니다.",
  "accountId": 1
}
```

### 14. 계좌 조회
```
GET /me/account
인증: 필요 (Bearer Token)
응답: 200 OK
{
  "bank": "국민은행",
  "accountNumber": "1234567890"
}
```

### 15. 프로필 수정
```
PUT /me/profile
인증: 필요 (Bearer Token)
Request Body:
{
  "username": "홍길동",
  "password": "newpassword123"
}
응답: 200 OK
{
  "message": "프로필이 수정되었습니다."
}
```

---

## 참고사항

1. **인증**: Bearer 토큰은 `Authorization` 헤더에 `Bearer {token}` 형식으로 전송됩니다.
2. **에러 응답**: 일관된 형식으로 반환해주세요 (예: `{ "message": "에러 메시지" }`).
3. **Swagger 문서 업데이트**: 위 API들을 Swagger 문서에 추가해주시면 프론트엔드에서 바로 사용할 수 있습니다.
4. **상세 명세**: 더 자세한 내용은 `docs/MISSING_APIS.md` 파일을 참고해주세요.

---

## 문의사항
프론트엔드 개발자에게 문의사항이 있으시면 언제든지 연락주세요.

