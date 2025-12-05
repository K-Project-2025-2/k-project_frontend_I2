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
import { MaterialIcons } from '@expo/vector-icons';
import CreateRoomModal from '../modal/CreateRoomModal';
import InviteCodeModal from '../modal/InviteCodeModal';
import MemberCounter from '../components/MemberCounter';
import LockIcon from '../components/LockIcon';
import { joinRoom, getRoomDetail, getRooms, getMyRooms } from '../services/taxiApi';
import { saveParticipatingRooms, getParticipatingRooms } from '../services/apiConfig';

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

  // 컴포넌트 마운트 시 참여중인 채팅방 목록 불러오기
  useEffect(() => {
    const loadRooms = async () => {
      try {
        // 백엔드에서 내가 참여중인 방 목록 가져오기
        const myRooms = await getMyRooms();
        if (myRooms && myRooms.length > 0) {
          // API 응답을 UI 형식에 맞게 변환
          const formattedRooms = myRooms.map(room => ({
            room_id: room.id,
            roomCode: room.roomCode,
            departure: room.meetingPoint,
            destination: room.destination,
            max_members: room.capacity,
            current_count: room.memberCount,
            host_id: room.leaderId,
            status: room.status,
            invite_code: room.roomCode,
            invite_code_enabled: false, // API 응답에 없으면 기본값
            meetingTime: room.meetingTime,
            time: new Date(room.meetingTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
            isPublic: true, // 기본값
          }));
          setParticipatingRooms(formattedRooms);
        } else {
          // 백엔드에서 가져온 게 없으면 AsyncStorage에서 불러오기
          const savedRooms = await getParticipatingRooms();
          if (savedRooms && savedRooms.length > 0) {
            setParticipatingRooms(savedRooms);
          }
        }
      } catch (error) {
        console.error('참여중인 채팅방 목록 불러오기 실패:', error);
        // 에러 발생 시 AsyncStorage에서 불러오기
        try {
          const savedRooms = await getParticipatingRooms();
          if (savedRooms && savedRooms.length > 0) {
            setParticipatingRooms(savedRooms);
          }
        } catch (storageError) {
          console.error('AsyncStorage에서 불러오기 실패:', storageError);
        }
      }
      
      // 전체 방 목록 가져오기 (공개 방 목록)
      try {
        const allRooms = await getRooms();
        if (allRooms && allRooms.length > 0) {
          // API 응답을 UI 형식에 맞게 변환
          const formattedRooms = allRooms.map(room => ({
            room_id: room.id,
            roomCode: room.roomCode,
            departure: room.meetingPoint,
            destination: room.destination,
            max_members: room.capacity,
            current_count: room.memberCount,
            host_id: room.leaderId,
            status: room.status,
            invite_code: room.roomCode,
            invite_code_enabled: false, // API 응답에 없으면 기본값
            meetingTime: room.meetingTime,
            time: new Date(room.meetingTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
            isPublic: true, // 기본값
          }));
          setAvailableRooms(formattedRooms);
        } else {
          // API가 없거나 빈 배열이면 데모 데이터 사용
          const now = new Date();
          const demoRooms = [
            {
              room_id: 101,
              roomCode: '100101',
              departure: '기흥역3번출구',
              destination: '강남대학교',
              max_members: 4,
              current_count: 2,
              host_id: 999,
              status: 'OPEN',
              invite_code: '100101',
              invite_code_enabled: false,
              meetingTime: new Date(now.getTime() + 15 * 60000).toISOString(),
              time: new Date(now.getTime() + 15 * 60000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
              isPublic: true,
            },
            {
              room_id: 102,
              roomCode: '100102',
              departure: '기흥역4번출구',
              destination: '이공관',
              max_members: 3,
              current_count: 1,
              host_id: 998,
              status: 'OPEN',
              invite_code: '100102',
              invite_code_enabled: true,
              meetingTime: new Date(now.getTime() + 20 * 60000).toISOString(),
              time: new Date(now.getTime() + 20 * 60000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
              isPublic: true,
            },
            {
              room_id: 103,
              roomCode: '100103',
              departure: '강대역1번출구',
              destination: '샬롬관',
              max_members: 4,
              current_count: 3,
              host_id: 997,
              status: 'OPEN',
              invite_code: '100103',
              invite_code_enabled: false,
              meetingTime: new Date(now.getTime() + 10 * 60000).toISOString(),
              time: new Date(now.getTime() + 10 * 60000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
              isPublic: true,
            },
          ];
          setAvailableRooms(demoRooms);
        }
      } catch (error) {
        console.log('전체 방 목록 조회 실패, 데모 데이터 사용:', error.message);
        // 에러 발생 시 데모 데이터 사용
        const now = new Date();
        const demoRooms = [
          {
            room_id: 101,
            roomCode: '100101',
            departure: '기흥역3번출구',
            destination: '강남대학교',
            max_members: 4,
            current_count: 2,
            host_id: 999,
            status: 'OPEN',
            invite_code: '100101',
            invite_code_enabled: false,
            meetingTime: new Date(now.getTime() + 15 * 60000).toISOString(),
            time: new Date(now.getTime() + 15 * 60000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
            isPublic: true,
          },
          {
            room_id: 102,
            roomCode: '100102',
            departure: '기흥역4번출구',
            destination: '이공관',
            max_members: 3,
            current_count: 1,
            host_id: 998,
            status: 'OPEN',
            invite_code: '100102',
            invite_code_enabled: true,
            meetingTime: new Date(now.getTime() + 20 * 60000).toISOString(),
            time: new Date(now.getTime() + 20 * 60000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
            isPublic: true,
          },
          {
            room_id: 103,
            roomCode: '100103',
            departure: '강대역1번출구',
            destination: '샬롬관',
            max_members: 4,
            current_count: 3,
            host_id: 997,
            status: 'OPEN',
            invite_code: '100103',
            invite_code_enabled: false,
            meetingTime: new Date(now.getTime() + 10 * 60000).toISOString(),
            time: new Date(now.getTime() + 10 * 60000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
            isPublic: true,
          },
        ];
        setAvailableRooms(demoRooms);
      }
    };
    
    loadRooms();
  }, []);

  // 참여중인 채팅방 목록이 변경될 때마다 AsyncStorage에 저장
  useEffect(() => {
    const saveRooms = async () => {
      try {
        await saveParticipatingRooms(participatingRooms);
      } catch (error) {
        console.error('참여중인 채팅방 목록 저장 실패:', error);
      }
    };
    saveRooms();
  }, [participatingRooms]);

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
    // 이미 참여중인 방이 있는지 확인 (방 생성은 1개만 가능)
    if (participatingRooms.length > 0) {
      Alert.alert('알림', '기존의 방을 나가주세요.');
      return;
    }
    setCreateRoomModalVisible(true);
  };

  // 초대코드 입장 모달 열기
  const handleInviteCode = () => {
    setInviteCodeModalVisible(true);
  };

  // 방 목록 새로고침
  const handleRefreshRooms = async () => {
    try {
      // 내가 참여중인 방 목록 새로고침
      const myRooms = await getMyRooms();
      if (myRooms && myRooms.length > 0) {
        const formattedRooms = myRooms.map(room => ({
          room_id: room.id,
          roomCode: room.roomCode,
          departure: room.meetingPoint,
          destination: room.destination,
          max_members: room.capacity,
          current_count: room.memberCount,
          host_id: room.leaderId,
          status: room.status,
          invite_code: room.roomCode,
          invite_code_enabled: false,
          meetingTime: room.meetingTime,
          time: new Date(room.meetingTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
          isPublic: true,
        }));
        setParticipatingRooms(formattedRooms);
      }
      
      // 전체 방 목록 새로고침
      const allRooms = await getRooms();
      if (allRooms && allRooms.length > 0) {
        const formattedRooms = allRooms.map(room => ({
          room_id: room.id,
          roomCode: room.roomCode,
          departure: room.meetingPoint,
          destination: room.destination,
          max_members: room.capacity,
          current_count: room.memberCount,
          host_id: room.leaderId,
          status: room.status,
          invite_code: room.roomCode,
          invite_code_enabled: false,
          meetingTime: room.meetingTime,
          time: new Date(room.meetingTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
          isPublic: true,
        }));
        setAvailableRooms(formattedRooms);
      }
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
    
    // 공개 방인 경우 availableRooms에도 추가
    if (roomData.isPublic !== false) {
      setAvailableRooms((prev) => {
        const exists = prev.some((room) => room.room_id === roomData.room_id);
        if (exists) return prev;
        return [...prev, roomData];
      });
    }
    
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
      
      // 참여중인 채팅방 목록에 추가
      setParticipatingRooms((prev) => {
        const exists = prev.some((r) => r.room_id === updatedRoomData.room_id);
        if (exists) {
          // 이미 있으면 업데이트
          return prev.map((r) => r.room_id === updatedRoomData.room_id ? updatedRoomData : r);
        }
        return [...prev, updatedRoomData];
      });
      
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

  const goToMyPage = () => {
    navigation.jumpTo('MyPage');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />


      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Kangnam Taxi</Text>
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

        {/* 참여중인 채팅방과 방 목록 헤더를 하나의 박스로 묶기 */}
        {participatingRooms.length > 0 && (
          <View style={styles.participatingRoomsContainer}>
            {/* 참여중인 채팅방 섹션 */}
            <View style={styles.section}>
              <View style={styles.participatingRoomsHeader}>
                <Text style={styles.participatingRoomsTitle}>참여중인 채팅방</Text>
                <TouchableOpacity 
                  style={styles.smallRefreshButton}
                  onPress={handleRefreshRooms}
                >
                  <MaterialIcons name="refresh" size={16} color="#999" />
                </TouchableOpacity>
              </View>
              
              {/* 채팅방 목록 헤더 */}
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
                </View>
              </View>
              
              {/* 참여중인 채팅방 방 정보들 */}
              {participatingRooms.map((room) => {
                const currentCount = room.current_count || 0;
                const maxMembers = room.max_members || 4; // 방 생성 시 설정한 인원 수
                return (
                <View key={room.room_id} style={styles.roomItem}>
                  <TouchableOpacity 
                    style={styles.roomItemContent}
                    onPress={() => handleEnterRoom(room)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.roomListColumn}>
                      <View style={styles.roomNumberWithLock}>
                        <Text style={styles.roomNumberText}>{room.room_id}</Text>
                        {(room.isPublic === false || room.invite_code_enabled) && (
                          <View style={{ marginLeft: 6 }}>
                            <LockIcon size={18} />
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.roomListColumn}>
                    <View style={styles.destinationContainer}>
                      <Text 
                        style={styles.destinationText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {room.departure || '출발지'}
                      </Text>
                      <View style={styles.destinationRow}>
                        <Text style={styles.arrowText}>→</Text>
                        <Text 
                          style={styles.destinationText}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {room.destination || '도착지'}
                        </Text>
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
                  </TouchableOpacity>
                  <View style={[styles.roomListColumn, { alignItems: 'flex-end', flex: 0, width: 40 }]}>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={() => {
                        Alert.alert(
                          '채팅방 나가기',
                          '채팅방에서 나가시겠습니까? 목록에서도 제거됩니다.',
                          [
                            { text: '취소', style: 'cancel' },
                            { 
                              text: '나가기', 
                              style: 'destructive',
                              onPress: () => {
                                handleLeaveRoomFromChat(room.room_id);
                              }
                            },
                          ]
                        );
                      }}
                    >
                      <MaterialIcons name="close" size={16} color="#333" />
                    </TouchableOpacity>
                  </View>
                </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 방 목록 헤더 (참여중인 채팅방이 없을 때만 표시) */}
        {participatingRooms.length === 0 && (
          <View style={styles.roomsContainer}>
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
                  <MaterialIcons name="refresh" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* 방 목록 섹션 */}
        {availableRooms.filter(room => room.isPublic !== false).length > 0 && (
          <View style={styles.availableRoomsContainer}>
            <View style={styles.availableRoomsHeader}>
              <Text style={styles.availableRoomsTitle}>참여 가능한 채팅방</Text>
              <TouchableOpacity 
                style={styles.smallRefreshButton}
                onPress={handleRefreshRooms}
              >
                <MaterialIcons name="refresh" size={16} color="#999" />
              </TouchableOpacity>
            </View>
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
              </View>
            </View>
            {/* 다른 사람들이 생성한 방 목록 (공개 방만 표시) */}
            {availableRooms.filter(room => room.isPublic !== false).map((room) => {
            const currentCount = room.current_count || 0;
            const maxMembers = room.max_members || 4; // 방 생성 시 설정한 인원 수
            return (
              <View key={room.room_id} style={styles.roomListItem}>
                <View style={styles.roomListColumn}>
                  <View style={styles.roomNumberWithLock}>
                    <Text style={styles.roomListNumber}>{room.room_id}</Text>
                    {(room.isPublic === false || room.invite_code_enabled) && (
                      <LockIcon size={18} />
                    )}
                  </View>
                </View>
                <View style={styles.roomListColumn}>
                  <View style={styles.roomListDestination}>
                    <Text 
                      style={styles.roomListDestinationText}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {room.departure || '출발지'}
                    </Text>
                    <View style={styles.destinationRow}>
                      <Text style={styles.roomListArrowText}>→</Text>
                      <Text 
                        style={styles.roomListDestinationText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
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
                <View style={[styles.roomListColumn, styles.roomListColumnRight]}>
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
                      // 데모 데이터인지 확인 (roomCode가 100으로 시작하는 경우)
                      const isDemoRoom = room.roomCode && room.roomCode.startsWith('100');
                      
                      if (isDemoRoom) {
                        // 데모 데이터: API 호출 없이 로컬에서 처리
                        const updatedRoomData = {
                          ...room,
                          current_count: Math.min((room.current_count || 0) + 1, room.max_members),
                        };
                        
                        // 참여중인 채팅방 목록에 추가
                        setParticipatingRooms((prev) => {
                          const exists = prev.some((r) => r.room_id === updatedRoomData.room_id);
                          if (exists) return prev;
                          return [...prev, updatedRoomData];
                        });
                        
                        // availableRooms에서 인원 수 업데이트
                        setAvailableRooms((prev) =>
                          prev.map((r) =>
                            r.room_id === updatedRoomData.room_id ? updatedRoomData : r
                          )
                        );
                        
                        // 채팅방으로 이동
                        navigateToChat(updatedRoomData, false);
                      } else {
                        // 실제 API 호출
                        try {
                          const roomCode = room.roomCode || room.invite_code || room.room_id?.toString();
                          const response = await joinRoom(roomCode);
                          
                          // API 응답을 UI 형식에 맞게 변환
                          const updatedRoomData = {
                            room_id: response.id || room.room_id,
                            roomCode: response.roomCode || roomCode,
                            departure: response.meetingPoint || room.departure,
                            destination: response.destination || room.destination,
                            max_members: response.capacity || room.max_members,
                            current_count: response.memberCount || (room.current_count || 0) + 1,
                            host_id: response.leaderId || room.host_id,
                            status: response.status || room.status,
                            invite_code: response.roomCode,
                            invite_code_enabled: room.invite_code_enabled,
                            meetingTime: response.meetingTime || room.meetingTime,
                            time: room.time || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
                            isPublic: room.isPublic,
                          };
                          
                          // 참여중인 채팅방 목록에 추가
                          setParticipatingRooms((prev) => {
                            const exists = prev.some((r) => r.room_id === updatedRoomData.room_id);
                            if (exists) return prev;
                            return [...prev, updatedRoomData];
                          });
                          
                          // 채팅방으로 이동
                          navigateToChat(updatedRoomData, false);
                        } catch (error) {
                          console.error('방 참여 에러:', error);
                          if (error.message === 'Room is full' || error.message.includes('인원 초과')) {
                            Alert.alert('알림', '인원이 가득 찼습니다.');
                          } else if (error.message === 'Room not found') {
                            Alert.alert('알림', '존재하지 않는 방입니다.');
                          } else {
                            Alert.alert('알림', error.message || '방 참여에 실패했습니다.');
                          }
                        }
                      }
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
        )}
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
    </View>
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
    paddingTop: (StatusBar.currentHeight || 0) + 65,
    paddingBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
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
  // 참여중인 채팅방과 헤더를 묶는 컨테이너
  roomsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // 참여중인 채팅방 컨테이너 (참여 가능한 채팅방과 동일한 스타일)
  participatingRoomsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  // 참여 가능한 채팅방 컨테이너
  availableRoomsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  // 섹션 스타일
  section: {
    marginBottom: 0,
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
  // 참여중인 채팅방 헤더 (참여 가능한 채팅방과 동일한 스타일)
  participatingRoomsHeader: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participatingRoomsTitle: {
    fontSize: 17,
    color: '#666',
    fontWeight: '600',
  },
  // 작은 새로고침 버튼 (제목 옆)
  smallRefreshButton: {
    padding: 4,
    borderRadius: 4,
  },
  // 참여 가능한 채팅방 헤더
  availableRoomsHeader: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availableRoomsTitle: {
    fontSize: 17,
    color: '#666',
    fontWeight: '600',
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
  roomItemContent: {
    flex: 1,
    flexDirection: 'row',
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
    width: '100%',
    paddingHorizontal: 2,
  },
  destinationText: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
    lineHeight: 14,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  arrowText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 2,
  },
  memberCounterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: {
    fontSize: 18,
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
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
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
  roomListColumnRight: {
    alignItems: 'flex-end',
    paddingRight: 5,
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
    width: '100%',
    paddingHorizontal: 2,
  },
  roomListArrowText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 2,
  },
  roomListDestinationText: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
    lineHeight: 14,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  roomListEnterButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  roomListEnterButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  roomListEnterButtonTextDisabled: {
    color: '#666',
  },
});

export default TaxiScreen;


