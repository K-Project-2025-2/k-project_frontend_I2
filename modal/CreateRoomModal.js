import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { createRoom } from '../services/taxiApi';

// 위치 목록
const LOCATIONS = [
  '기흥3번출',
  '기흥4번출',
  '강대역1번',
  '샬롬관',
  '인사관',
  '이공관',
  '천은관',
  '심전관',
  '교육관',
  '예술관',
];

const CreateRoomModal = ({ visible, onClose, onComplete, nextRoomId = 100, onRoomCreated }) => {
  // 출발지, 도착지 상태 (API 명세서: departure, destination)
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  // 인원 설정 (2, 3, 4) - API 명세서: max_members
  const [maxMembers, setMaxMembers] = useState(4);
  // 초대코드 설정 (ON/OFF)
  const [inviteCodeEnabled, setInviteCodeEnabled] = useState(true);
  // 직접 입력 모드
  const [directInputMode, setDirectInputMode] = useState(false);
  const [directDeparture, setDirectDeparture] = useState('');
  const [directDestination, setDirectDestination] = useState('');
  // 방 생성 완료 화면 표시 여부
  const [showCompleteScreen, setShowCompleteScreen] = useState(false);
  // 생성된 방 데이터
  const [createdRoomData, setCreatedRoomData] = useState(null);
  // 로딩 상태
  const [loading, setLoading] = useState(false);

  // 위치 선택 핸들러
  const handleLocationSelect = (location) => {
    if (location === '직접 입력') {
      setDirectInputMode(true);
      return;
    }

    if (!departure) {
      setDeparture(location);
    } else if (!destination) {
      setDestination(location);
    } else {
      // 둘 다 선택되어 있으면 도착지만 변경
      setDestination(location);
    }
  };

  // 직접 입력 완료
  const handleDirectInputComplete = () => {
    // 출발지와 도착지를 각각 입력된 값으로 설정
    if (directDeparture) {
        setDeparture(directDeparture);
    }
    if (directDestination) {
        setDestination(directDestination);
      }
      setDirectInputMode(false);
      setDirectDeparture('');
      setDirectDestination('');
  };

  // 직접 입력 모달 닫기
  const handleDirectInputClose = () => {
    setDirectInputMode(false);
    setDirectDeparture('');
    setDirectDestination('');
  };

  // 초기화
  const handleReset = () => {
    setDeparture('');
    setDestination('');
    setMaxMembers(4);
    setInviteCodeEnabled(true);
    setDirectInputMode(false);
    setDirectDeparture('');
    setDirectDestination('');
  };

  // 완료 핸들러 - 방 생성 완료 화면으로 전환
  const handleComplete = async () => {
    if (!departure || !destination) {
      Alert.alert('알림', '출발지와 도착지를 모두 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      // 현재 시간을 ISO 8601 형식으로 변환
      const meetingTime = new Date().toISOString();
      
      // API 호출 (Swagger 명세: meetingPoint, destination, meetingTime, capacity)
      const response = await createRoom(
        departure,      // meetingPoint
        destination,    // destination
        meetingTime,    // meetingTime (ISO 8601)
        maxMembers      // capacity
      );

      // API 응답 데이터를 UI 형식에 맞게 변환
      const roomData = {
        room_id: response.id || response.roomCode || nextRoomId,
        roomCode: response.roomCode,
        departure: response.meetingPoint || departure,
        destination: response.destination || destination,
        max_members: response.capacity || maxMembers,
        current_count: response.memberCount || 1,
        host_id: response.leaderId,
        status: response.status || 'ACTIVE',
        invite_code: response.roomCode,
        invite_code_enabled: inviteCodeEnabled,
        meetingTime: response.meetingTime || meetingTime,
        // UI 표시용 추가 필드
        members: `${response.capacity || maxMembers}명`,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      };

      // 방 생성 완료 화면 표시
      setCreatedRoomData(roomData);
      setShowCompleteScreen(true);
      
      // 다음 방번호 업데이트
      if (onRoomCreated && response.id) {
        onRoomCreated(response.id);
      }
    } catch (error) {
      // 백엔드에서 이미 방이 있다는 에러가 오는 경우 처리
      if (error.message && (error.message.includes('이미') || error.message.includes('기존') || error.message.includes('나가'))) {
        Alert.alert('알림', '기존의 방을 나가주세요.');
      } else {
        Alert.alert('방 생성 실패', error.message || '방 생성에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 채팅 시작하기 버튼 클릭 - 실제 채팅방으로 이동
  const handleStartChatting = () => {
    if (createdRoomData) {
      onComplete(createdRoomData);
      handleReset();
      setShowCompleteScreen(false);
      setCreatedRoomData(null);
    }
  };

  // 모달 닫기 시 초기화
  const handleClose = () => {
    handleReset();
    setShowCompleteScreen(false);
    setCreatedRoomData(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* 방 생성 완료 화면 */}
          {showCompleteScreen && createdRoomData ? (
            <View style={styles.completeScreen}>
              {/* 상단 헤더 */}
              <View style={styles.completeHeader}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                >
                  <Text style={styles.cancelButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.completeHeaderTitle}>방생성</Text>
                <View style={styles.cancelButtonPlaceholder} />
              </View>

              {/* 방 정보 카드 */}
              <View style={styles.roomInfoCard}>
                <View style={styles.roomInfoRow}>
                  <Text style={styles.roomInfoLabel}>방번호</Text>
                  <Text style={styles.roomInfoValue}>{createdRoomData.room_id}</Text>
                </View>
                <View style={styles.roomInfoRow}>
                  <Text style={styles.roomInfoLabel}>출발지</Text>
                  <Text style={styles.roomInfoValue}>{createdRoomData.departure}</Text>
                </View>
                <View style={styles.roomInfoRow}>
                  <Text style={styles.roomInfoLabel}>도착지</Text>
                  <Text style={styles.roomInfoValue}>{createdRoomData.destination}</Text>
                </View>
                <View style={styles.roomInfoRow}>
                  <Text style={styles.roomInfoLabel}>인원</Text>
                  <Text style={styles.roomInfoValue}>{createdRoomData.members}</Text>
                </View>
                <View style={[styles.roomInfoRow, styles.roomInfoRowLast]}>
                  <Text style={styles.roomInfoLabel}>초대 코드</Text>
                  <Text style={styles.roomInfoValue}>
                    {createdRoomData.invite_code_enabled ? createdRoomData.invite_code : 'OFF'}
                  </Text>
                </View>
              </View>

              {/* 채팅 시작하기 버튼 */}
              <TouchableOpacity
                style={styles.startChattingButton}
                onPress={handleStartChatting}
              >
                <Text style={styles.startChattingButtonText}>채팅 시작하기</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* 모달 헤더 */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                >
                  <Text style={styles.cancelButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>방생성</Text>
                <View style={styles.cancelButtonPlaceholder} />
              </View>

              <ScrollView style={styles.modalBody}>
            {/* 출발지/도착지 섹션 */}
            <View style={styles.locationSection}>
              {/* 레이블 행 */}
              <View style={styles.locationLabelRow}>
                <View style={styles.locationLabelColumn}>
                  <Text style={styles.locationLabel}>출발지</Text>
                </View>
                <View style={styles.locationLabelColumn}>
                  <Text style={styles.locationLabel}>도착지</Text>
                </View>
              </View>
              {/* 입력 필드 행 */}
              <View style={styles.locationInputRow}>
                <View style={[styles.locationInputColumn, styles.locationInputColumnFirst]}>
                  <TextInput
                    style={[
                      styles.locationInput,
                      departure && styles.locationInputSelected
                    ]}
                    placeholder="출발지 선택"
                    value={departure}
                    editable={false}
                  />
                </View>
                <View style={styles.locationInputColumn}>
                  <TextInput
                    style={[
                      styles.locationInput,
                      destination && styles.locationInputSelected
                    ]}
                    placeholder="도착지 선택"
                    value={destination}
                    editable={false}
                  />
                </View>
              </View>
            </View>

            {/* 구분선 */}
            <View style={styles.divider} />

            {/* 위치 선택 버튼 그리드 */}
            <View style={styles.locationGridContainer}>
              {/* 첫 번째 줄: 기흥3번출, 기흥4번출, 강대역1번 (3개) */}
              <View style={styles.locationRow}>
                {LOCATIONS.slice(0, 3).map((location, index) => {
                  const isSelected = departure === location || destination === location;
                  const isLast = index === 2;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.locationButton,
                        styles.locationButtonFirstRow,
                        isLast && styles.locationButtonLast,
                        isSelected && styles.settingOptionActive,
                      ]}
                      onPress={() => handleLocationSelect(location)}
                    >
                      <Text
                        style={[
                          styles.locationButtonText,
                          isSelected && styles.settingOptionTextActive,
                        ]}
                      >
                        {location}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>

              {/* 두 번째 줄: 샬롬관, 인사관, 이공관, 천은관 (4개) */}
              <View style={styles.locationRow}>
                {LOCATIONS.slice(3, 7).map((location, index) => {
                  const isSelected = departure === location || destination === location;
                  const isLast = index === 3;
                  return (
                <TouchableOpacity
                      key={index + 3}
                      style={[
                        styles.locationButton,
                        styles.locationButtonDefault,
                        isLast && styles.locationButtonLast,
                        isSelected && styles.settingOptionActive,
                      ]}
                      onPress={() => handleLocationSelect(location)}
                >
                      <Text
                        style={[
                          styles.locationButtonText,
                          isSelected && styles.settingOptionTextActive,
                        ]}
                      >
                        {location}
                      </Text>
                </TouchableOpacity>
                  );
                })}
              </View>

              {/* 세 번째 줄: 심전관, 교육관, 예술관 (3개) + 직접입력 */}
              <View style={styles.locationRow}>
                {LOCATIONS.slice(7, 10).map((location, index) => {
                  const isSelected = departure === location || destination === location;
                  return (
                <TouchableOpacity
                      key={index + 7}
                      style={[
                        styles.locationButton,
                        styles.locationButtonDefault,
                        isSelected && styles.settingOptionActive,
                      ]}
                  onPress={() => handleLocationSelect(location)}
                >
                      <Text
                        style={[
                          styles.locationButtonText,
                          isSelected && styles.settingOptionTextActive,
                        ]}
                      >
                        {location}
                      </Text>
                </TouchableOpacity>
                  );
                })}
              <TouchableOpacity
                  style={[
                    styles.locationButton,
                    styles.locationButtonDefault,
                    styles.locationButtonLast,
                  ]}
                onPress={() => handleLocationSelect('직접 입력')}
              >
                <Text style={styles.locationButtonText}>직접 입력</Text>
              </TouchableOpacity>
              </View>
            </View>

            {/* 인원 설정 */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>인원설정</Text>
              <View style={styles.settingOptions}>
                <TouchableOpacity
                  style={[
                    styles.settingOption,
                    maxMembers === 2 && styles.settingOptionActive,
                  ]}
                  onPress={() => setMaxMembers(2)}
                >
                  <Text
                    style={[
                      styles.settingOptionText,
                      maxMembers === 2 && styles.settingOptionTextActive,
                    ]}
                  >
                    2명
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.settingOption,
                    maxMembers === 3 && styles.settingOptionActive,
                  ]}
                  onPress={() => setMaxMembers(3)}
                >
                  <Text
                    style={[
                      styles.settingOptionText,
                      maxMembers === 3 && styles.settingOptionTextActive,
                    ]}
                  >
                    3명
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.settingOption,
                    maxMembers === 4 && styles.settingOptionActive,
                  ]}
                  onPress={() => setMaxMembers(4)}
                >
                  <Text
                    style={[
                      styles.settingOptionText,
                      maxMembers === 4 && styles.settingOptionTextActive,
                    ]}
                  >
                    4명
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 초대코드 설정 */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>초대코드설정</Text>
              <View style={styles.settingOptions}>
                <TouchableOpacity
                  style={[
                    styles.settingOption,
                    inviteCodeEnabled && styles.settingOptionActive,
                  ]}
                  onPress={() => setInviteCodeEnabled(true)}
                >
                  <Text
                    style={[
                      styles.settingOptionText,
                      inviteCodeEnabled && styles.settingOptionTextActive,
                    ]}
                  >
                    ON
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.settingOption,
                    !inviteCodeEnabled && styles.settingOptionActive,
                  ]}
                  onPress={() => setInviteCodeEnabled(false)}
                >
                  <Text
                    style={[
                      styles.settingOptionText,
                      !inviteCodeEnabled && styles.settingOptionTextActive,
                    ]}
                  >
                    OFF
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* 하단 버튼 */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.footerButton, styles.resetButton]}
              onPress={handleReset}
            >
              <Text style={styles.footerButtonText}>초기화</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.completeButton, loading && styles.completeButtonDisabled]}
              onPress={handleComplete}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={[styles.footerButtonText, styles.completeButtonText]}>
                  완료
                </Text>
              )}
            </TouchableOpacity>
          </View>
            </>
          )}
        </View>
      </View>

      {/* 직접 입력 모달 */}
      <Modal
        visible={directInputMode}
        transparent={true}
        animationType="fade"
        onRequestClose={handleDirectInputClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.directInputModalContent}>
            {/* 직접 입력 모달 헤더 */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleDirectInputClose}
              >
                <Text style={styles.cancelButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>직접 입력</Text>
              <View style={styles.cancelButtonPlaceholder} />
            </View>

            {/* 직접 입력 필드 */}
            <View style={styles.directInputModalBody}>
              <View style={styles.directInputFieldContainer}>
                <Text style={styles.directInputLabel}>출발지</Text>
                <TextInput
                  style={styles.directInputField}
                  placeholder="출발지 직접 입력"
                  value={directDeparture}
                  onChangeText={setDirectDeparture}
                />
              </View>
              <View style={styles.directInputFieldContainer}>
                <Text style={styles.directInputLabel}>도착지</Text>
                <TextInput
                  style={styles.directInputField}
                  placeholder="도착지 직접 입력"
                  value={directDestination}
                  onChangeText={setDirectDestination}
                />
              </View>
              <TouchableOpacity
                style={styles.directInputButton}
                onPress={handleDirectInputComplete}
              >
                <Text style={styles.directInputButtonText}>입력 완료</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4A90E2',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    backgroundColor: 'white',
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
    padding: 15,
  },
  // 위치 섹션
  locationSection: {
    marginBottom: 15,
  },
  divider: {
    height: 5,
    backgroundColor: '#ccc',
    marginVertical: 5,
  },
  locationLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  locationLabelColumn: {
    flex: 1,
    alignItems: 'center',
  },
  locationInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationInputColumn: {
    flex: 1,
  },
  locationInputColumnFirst: {
    marginRight: 8,
  },
  locationLabel: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  locationInput: {
    width: '100%',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    fontSize: 23,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  locationInputSelected: {
    backgroundColor: '#4A90E2',
    color: '#333',
  },
  // 직접 입력 모달
  directInputModalContent: {
    width: '80%',
    maxHeight: '60%',
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4A90E2',
    overflow: 'hidden',
  },
  directInputModalBody: {
    padding: 20,
  },
  directInputFieldContainer: {
    marginBottom: 15,
  },
  directInputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  directInputField: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  directInputButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  directInputButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 위치 버튼 그리드
  locationGridContainer: {
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  locationButton: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  locationButtonFirstRow: {
    flex: 1,
    marginRight: 8,
  },
  locationButtonDefault: {
    flex: 1,
    marginRight: 8,
  },
  locationButtonLast: {
    marginRight: 0,
  },
  locationButtonText: {
    fontSize: 14,
    color: '#333',
  },
  // 설정 섹션
  settingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  settingLabel: {
    flex: 2,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  settingOptions: {
    flex: 4,
    flexDirection: 'row',
    gap: 8,
  },
  settingOption: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingOptionActive: {
    backgroundColor: '#4A90E2',
  },
  settingOptionText: {
    fontSize: 14,
    color: '#333',
  },
  settingOptionTextActive: {
    color: 'white',
  },
  // 모달 푸터
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  footerButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#E0E0E0',
  },
  completeButton: {
    backgroundColor: '#4A90E2',
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  completeButtonText: {
    color: 'white',
  },
  // 방 생성 완료 화면 스타일
  completeScreen: {
    padding: 20,
    alignItems: 'center',
  },
  completeHeader: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  completeHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  roomInfoCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  roomInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  roomInfoRowLast: {
    marginBottom: 0,
    marginTop: 10,
  },
  roomInfoLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  roomInfoValue: {
    fontSize: 16,
    color: '#333',
  },
  startChattingButton: {
    width: '100%',
    backgroundColor: '#4A90E2',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  startChattingButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default CreateRoomModal;

