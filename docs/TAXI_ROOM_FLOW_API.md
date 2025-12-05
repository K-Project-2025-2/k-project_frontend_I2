# 택시 채팅방 흐름별 필요한 API

## 전체 흐름

1. **방 생성** → 목록에 표시
2. **다른 유저들이 들어옴** → 인원 수 표시 (PNG 이미지)
3. **방장이 운행 시작** → 팀원들이 운행 수락
4. **운행 출발** → 방장의 버튼이 "운행 출발"로 변경
5. **도착 시 정산** → 인원에 맞게 정산
6. **채팅방 나가기** → 정산 완료 후 가능
7. **채팅방 내 잡담** → 메시지 전송/조회

---

## 흐름별 필요한 API

### 1. 방 생성 → 목록에 표시

**필요한 API:**
- ✅ `POST /api/taxi/rooms` - 방 생성 (Swagger에 있음, 연동 완료)
- ⚠️ `GET /api/taxi/rooms` - 방 목록 조회 (Swagger에 없음)

**동작:**
- 방 생성 후 목록에 자동으로 표시되어야 함
- 다른 사용자들도 실시간으로 새 방을 볼 수 있어야 함

---

### 2. 다른 유저들이 들어옴 → 인원 수 표시

**필요한 API:**
- ✅ `POST /api/taxi/rooms/join` - 방 참여 (Swagger에 있음, 연동 완료)
- ⚠️ `GET /api/taxi/rooms/{roomId}` - 방 상세 조회 (Swagger에 없음)

**동작:**
- 참여 시 인원 수가 실시간으로 업데이트되어야 함
- MemberCounter 컴포넌트로 인원 수 표시 (PNG 이미지)

---

### 3. 방장이 운행 시작 → 팀원들이 운행 수락

**필요한 API:**
- ⚠️ `POST /api/taxi/rooms/{roomId}/operation/start` - 운행 시작 (Swagger에 없음)
- ⚠️ `POST /api/taxi/rooms/{roomId}/operation/accept` - 운행 수락 (Swagger에 없음)
- ⚠️ `GET /api/taxi/rooms/{roomId}/operation/status` - 운행 수락 상태 조회 (Swagger에 없음)

**동작:**
- 방장만 "운행 시작" 버튼 클릭 가능
- 운행 시작 후 팀원들에게 "출발 수락하기" 버튼 표시
- 모든 팀원이 수락해야 다음 단계로 진행

---

### 4. 운행 출발

**필요한 API:**
- ⚠️ `POST /api/taxi/rooms/{roomId}/operation/end` - 운행 종료 (Swagger에 없음)

**동작:**
- 방장의 버튼이 "운행 시작" → "운행 출발"로 변경
- 운행 출발 후 정산 단계로 진행

---

### 5. 도착 시 정산 → 인원에 맞게 정산

**필요한 API:**
- ⚠️ `POST /api/taxi/rooms/{roomId}/split` - 정산 생성 (Swagger에 없음)
- ⚠️ `GET /api/taxi/rooms/{roomId}/split` - 정산 조회 (Swagger에 없음)
- ⚠️ `POST /api/taxi/rooms/{roomId}/split/confirm` - 송금 완료 체크 (Swagger에 없음)

**동작:**
- 방장이 총 금액 입력
- 인원 수에 맞게 자동으로 1인당 금액 계산
- 각 참여자가 송금 완료 체크
- 모든 참여자가 송금 완료하면 정산 완료

---

### 6. 채팅방 나가기 → 정산 완료 후 가능

**필요한 API:**
- ⚠️ `POST /api/taxi/rooms/{roomId}/leave` - 방 나가기 (Swagger에 없음) ⭐ **새로 추가**

**동작:**
- 정산이 완료되지 않은 경우 나가기 불가
- 정산 완료 후에만 나가기 가능
- 나가면 참여 목록에서 제거되고 인원 수 감소

**에러 처리:**
- 정산 미완료 시: `400 Bad Request` + `"모든 참여자의 송금이 완료되어야 방을 나갈 수 있습니다."`

---

### 7. 채팅방 내 잡담 → 메시지 전송/조회

**필요한 API:**
- ⚠️ `POST /api/taxi/rooms/{roomId}/messages` - 메시지 전송 (Swagger에 없음, 연동 완료)
- ⚠️ `GET /api/taxi/rooms/{roomId}/messages` - 메시지 조회 (Swagger에 없음)

**동작:**
- 실시간으로 메시지 전송/수신
- 메시지 히스토리 조회 (페이징 지원)

---

## 요약: 백엔드에 추가 요청해야 할 API

### 🔴 높음 (즉시 필요)
1. `GET /api/taxi/rooms` - 방 목록 조회
2. `GET /api/taxi/rooms/{roomId}` - 방 상세 조회
3. `POST /api/taxi/rooms/{roomId}/leave` - 방 나가기 ⭐ **새로 추가**
4. `POST /api/taxi/rooms/{roomId}/messages` - 메시지 전송
5. `GET /api/taxi/rooms/{roomId}/messages` - 메시지 조회

### 🟡 중간 (곧 필요)
6. `POST /api/taxi/rooms/{roomId}/operation/start` - 운행 시작
7. `POST /api/taxi/rooms/{roomId}/operation/accept` - 운행 수락
8. `GET /api/taxi/rooms/{roomId}/operation/status` - 운행 상태 조회
9. `POST /api/taxi/rooms/{roomId}/operation/end` - 운행 종료
10. `POST /api/taxi/rooms/{roomId}/split` - 정산 생성
11. `GET /api/taxi/rooms/{roomId}/split` - 정산 조회
12. `POST /api/taxi/rooms/{roomId}/split/confirm` - 송금 완료 체크

---

## 상세 명세

자세한 API 명세는 `docs/MISSING_APIS.md` 파일을 참고하세요.


