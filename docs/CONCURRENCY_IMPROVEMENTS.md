# 채팅방 동시성 및 실시간 통신 개선 방안

## 현재 상태 분석

### 1. 실시간 메시징
- ❌ **현재**: Polling 비활성화, WebSocket 미사용
- ⚠️ **문제**: 메시지가 실시간으로 전달되지 않음
- 📍 **위치**: `screen/ChatScreen.js:150-174`

### 2. 인원 제한 검증
- ❌ **현재**: 클라이언트 측에서만 체크
- ⚠️ **문제**: Race Condition 발생 가능
  - 예: 2/3명 방에 A, B가 동시에 입장 버튼 클릭 → 둘 다 통과 → 4명 입장
- 📍 **위치**: `screen/TaxiScreen.js:348-353`

### 3. 방 상태 동기화
- ❌ **현재**: 사용자 나감/입장이 실시간으로 반영되지 않음
- ⚠️ **문제**: 다른 사용자에게 변경사항이 즉시 전달되지 않음

## 해결 방안

### 1. 서버 측 원자적 검증 (필수)

**백엔드 API 개선 필요:**

```javascript
// services/taxiApi.js - joinRoom 함수 개선
export const joinRoom = async (roomId) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/taxi/rooms/${roomId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
    });

    if (response.status === 200) {
      return await response.json();
    } else if (response.status === 400) {
      const error = await response.json();
      // 서버에서 인원 초과를 확실하게 체크
      throw new Error(error.error || '인원 초과');
    } else if (response.status === 404) {
      throw new Error('Room not found');
    } else {
      throw new Error('방 참여 실패');
    }
  } catch (error) {
    console.error('방 참여 에러:', error);
    throw error;
  }
};
```

**백엔드에서 해야 할 일:**
- 데이터베이스 트랜잭션 사용 (예: `SELECT FOR UPDATE`)
- 원자적 증가 연산 (예: `UPDATE rooms SET current_count = current_count + 1 WHERE current_count < max_members`)
- 낙관적 잠금(Optimistic Locking) 또는 비관적 잠금(Pessimistic Locking) 사용

### 2. 실시간 통신 구현 (권장: WebSocket)

**옵션 1: WebSocket (가장 권장)**
- 실시간 양방향 통신
- 메시지 즉시 전달
- 방 상태 변경 즉시 동기화

**옵션 2: Server-Sent Events (SSE)**
- 서버 → 클라이언트 단방향
- 구현이 간단함
- 메시지 전달에는 충분

**옵션 3: Polling (현재 계획)**
- 구현이 가장 간단
- 서버 부하 증가
- 지연 발생 가능 (3초 간격)

### 3. 클라이언트 측 개선

**낙관적 업데이트 + 서버 검증:**

```javascript
// screen/TaxiScreen.js 개선 예시
const handleJoinRoom = async (room) => {
  // 1. 클라이언트 측 사전 체크 (UX 개선용)
  if (currentCount >= maxMembers) {
    Alert.alert('알림', '인원이 가득 찼습니다.');
    return;
  }

  // 2. 낙관적 업데이트 (즉시 UI 반영)
  const optimisticRoom = {
    ...room,
    current_count: room.current_count + 1,
  };
  setAvailableRooms(prev => 
    prev.map(r => r.room_id === room.room_id ? optimisticRoom : r)
  );

  try {
    // 3. 서버 검증 (실제 입장)
    const response = await joinRoom(room.room_id);
    const actualRoomData = await getRoomDetail(room.room_id);
    
    // 4. 서버 응답으로 UI 업데이트
    setAvailableRooms(prev => 
      prev.map(r => r.room_id === room.room_id ? actualRoomData : r)
    );
    
    // 5. 채팅방으로 이동
    navigateToChat(actualRoomData, false);
  } catch (error) {
    // 6. 실패 시 롤백
    setAvailableRooms(prev => 
      prev.map(r => r.room_id === room.room_id ? room : r)
    );
    Alert.alert('알림', error.message || '입장에 실패했습니다.');
  }
};
```

### 4. 방 상태 실시간 동기화

**WebSocket 이벤트 예시:**

```javascript
// WebSocket 연결 및 이벤트 처리
const ws = new WebSocket('wss://your-api-domain.com/ws/rooms');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'USER_JOINED':
      // 다른 사용자 입장 알림
      updateRoomCount(data.room_id, data.current_count);
      addSystemMessage(data.room_id, `${data.user_name}님이 입장했습니다.`);
      break;
      
    case 'USER_LEFT':
      // 사용자 나감 알림
      updateRoomCount(data.room_id, data.current_count);
      addSystemMessage(data.room_id, `${data.user_name}님이 나갔습니다.`);
      break;
      
    case 'ROOM_FULL':
      // 방이 가득 참
      if (currentRoomId === data.room_id) {
        Alert.alert('알림', '방이 가득 찼습니다.');
      }
      break;
      
    case 'NEW_MESSAGE':
      // 새 메시지 수신
      addMessage(data.message);
      break;
  }
};
```

## 실제 운영 시 체크리스트

### 백엔드 (서버 측)
- [ ] 방 입장 시 원자적 검증 (트랜잭션 사용)
- [ ] 인원 수 증가 시 동시성 제어 (Lock 사용)
- [ ] WebSocket 또는 SSE 구현
- [ ] 방 상태 변경 시 모든 클라이언트에 브로드캐스트
- [ ] 사용자 나감 처리 시 인원 수 감소

### 프론트엔드 (클라이언트 측)
- [ ] 서버 응답 기반으로 UI 업데이트
- [ ] 낙관적 업데이트 + 에러 처리
- [ ] WebSocket 연결 및 재연결 로직
- [ ] 방 목록 실시간 업데이트
- [ ] 네트워크 오류 시 재시도 로직

## 예상 시나리오 테스트

### 시나리오 1: 동시 입장
1. 방 상태: 2/3명
2. 사용자 A와 B가 동시에 입장 버튼 클릭
3. **기대 결과**: 한 명만 입장 성공, 다른 한 명은 "인원 초과" 에러

### 시나리오 2: 사용자 나감 후 입장
1. 방 상태: 3/3명 (가득 참)
2. 사용자 A가 나감 → 2/3명
3. 사용자 B가 입장 시도
4. **기대 결과**: 입장 성공, 다른 사용자들에게 실시간 반영

### 시나리오 3: 실시간 메시지
1. 사용자 A가 메시지 전송
2. **기대 결과**: 다른 사용자들에게 즉시 메시지 표시 (1초 이내)

## 성능 고려사항

- **WebSocket 연결 수**: 동시 접속자 수만큼 연결 필요
- **메시지 전송량**: 사용자당 초당 메시지 수 × 동시 접속자 수
- **서버 부하**: Polling보다 WebSocket이 효율적
- **배터리 소모**: WebSocket이 Polling보다 배터리 효율적

## 결론

현재는 더미 데이터만 사용 중이라 문제가 발생하지 않지만, **실제 운영 시에는 반드시 서버 측 검증과 실시간 통신이 필요합니다.**

가장 중요한 것은:
1. ✅ **서버 측 원자적 검증** (인원 제한)
2. ✅ **WebSocket 또는 SSE** (실시간 통신)
3. ✅ **낙관적 업데이트 + 에러 처리** (UX 개선)


