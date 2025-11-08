import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CreateRoomModal from '../modal/CreateRoomModal';
import InviteCodeModal from '../modal/InviteCodeModal';
import MemberCounter from '../components/MemberCounter';

const TaxiScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('taxi');
  const [createRoomModalVisible, setCreateRoomModalVisible] = useState(false);
  const [inviteCodeModalVisible, setInviteCodeModalVisible] = useState(false);
  // 참여중인 채팅방 목록 상태 (API 명세서에 맞춘 구조)
  const [participatingRooms, setParticipatingRooms] = useState([
    // 예시 데이터 - 실제로는 AsyncStorage나 서버에서 가져올 데이터
    // API 필드: room_id, departure, destination, current_count, max_members, host_id
  ]);
  
  // 다른 사람들이 생성한 방 목록 (더미 데이터)
  // TODO: 실제로는 서버 API에서 방 목록을 가져와야 함
  const [availableRooms, setAvailableRooms] = useState([
    {
      room_id: 2001,
      departure: '기흥3번출',
      destination: '샬롬관',
      current_count: 2,
      max_members: 4,
      host_id: null,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  // 방번호 관리 (100부터 시작)
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

  // 채팅방 나가기 시 참여 목록에서 제거
  const handleLeaveRoomFromChat = (roomId) => {
    if (!roomId) return;
    setParticipatingRooms((prev) => prev.filter((room) => room.room_id !== roomId));
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
  const handleInviteCodeEntered = (roomData) => {
    setInviteCodeModalVisible(false);
    // 참여중인 채팅방 목록에 추가하지 않음 (운행 시작 시에만 추가)
    // 채팅방으로 이동
    navigateToChat(roomData, false);
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
              const maxMembers = 4; // 항상 4명으로 고정
              return (
                <View key={room.room_id} style={styles.roomItem}>
                  <Text style={styles.roomNumberText}>{room.room_id}</Text>
                  <View style={styles.destinationContainer}>
                    <Text style={styles.destinationText}>{room.departure || '출발지'}</Text>
                    <Text style={styles.destinationArrow}>→</Text>
                    <Text style={styles.destinationText}>{room.destination || '도착지'}</Text>
                  </View>
                  <Text style={styles.roomItemText}>{room.time || ''}</Text>
                  <View style={styles.memberCounterWrapper}>
                    <MemberCounter currentCount={currentCount} maxMembers={maxMembers} size={14} />
                  </View>
                  <TouchableOpacity 
                    style={styles.enterButton}
                    onPress={() => handleEnterRoom(room)}
                  >
                    <Text style={styles.enterButtonText}>입장</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* 채팅방 목록 헤더 */}
        <View style={styles.section}>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>방 번호</Text>
            <Text style={styles.listHeaderText}>목적지</Text>
            <Text style={styles.listHeaderText}>출발시간</Text>
            <Text style={styles.listHeaderText}>인원현황</Text>
          </View>
          {/* 다른 사람들이 생성한 방 목록 (더미 데이터) */}
          {availableRooms.map((room) => {
            const currentCount = room.current_count || 0;
            const maxMembers = 4; // 항상 4명으로 고정
            return (
              <View key={room.room_id} style={styles.roomListItem}>
                <Text style={styles.roomListNumber}>{room.room_id}</Text>
                <Text style={styles.roomListDestination}>
                  {room.departure || '출발지'} → {room.destination || '도착지'}
                </Text>
                <Text style={styles.roomListTime}>{room.time || ''}</Text>
                <View style={styles.roomListMemberCounter}>
                  <MemberCounter currentCount={currentCount} maxMembers={maxMembers} size={14} />
                </View>
                <TouchableOpacity 
                  style={styles.roomListEnterButton}
                  onPress={() => {
                    // 방 입장 처리
                    const roomData = {
                      ...room,
                      current_count: room.current_count + 1,
                    };
                    handleInviteCodeEntered(roomData);
                  }}
                >
                  <Text style={styles.roomListEnterButtonText}>입장</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* 하단 네비게이션 */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navButton, selectedTab === 'home' && styles.navButtonActive]}
          onPress={() => {
            setSelectedTab('home');
            // 나중에 메인 화면과 합칠 예정
          }}
        >
          <Text style={[styles.navButtonText, selectedTab === 'home' && styles.navButtonTextActive]}>
            홈
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navButton, selectedTab === 'taxi' && styles.navButtonActive]}
          onPress={() => setSelectedTab('taxi')}
        >
          <Text style={[styles.navButtonText, selectedTab === 'taxi' && styles.navButtonTextActive]}>
            택시
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navButton, selectedTab === 'mypage' && styles.navButtonActive]}
          onPress={() => {
            setSelectedTab('mypage');
            // TODO: 마이페이지 화면 구현 후 navigation.navigate('MyPage') 추가
            // navigation.navigate('MyPage');
          }}
        >
          <Text style={[styles.navButtonText, selectedTab === 'mypage' && styles.navButtonTextActive]}>
            마이페이지
          </Text>
        </TouchableOpacity>
      </View>

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
        onClose={() => setInviteCodeModalVisible(false)}
        onEnter={handleInviteCodeEntered}
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
    backgroundColor: '#E0E0E0',
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
    backgroundColor: '#E0E0E0',
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
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 5,
    alignItems: 'center',
  },
  roomNumberText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'left',
    minWidth: 50,
    marginRight: 10,
  },
  roomItemText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  destinationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  destinationText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  destinationArrow: {
    fontSize: 12,
    color: '#333',
    marginHorizontal: 4,
  },
  memberCounterWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterButton: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  // 채팅방 목록 헤더
  listHeader: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  listHeaderText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  // 채팅방 목록 아이템
  roomListItem: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 5,
    alignItems: 'center',
  },
  roomListNumber: {
    fontSize: 14,
    color: '#333',
    textAlign: 'left',
    minWidth: 50,
    marginRight: 10,
  },
  roomListDestination: {
    flex: 1,
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  roomListTime: {
    flex: 1,
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  roomListMemberCounter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomListEnterButton: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomListEnterButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  // 하단 네비게이션
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 10,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  navButtonActive: {
    backgroundColor: '#4A90E2',
  },
  navButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  navButtonTextActive: {
    color: 'white',
  },
});

export default TaxiScreen;


