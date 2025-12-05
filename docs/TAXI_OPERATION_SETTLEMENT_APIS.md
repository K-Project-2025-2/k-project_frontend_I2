# 택시 운행 및 정산 관련 API 상세 명세

## 개요

택시 합승 방에서 운행 시작부터 정산 완료까지의 흐름을 위한 API 명세서입니다.

**✅ 상태**: 모든 API가 Swagger에 추가되었습니다. (확인일: 2024-12-03)

**Swagger URL**: http://3.36.32.57:8080/swagger-ui/index.html

---

## 1. 운행 시작

### `POST /api/taxi/rooms/{roomCode}/operation/start`

**설명**: 방장이 택시 운행을 시작합니다. 운행 시작 후 팀원들은 출발 수락을 해야 합니다.

**인증**: Bearer Token 필요

**경로 파라미터**:
- `roomCode` (string, required): 방 코드

**요청 본문**: 없음

**응답** (200 OK):
```json
{
  "roomCode": "ABC123",
  "operationStatus": "STARTED",
  "startedAt": "2024-01-01T10:00:00",
  "message": "운행이 시작되었습니다."
}
```

**에러 응답**:
- `400 Bad Request`: 방장이 아니거나, 이미 운행이 시작된 경우
- `404 Not Found`: 방을 찾을 수 없는 경우
- `403 Forbidden`: 방장이 아닌 경우

**프론트엔드 동작**:
- 방장만 "운행 시작" 버튼 클릭 가능
- 운행 시작 후 팀원들에게 "출발 수락하기" 버튼 표시
- 방장의 버튼은 "운행 출발"로 변경

---

## 2. 운행 수락

### `POST /api/taxi/rooms/{roomCode}/operation/accept`

**설명**: 팀원이 운행 출발을 수락합니다. 모든 팀원이 수락해야 운행 출발이 가능합니다.

**인증**: Bearer Token 필요

**경로 파라미터**:
- `roomCode` (string, required): 방 코드

**요청 본문**: 없음

**응답** (200 OK):
```json
{
  "roomCode": "ABC123",
  "accepted": true,
  "acceptedAt": "2024-01-01T10:05:00",
  "totalMembers": 4,
  "acceptedCount": 2,
  "message": "운행 출발을 수락했습니다."
}
```

**에러 응답**:
- `400 Bad Request`: 이미 수락했거나, 운행이 시작되지 않은 경우
- `404 Not Found`: 방을 찾을 수 없는 경우
- `403 Forbidden`: 방장인 경우 (방장은 자동으로 수락된 것으로 간주)

**프론트엔드 동작**:
- 팀원만 "출발 수락하기" 버튼 클릭 가능
- 수락 후 "✓ 수락 완료" 표시
- 게이지 바에 수락 인원 수 표시 (예: 2/4)

---

## 3. 운행 상태 조회

### `GET /api/taxi/rooms/{roomCode}/operation/status`

**설명**: 현재 운행 상태와 수락 상태를 조회합니다.

**인증**: Bearer Token 필요

**경로 파라미터**:
- `roomCode` (string, required): 방 코드

**쿼리 파라미터**: 없음

**응답** (200 OK):
```json
{
  "roomCode": "ABC123",
  "operationStatus": "STARTED", // STARTED, ACCEPTED, DEPARTED, ENDED
  "startedAt": "2024-01-01T10:00:00",
  "departedAt": null,
  "endedAt": null,
  "totalMembers": 4,
  "acceptedMembers": [
    {
      "userId": 1,
      "userName": "홍길동",
      "acceptedAt": "2024-01-01T10:05:00"
    },
    {
      "userId": 2,
      "userName": "김철수",
      "acceptedAt": "2024-01-01T10:06:00"
    }
  ],
  "acceptedCount": 2,
  "isAllAccepted": false
}
```

**에러 응답**:
- `404 Not Found`: 방을 찾을 수 없는 경우

**프론트엔드 동작**:
- Polling으로 주기적으로 상태 조회 (예: 3초마다)
- 수락 인원 수가 변경되면 게이지 바 업데이트
- 모든 인원이 수락하면 "수락 완료" 표시

---

## 4. 운행 종료 (출발)

### `POST /api/taxi/rooms/{roomCode}/operation/end`

**설명**: 방장이 운행 출발을 확정합니다. 모든 팀원이 수락한 후에만 가능합니다.

**인증**: Bearer Token 필요

**경로 파라미터**:
- `roomCode` (string, required): 방 코드

**요청 본문**: 없음

**응답** (200 OK):
```json
{
  "roomCode": "ABC123",
  "operationStatus": "DEPARTED",
  "departedAt": "2024-01-01T10:10:00",
  "message": "운행이 출발했습니다."
}
```

**에러 응답**:
- `400 Bad Request`: 모든 팀원이 수락하지 않았거나, 이미 출발한 경우
- `404 Not Found`: 방을 찾을 수 없는 경우
- `403 Forbidden`: 방장이 아닌 경우

**프론트엔드 동작**:
- 방장만 "운행 출발" 버튼 클릭 가능
- 모든 팀원이 수락한 후에만 버튼 활성화
- 출발 후 정산 단계로 진행

---

## 5. 정산 생성

### `POST /api/taxi/rooms/{roomCode}/split`

**설명**: 방장이 총 택시비를 입력하여 정산을 생성합니다. 인원 수에 맞게 자동으로 1인당 금액이 계산됩니다.

**인증**: Bearer Token 필요

**경로 파라미터**:
- `roomCode` (string, required): 방 코드

**요청 본문**:
```json
{
  "totalAmount": 12000
}
```

**응답** (200 OK):
```json
{
  "roomCode": "ABC123",
  "splitId": 1,
  "totalAmount": 12000,
  "memberCount": 4,
  "amountPerPerson": 3000,
  "individualCosts": {
    "1": 3000,
    "2": 3000,
    "3": 3000,
    "4": 3000
  },
  "createdAt": "2024-01-01T10:30:00",
  "status": "PENDING" // PENDING, COMPLETED
}
```

**에러 응답**:
- `400 Bad Request`: 금액이 0 이하이거나, 이미 정산이 생성된 경우
- `404 Not Found`: 방을 찾을 수 없는 경우
- `403 Forbidden`: 방장이 아닌 경우

**프론트엔드 동작**:
- 방장이 총 금액 입력
- 인원 수에 맞게 자동으로 1인당 금액 계산 및 표시
- 정산 메시지가 채팅방에 표시됨

---

## 6. 정산 조회

### `GET /api/taxi/rooms/{roomCode}/split`

**설명**: 현재 방의 정산 정보를 조회합니다.

**인증**: Bearer Token 필요

**경로 파라미터**:
- `roomCode` (string, required): 방 코드

**쿼리 파라미터**: 없음

**응답** (200 OK):
```json
{
  "roomCode": "ABC123",
  "splitId": 1,
  "totalAmount": 12000,
  "memberCount": 4,
  "amountPerPerson": 3000,
  "individualCosts": {
    "1": 3000,
    "2": 3000,
    "3": 3000,
    "4": 3000
  },
  "paidMembers": [1, 2], // 송금 완료한 사용자 ID 목록
  "createdAt": "2024-01-01T10:30:00",
  "status": "PENDING" // PENDING, COMPLETED
}
```

**에러 응답**:
- `404 Not Found`: 방을 찾을 수 없거나, 정산이 생성되지 않은 경우

**프론트엔드 동작**:
- 정산 정보 표시
- 송금 완료한 사용자 목록 표시
- 각 사용자의 송금 완료 여부 확인

---

## 7. 송금 완료 체크

### `POST /api/taxi/rooms/{roomCode}/split/confirm`

**설명**: 사용자가 자신의 송금 완료를 체크합니다. 모든 참여자가 송금 완료하면 정산이 완료됩니다.

**인증**: Bearer Token 필요

**경로 파라미터**:
- `roomCode` (string, required): 방 코드

**요청 본문**: 없음 (현재 사용자 정보는 토큰에서 가져옴)

**응답** (200 OK):
```json
{
  "roomCode": "ABC123",
  "splitId": 1,
  "userId": 3,
  "paidAt": "2024-01-01T10:35:00",
  "allPaid": false, // 모든 참여자가 송금 완료했는지 여부
  "paidCount": 3,
  "totalMembers": 4,
  "message": "송금 완료가 확인되었습니다."
}
```

**에러 응답**:
- `400 Bad Request`: 이미 송금 완료를 체크한 경우
- `404 Not Found`: 방을 찾을 수 없거나, 정산이 생성되지 않은 경우

**프론트엔드 동작**:
- 사용자가 "송금 완료" 버튼 클릭
- 송금 완료한 사용자 목록에 추가
- 모든 참여자가 송금 완료하면 정산 완료 표시
- 정산 완료 후 방 나가기 가능

---

## 전체 흐름 예시

```
1. 방장: POST /api/taxi/rooms/{roomCode}/operation/start
   → 운행 시작

2. 팀원들: POST /api/taxi/rooms/{roomCode}/operation/accept
   → 각자 출발 수락

3. 프론트엔드: GET /api/taxi/rooms/{roomCode}/operation/status (Polling)
   → 수락 상태 확인

4. 방장: POST /api/taxi/rooms/{roomCode}/operation/end
   → 모든 팀원 수락 후 운행 출발

5. 방장: POST /api/taxi/rooms/{roomCode}/split
   → 총 금액 입력하여 정산 생성

6. 프론트엔드: GET /api/taxi/rooms/{roomCode}/split
   → 정산 정보 조회

7. 각 참여자: POST /api/taxi/rooms/{roomCode}/split/confirm
   → 송금 완료 체크

8. 모든 참여자 송금 완료 후
   → 방 나가기 가능 (POST /api/taxi/rooms/leave)
```

---

## 참고사항

- 모든 API는 Bearer Token 인증이 필요합니다.
- `roomCode`는 문자열 타입입니다.
- 에러 응답은 표준 HTTP 상태 코드를 사용합니다.
- 날짜/시간은 ISO 8601 형식 (예: "2024-01-01T10:00:00")을 사용합니다.
- 금액은 정수형 (원 단위)으로 전달합니다.

