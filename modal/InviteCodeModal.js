import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';

const InviteCodeModal = ({ visible, onClose, onEnter }) => {
  const [inviteCode, setInviteCode] = useState('');

  // 초대코드 입력 후 채팅방 입장
  const handleEnter = () => {
    if (!inviteCode.trim()) {
      alert('초대코드를 입력해주세요.');
      return;
    }

    // 실제로는 서버에서 room_id로 방 정보를 조회해야 함 (getRoomDetail API)
    // 여기서는 임시 데이터 생성 (API 명세서 구조에 맞춤)
    const roomId = parseInt(inviteCode.trim());
    const trimmedCode = inviteCode.trim();
    const roomData = {
      room_id: isNaN(roomId) ? Math.floor(1000 + Math.random() * 9000) : roomId,
      departure: '기흥역',
      destination: '이공관',
      current_count: 2,
      max_members: 4,
      host_id: null,
      status: 'OPEN',
      invite_code: trimmedCode,
      invite_code_enabled: true,
      // UI 표시용
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };

    onEnter(roomData);
    setInviteCode('');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
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
                placeholder="입력"
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
    backgroundColor: '#666',
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

