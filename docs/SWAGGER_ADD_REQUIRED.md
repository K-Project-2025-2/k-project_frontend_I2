# Swagger에 추가해야 할 API 목록 (요약)

현재 Swagger에 없는 API들을 간단히 정리했습니다.

## 🔴 높음 (즉시 필요)

### 택시 방 관련
1. `GET /api/taxi/rooms` - 방 목록 조회
2. `GET /api/taxi/rooms/{roomCode}` - 방 상세 조회
3. ✅ `POST /api/taxi/rooms/leave` - 방 나가기 (정산 완료 후 가능) **Swagger에 추가됨**
4. `POST /api/taxi/rooms/{roomCode}/close` - 방 종료

### 메시지 관련
5. ✅ `POST /api/taxi/rooms/{roomCode}/messages` - 메시지 전송 **Swagger에 추가됨**
6. ✅ `GET /api/taxi/rooms/{roomCode}/messages` - 메시지 조회 **Swagger에 추가됨**

### 사용자 관련
7. `GET /me/profile` - 프로필 조회
8. `POST /me/account` - 계좌 등록
9. `GET /me/account` - 계좌 조회
10. `PUT /me/password` - 비밀번호 변경

---

## 🟡 중간 (곧 필요)

### 운행 관련
11. `POST /api/taxi/rooms/{roomCode}/operation/start` - 운행 시작
12. `POST /api/taxi/rooms/{roomCode}/operation/accept` - 운행 수락
13. `GET /api/taxi/rooms/{roomCode}/operation/status` - 운행 상태 조회
14. `POST /api/taxi/rooms/{roomCode}/operation/end` - 운행 종료

### 정산 관련
15. `POST /api/taxi/rooms/{roomCode}/split` - 정산 생성
16. `GET /api/taxi/rooms/{roomCode}/split` - 정산 조회
17. `POST /api/taxi/rooms/{roomCode}/split/confirm` - 송금 완료 체크

### 사용자 관련
18. `PUT /me/profile` - 프로필 수정
19. `PUT /me/notifications` - 알림 설정 수정
20. `GET /me/notifications` - 알림 설정 조회
21. `POST /me/inquiries` - 고객센터 문의 등록

---

## 🟢 낮음 (추후 필요)

### 사용자 관련
22. `PUT /me/account` - 계좌 수정
23. `DELETE /me/account` - 계좌 삭제
24. `GET /me/deposit` - 보증금 조회
25. `POST /me/deposit` - 보증금 입금
26. `POST /me/deposit/refund` - 보증금 환불 요청
27. `GET /me/inquiries` - 문의 내역 조회
28. `GET /me/inquiries/{inquiryId}` - 문의 상세 조회

---

## 총 28개 API 필요 (3개 추가 완료 ✅)

**✅ Swagger에 새로 추가된 API:**
- `POST /api/taxi/rooms/leave` - 방 나가기
- `POST /api/taxi/rooms/{roomCode}/messages` - 메시지 전송
- `GET /api/taxi/rooms/{roomCode}/messages` - 메시지 조회

**상세 명세는 다음 파일 참고:**
- `docs/MISSING_APIS.md` - 택시/운행/정산 관련 상세 명세
- `docs/MYPAGE_MISSING_APIS.md` - 마이페이지 관련 상세 명세
- `docs/TAXI_ROOM_FLOW_API.md` - 택시 채팅방 흐름별 API 정리
- `docs/SWAGGER_UPDATED_APIS.md` - 새로 추가된 API 상세 정보
