# Swagger에 새로 추가된 택시 API

## ✅ 추가된 API 목록

### 1. 방 나가기
- **엔드포인트**: `POST /api/taxi/rooms/leave`
- **설명**: 참여 중인 택시 합승 방에서 나갑니다. 방장은 퇴장할 수 없습니다.
- **인증**: 필요
- **요청 본문**:
```json
{
  "roomCode": "ABC123"
}
```
- **응답**: `RoomResponse`
- **상태**: ✅ 프론트엔드 코드 업데이트 완료

---

### 2. 메시지 전송
- **엔드포인트**: `POST /api/taxi/rooms/{roomCode}/messages`
- **설명**: 동일 방 코드에 참여 중인 사용자만 메시지를 전송할 수 있습니다.
- **인증**: 필요
- **요청 본문**:
```json
{
  "content": "안녕하세요"
}
```
- **응답**: `ChatMessageResponse`
- **상태**: ✅ 프론트엔드 코드 업데이트 완료

---

### 3. 메시지 조회
- **엔드포인트**: `GET /api/taxi/rooms/{roomCode}/messages`
- **설명**: 동일 방 코드에 참여 중인 사용자만 메시지를 조회할 수 있습니다. 최신 메시지부터 페이지네이션으로 반환됩니다.
- **인증**: 필요
- **Query 파라미터**:
  - `page` (optional): 페이지 번호 (기본값: 0)
  - `size` (optional): 페이지 크기 (기본값: 50, 최대: 200)
- **응답**: `ChatMessageResponse[]` (배열)
- **상태**: ✅ 프론트엔드 코드 업데이트 완료

---

## 주요 변경사항

### 1. roomId → roomCode 변경
- 기존: `roomId` (숫자)를 path parameter로 사용
- 변경: `roomCode` (문자열)를 사용
- 영향: 모든 메시지 관련 API와 방 나가기 API

### 2. 메시지 필드명 변경
- 기존: `message` 필드 사용
- 변경: `content` 필드 사용
- 영향: 메시지 전송 API

### 3. 페이지네이션 지원
- 기존: `after` 파라미터로 시간 기반 조회
- 변경: `page`, `size` 파라미터로 페이지네이션 지원
- 영향: 메시지 조회 API

---

## 업데이트된 파일

1. `services/taxiApi.js`
   - `leaveRoom()` - roomCode를 body로 전달하도록 수정
   - `sendMessage()` - content 필드 사용, roomCode 사용
   - `getMessages()` - page, size 파라미터 사용, roomCode 사용

2. `screen/ChatScreen.js`
   - `handleSend()` - roomCode 사용, 응답 필드명 수정
   - `handleLeaveRoom()` - leaveRoom API 호출 추가

---

## 아직 Swagger에 없는 API

다음 API들은 아직 Swagger에 추가되지 않았습니다:

1. `GET /api/taxi/rooms` - 방 목록 조회
2. `GET /api/taxi/rooms/{roomCode}` - 방 상세 조회
3. `POST /api/taxi/rooms/{roomCode}/close` - 방 종료
4. `POST /api/taxi/rooms/{roomCode}/operation/start` - 운행 시작
5. `POST /api/taxi/rooms/{roomCode}/operation/accept` - 운행 수락
6. `GET /api/taxi/rooms/{roomCode}/operation/status` - 운행 상태 조회
7. `POST /api/taxi/rooms/{roomCode}/operation/end` - 운행 종료
8. `POST /api/taxi/rooms/{roomCode}/split` - 정산 생성
9. `GET /api/taxi/rooms/{roomCode}/split` - 정산 조회
10. `POST /api/taxi/rooms/{roomCode}/split/confirm` - 송금 완료 체크

---

## 테스트 필요 사항

1. 방 나가기 기능 테스트
   - 방장이 아닌 사용자가 방 나가기
   - 정산 완료 후 방 나가기
   - 정산 미완료 시 방 나가기 차단

2. 메시지 전송/조회 테스트
   - 메시지 전송 시 content 필드 사용 확인
   - 메시지 조회 시 페이지네이션 동작 확인
   - roomCode를 올바르게 사용하는지 확인

