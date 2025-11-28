import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CreateRoomModal from '../modal/CreateRoomModal';
import InviteCodeModal from '../modal/InviteCodeModal';
import MemberCounter from '../components/MemberCounter';
import LockIcon from '../components/LockIcon';
import { joinRoom, getRoomDetail, getRooms } from '../services/taxiApi';

const TaxiScreen = ({ navigation }) => {
  const [createRoomModalVisible, setCreateRoomModalVisible] = useState(false);
  const [inviteCodeModalVisible, setInviteCodeModalVisible] = useState(false);
  // 초대코드로 입장하려는 방 정보
  const [selectedRoomForInvite, setSelectedRoomForInvite] = useState(null);
  // 각 방별 초대코드 틀린 횟수 추적 (room_id를 키로 사용)
  const [roomFailedAttempts, setRoomFailedAttempts] = useState({});
  // 참여중인 채팅방 목록 상태 (API 명세서에 맞춘 구조)
  const [participatingRooms, setParticipatingRooms] = useState([]);
  
  // 다른 사람들이 생성한 방 목록
  // TODO: 실제로는 서버 API에서 방 목록을 가져와야 함
  const [availableRooms, setAvailableRooms] = useState([]);
  
  // 방번호 관리 (백엔드에서 관리)
  const [nextRoomId, setNextRoomId] = useState(100);
  // 현재 날짜 추적 (자정 리셋용)
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  });

  // 자정이 지나면 방번호 리셋
  useEffect(() => {
    const checkDateChange = () => {
      const now = new Date();
      const today = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
      
      if (today !== currentDate) {
        // 날짜가 변경되었으면 방번호를 100으로 리셋
        setCurrentDate(today);
        setNextRoomId(100);
      }
    };

    // 1분마다 날짜 체크
    const interval = setInterval(checkDateChange, 60000);
    
    // 컴포넌트 마운트 시 즉시 체크
    checkDateChange();

    return () => clearInterval(interval);
  }, [currentDate]);

  // 채팅방 나가기 시 참여 목록에서 제거 및 인원 수 감소
  const handleLeaveRoomFromChat = (roomId) => {
    if (!roomId) return;
    
    // 참여중인 채팅방 목록에서 제거
    setParticipatingRooms((prev) => prev.filter((room) => room.room_id !== roomId));
    
    // 사용 가능한 방 목록에서도 인원 수 감소
    setAvailableRooms((prev) => 
      prev.map((room) => {
        if (room.room_id === roomId && room.current_count > 0) {
          return {
            ...room,
            current_count: room.current_count - 1,
          };
        }
        return room;
      })
    );
  };

  const navigateToChat = (roomData, isFromCreate = false) => {
    navigation.navigate('Chat', {
      roomData,
      onLeaveRoom: handleLeaveRoomFromChat,
      onAddToParticipatingRooms: (roomData) => {
        // 운행 시작 시 참여중인 채팅방 목록에 추가
        setParticipatingRooms((prev) => {
          const exists = prev.some((room) => room.room_id === roomData.room_id);
          if (exists) return prev;
          return [...prev, roomData];
        });
      },
      isFromCreate, // 방장이 생성한 방인지 여부
    });
  };

  // 방 생성 모달 열기
  const handleCreateRoom = () => {
    setCreateRoomModalVisible(true);
  };

  // 초대코드 입장 모달 열기
  const handleInviteCode = () => {
    setInviteCodeModalVisible(true);
  };

  // 방 목록 새로고침
  const handleRefreshRooms = async () => {
    try {
      // TODO: 백엔드 API 연동 시 아래 주석 해제
      // const rooms = await getRooms();
      // setAvailableRooms(rooms);
      
      // 백엔드 API 연동 전까지는 시간을 변경하지 않음
      // 방 생성 시 설정된 시간이 유지됨
    } catch (error) {
      console.error('방 목록 새로고침 실패:', error);
    }
  };

  // 방 생성 완료 후 채팅방으로 이동
  const handleRoomCreated = (roomData) => {
    setCreateRoomModalVisible(false);
    // 방장이 생성한 방은 바로 참여중인 채팅방 목록에 추가
    setParticipatingRooms((prev) => {
      const exists = prev.some((room) => room.room_id === roomData.room_id);
      if (exists) return prev;
      return [...prev, roomData];
    });
    // 채팅방으로 이동 (방장이 생성한 방)
    navigateToChat(roomData, true);
  };

  // 초대코드로 입장 후 채팅방으로 이동
  const handleInviteCodeEntered = async (roomData, enteredCode) => {
    console.log('handleInviteCodeEntered 호출:', roomData.room_id, enteredCode);
    try {
      // 인원이 가득 찬 경우 체크 (초대코드 모달에서 이미 증가시켰으므로 원래 값으로 체크)
      const originalCount = roomData.current_count - 1; // 모달에서 증가시킨 값이므로 원래 값으로 복원
      if (originalCount >= roomData.max_members) {
        Alert.alert('알림', '인원이 가득 찼습니다.');
        setInviteCodeModalVisible(false);
        setSelectedRoomForInvite(null);
        return;
      }

      // 모달 먼저 닫기
      setInviteCodeModalVisible(false);
      setSelectedRoomForInvite(null);
      
      // 초대코드가 맞았으므로 틀린 횟수 리셋
      if (roomData.room_id) {
        setRoomFailedAttempts((prev) => {
          const updated = { ...prev };
          delete updated[roomData.room_id];
          return updated;
        });
      }

      // TODO: 백엔드 API 연동 시 아래 주석 해제
      // const updatedRoomData = await joinRoom(roomData.room_id);
      // const updatedRoomData = await getRoomDetail(roomData.room_id);
      
      // 임시: 로컬 상태 업데이트 (백엔드 API 연동 전까지)
      const updatedRoomData = {
        ...roomData,
        current_count: originalCount + 1, // 참여 후 인원 수 증가
      };
      
      // 모달이 닫힌 후 네비게이션 (약간의 지연을 두어 모달이 완전히 닫힌 후 이동)
      setTimeout(() => {
        console.log('채팅방으로 이동:', updatedRoomData);
        navigateToChat(updatedRoomData, false);
      }, 100);
    } catch (error) {
      console.error('방 참여 에러:', error);
      // 모달 닫기
    setInviteCodeModalVisible(false);
      setSelectedRoomForInvite(null);
      
      // 에러 메시지에 따라 다른 알림 표시
      setTimeout(() => {
        if (error.message === 'Room is full' || error.message.includes('인원 초과')) {
          Alert.alert('알림', '인원이 가득 찼습니다.');
        } else if (error.message === 'Room not found') {
          Alert.alert('알림', '존재하지 않는 방입니다.');
        } else {
          Alert.alert('알림', error.message || '방 참여에 실패했습니다.');
        }
      }, 100);
    }
  };

  // 초대코드가 틀렸을 때 호출되는 콜백
  const handleCodeFailed = (roomId) => {
    if (roomId) {
      setRoomFailedAttempts((prev) => {
        const currentCount = prev[roomId] || 0;
        return {
          ...prev,
          [roomId]: currentCount + 1,
        };
      });
    }
  };

  // 참여중인 채팅방 입장
  const handleEnterRoom = (roomData) => {
    // 이미 참여중인 채팅방이므로 isFromCreate는 false
    navigateToChat(roomData, false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Kangnam Taxi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerButtonText}>프로필</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 방 생성 및 초대코드 입장 버튼 */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleCreateRoom}
          >
            <Text style={styles.actionButtonText}>방 생성</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleInviteCode}
          >
            <Text style={styles.actionButtonText}>초대코드{'\n'}입장하기</Text>
          </TouchableOpacity>
        </View>

        {/* 참여중인 채팅방 섹션 */}
        {participatingRooms.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>참여중인 채팅방</Text>
            </View>
            {participatingRooms.map((room) => {
              const currentCount = room.current_count || 0;
              const maxMembers = room.max_members || 4; // 방 생성 시 설정한 인원 수
              return (
              <View key={room.room_id} style={styles.roomItem}>
                <View style={styles.roomListColumn}>
                  <View style={styles.roomNumberWithLock}>
                    <Text style={styles.roomNumberText}>{room.room_id}</Text>
                    {room.invite_code_enabled && (
                      <View style={{ marginLeft: 6 }}>
                        <LockIcon size={18} />
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.roomListColumn}>
                <View style={styles.destinationContainer}>
                  <Text style={styles.destinationText}>{room.departure || '출발지'}</Text>
                  <View style={styles.destinationRow}>
                    <Text style={styles.arrowText}>→</Text>
                    <Text style={styles.destinationText}>{room.destination || '도착지'}</Text>
                  </View>
                  </View>
                </View>
                <View style={styles.roomListColumn}>
                <Text style={styles.roomItemText}>{room.time || ''}</Text>
                </View>
                <View style={styles.roomListColumn}>
                  <View style={styles.memberCounterWrapper}>
                    <MemberCounter currentCount={currentCount} maxMembers={maxMembers} size={14} />
                  </View>
                </View>
                <View style={styles.roomListColumn}>
                <TouchableOpacity 
                  style={styles.enterButton}
                  onPress={() => handleEnterRoom(room)}
                >
                  <Text style={styles.enterButtonText}>입장</Text>
                </TouchableOpacity>
              </View>
              </View>
              );
            })}
          </View>
        )}

        {/* 채팅방 목록 헤더 */}
        <View style={styles.section}>
          <View style={styles.listHeader}>
            <View style={styles.roomListColumn}>
            <Text style={styles.listHeaderText}>방 번호</Text>
            </View>
            <View style={styles.roomListColumn}>
            <Text style={styles.listHeaderText}>목적지</Text>
            </View>
            <View style={styles.roomListColumn}>
            <Text style={styles.listHeaderText}>출발시간</Text>
            </View>
            <View style={styles.roomListColumn}>
            <Text style={styles.listHeaderText}>인원현황</Text>
            </View>
            <View style={styles.roomListColumn}>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={handleRefreshRooms}
              >
                <Text style={styles.refreshButtonText} numberOfLines={1}>새로고침</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* 다른 사람들이 생성한 방 목록 */}
          {availableRooms.map((room) => {
            const currentCount = room.current_count || 0;
            const maxMembers = room.max_members || 4; // 방 생성 시 설정한 인원 수
            return (
              <View key={room.room_id} style={styles.roomListItem}>
                <View style={styles.roomListColumn}>
                  <View style={styles.roomNumberWithLock}>
                    <Text style={styles.roomListNumber}>{room.room_id}</Text>
                    {room.invite_code_enabled && (
                      <LockIcon size={18} />
                    )}
                  </View>
                </View>
                <View style={styles.roomListColumn}>
                  <View style={styles.roomListDestination}>
                    <Text style={styles.roomListDestinationText}>
                      {room.departure || '출발지'}
                    </Text>
                    <View style={styles.destinationRow}>
                      <Text style={styles.roomListArrowText}>→</Text>
                      <Text style={styles.roomListDestinationText}>
                        {room.destination || '도착지'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.roomListColumn}>
                  <Text style={styles.roomListTime}>{room.time || ''}</Text>
                </View>
                <View style={styles.roomListColumn}>
                  <View style={styles.roomListMemberCounter}>
                    <MemberCounter currentCount={currentCount} maxMembers={maxMembers} size={14} />
                  </View>
                </View>
                <View style={styles.roomListColumn}>
                  <TouchableOpacity 
                    style={[
                      styles.roomListEnterButton,
                      (currentCount >= maxMembers) && styles.roomListEnterButtonDisabled
                    ]}
                    onPress={async () => {
                    // 인원이 가득 찬 경우 입장 불가
                    if (currentCount >= maxMembers) {
                      Alert.alert('알림', '인원이 가득 찼습니다.');
                      return;
                    }

                    // 초대코드가 필요한 방인지 확인
                    if (room.invite_code_enabled) {
                      // 틀린 횟수가 3회 이상인지 확인
                      const failedCount = roomFailedAttempts[room.room_id] || 0;
                      if (failedCount >= 3) {
                        Alert.alert('알림', '입장이 제한 됩니다');
                        return;
                      }
                      // 초대코드 모달 열기
                      setInviteCodeModalVisible(true);
                      // 선택된 방 정보 저장 (초대코드 검증용)
                      setSelectedRoomForInvite(room);
                    } else {
                      // 자유롭게 입장
                      const updatedRoomData = {
                        ...room,
                        current_count: (room.current_count || 0) + 1,
                      };
                      
                      // 채팅방으로 이동
                      navigateToChat(updatedRoomData, false);
                      
                      // API 호출 주석 처리 (나중에 활성화)
                      // try {
                      //   const response = await joinRoom(room.room_id);
                      //   const updatedRoomData = await getRoomDetail(room.room_id);
                      //   navigateToChat(updatedRoomData, false);
                      // } catch (error) {
                      //   console.error('방 참여 에러:', error);
                      //   if (error.message === 'Room is full' || error.message.includes('인원 초과')) {
                      //     Alert.alert('알림', '인원이 가득 찼습니다.');
                      //   } else if (error.message === 'Room not found') {
                      //     Alert.alert('알림', '존재하지 않는 방입니다.');
                      //   } else {
                      //     Alert.alert('알림', error.message || '방 참여에 실패했습니다.');
                      //   }
                      // }
                    }
                  }}
                  disabled={currentCount >= maxMembers}
                >
                  <Text style={[
                    styles.roomListEnterButtonText,
                    (currentCount >= maxMembers) && styles.roomListEnterButtonTextDisabled
                  ]}>
                    입장
                  </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* 방 생성 모달 */}
      <CreateRoomModal
        visible={createRoomModalVisible}
        onClose={() => setCreateRoomModalVisible(false)}
        onComplete={handleRoomCreated}
        nextRoomId={nextRoomId}
        onRoomCreated={(roomId) => setNextRoomId(roomId + 1)}
      />

      {/* 초대코드 입장 모달 */}
      <InviteCodeModal
        visible={inviteCodeModalVisible}
        onClose={() => {
          setInviteCodeModalVisible(false);
          setSelectedRoomForInvite(null);
        }}
        onEnter={handleInviteCodeEntered}
        onCodeFailed={handleCodeFailed}
        targetRoom={selectedRoomForInvite}
        allRooms={[...availableRooms, ...participatingRooms]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // 상단 헤더 스타일
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  headerButtonText: {
    color: '#0D47A1',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  // 액션 버튼 컨테이너
  actionButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  // 섹션 스타일
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  // 참여중인 채팅방 아이템
  roomItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 3,
    alignItems: 'center',
  },
  roomNumberWithLock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomNumberText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  roomItemText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  destinationContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    lineHeight: 18,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 4,
  },
  memberCounterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  enterButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  // 채팅방 목록 헤더
  listHeader: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  listHeaderText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  // 5개 컬럼 레이아웃을 위한 공통 스타일
  roomListColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  // 채팅방 목록 아이템
  roomListItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 3,
    alignItems: 'center',
  },
  roomListNumber: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  roomListDestination: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  roomListArrowText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 4,
  },
  roomListDestinationText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    lineHeight: 18,
  },
  roomListTime: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  roomListMemberCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomListEnterButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  roomListEnterButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  roomListEnterButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  roomListEnterButtonTextDisabled: {
    color: '#666',
  },
});

export default TaxiScreen;


