import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';

const InviteCodeModal = ({ visible, onClose, onEnter, onCodeFailed, targetRoom = null, allRooms = [] }) => {
  const [inviteCode, setInviteCode] = useState('');

  // 모달이 닫힐 때 초대코드 초기화
  React.useEffect(() => {
    if (!visible) {
      setInviteCode('');
    }
  }, [visible]);

  // 초대코드 입력 후 채팅방 입장
  const handleEnter = () => {
    const trimmedCode = inviteCode.trim();
    
    // 6자리 숫자 검증
    if (!trimmedCode) {
      Alert.alert('알림', '초대코드를 입력해주세요.');
      return;
    }

    if (trimmedCode.length !== 6 || !/^\d{6}$/.test(trimmedCode)) {
      Alert.alert('알림', '존재하지 않는 방입니다');
      setInviteCode('');
      return;
    }

    // 특정 방에 대한 초대코드 검증 (targetRoom이 있는 경우)
    // 채팅방 목록에서 입장 버튼 클릭 시 특정 방의 초대코드 검증
    if (targetRoom && targetRoom.invite_code_enabled) {
      // 문자열 비교 (양쪽 모두 문자열로 변환하여 비교)
      const roomCode = String(targetRoom.invite_code || '').trim();
      const inputCode = String(trimmedCode).trim();
      
      if (roomCode !== inputCode) {
        // 코드가 틀렸을 때 틀린 횟수 증가
        if (onCodeFailed) {
          onCodeFailed(targetRoom.room_id);
        }
        Alert.alert('알림', '코드가 틀렸습니다');
        setInviteCode('');
        return;
      }
      // 초대코드가 맞으면 해당 방으로 입장
      const roomData = {
        ...targetRoom,
        current_count: (targetRoom.current_count || 0) + 1,
      };
      onEnter(roomData, trimmedCode);
      setInviteCode('');
      return;
    }

    // 모든 방 목록에서 초대코드로 방 찾기
    // availableRooms와 participatingRooms를 합쳐서 검색
    console.log('초대코드 검색:', trimmedCode);
    console.log('검색할 방 목록:', allRooms.map(r => ({ id: r.room_id, code: r.invite_code, enabled: r.invite_code_enabled })));
    
    const foundRoom = allRooms.find(
      (room) => {
        // 초대코드가 활성화되어 있고, 초대코드가 일치하는지 확인
        if (!room.invite_code_enabled) return false;
        // 문자열 비교 (양쪽 모두 문자열로 변환하여 비교)
        const roomCode = String(room.invite_code || '').trim();
        const inputCode = String(trimmedCode).trim();
        const isMatch = roomCode === inputCode;
        if (isMatch) {
          console.log('방 찾음:', room.room_id, roomCode);
        }
        return isMatch;
      }
    );

    if (!foundRoom) {
      // 로컬에서 방을 찾지 못했을 때도 백엔드 API를 통해 확인하도록 처리
      // roomData가 null이면 handleInviteCodeEntered에서 백엔드 API를 호출하여 방을 찾도록 함
      console.log('로컬에서 방을 찾을 수 없음, 백엔드 API로 확인 시도');
      const roomData = {
        roomCode: trimmedCode,
        invite_code: trimmedCode,
        invite_code_enabled: true,
      };
      onEnter(roomData, trimmedCode);
      setInviteCode('');
      return;
    }

    // 초대코드가 맞는 방을 찾았으면 해당 방으로 입장
    console.log('입장할 방:', foundRoom.room_id);
    const roomData = {
      ...foundRoom,
      current_count: (foundRoom.current_count || 0) + 1,
    };
    onEnter(roomData, trimmedCode);
    setInviteCode('');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* 모달 헤더 */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>초대코드 입장</Text>
            <View style={styles.cancelButtonPlaceholder} />
          </View>

          {/* 모달 본문 */}
          <View style={styles.modalBody}>
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>초대 코드</Text>
              <TextInput
                style={styles.inputField}
                placeholder="6자리 입력"
                value={inviteCode}
                onChangeText={setInviteCode}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            {/* 채팅 시작하기 버튼 */}
            <TouchableOpacity
              style={styles.enterButton}
              onPress={handleEnter}
            >
              <Text style={styles.enterButtonText}>채팅 시작하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    paddingVertical: 15,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  cancelButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 24,
    color: '#333',
    fontWeight: 'bold',
  },
  cancelButtonPlaceholder: {
    width: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  modalBody: {
    padding: 20,
    backgroundColor: '#E0E0E0',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  inputField: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 6,
    fontSize: 16,
    color: '#333',
  },
  enterButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 15,
    borderRadius: 6,
    alignItems: 'center',
  },
  enterButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default InviteCodeModal;

