import React, { useState, useEffect, useRef } from 'react';
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
import { joinRoom, getRoomDetail, getRooms, getMyRooms, leaveRoom } from '../services/taxiApi';
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

  // 초기 로드 완료 여부 추적
  const isInitialLoadComplete = useRef(false);
  // availableRooms 참조 (polling에서 사용)
  const availableRoomsRef = useRef(availableRooms);
  
  // 컴포넌트 마운트 시 참여중인 채팅방 목록 불러오기
  useEffect(() => {
    const loadRooms = async () => {
      let loadedParticipatingRooms = [];
      
      try {
        // 먼저 AsyncStorage에서 데이터 불러오기 (빠른 표시를 위해)
        const savedRooms = await getParticipatingRooms();
        if (savedRooms && savedRooms.length > 0) {
          // 데모 데이터 필터링
          const filteredSavedRooms = savedRooms.filter(room => {
            const roomCode = room.roomCode || room.invite_code || '';
            return !roomCode.startsWith('100');
          });
          if (filteredSavedRooms.length > 0) {
            loadedParticipatingRooms = filteredSavedRooms;
            setParticipatingRooms(filteredSavedRooms);
          }
        }
        
        // 백엔드에서 내가 참여중인 방 목록 가져오기
        let myRooms = [];
        try {
          myRooms = await getMyRooms();
          console.log('getMyRooms 응답:', myRooms);
        } catch (error) {
          // 에러 발생 시 조용히 처리 (콘솔 에러 로그 제거)
          // console.error('내 방 목록 조회 실패:', error);
          // 에러 발생 시 빈 배열로 처리
          myRooms = [];
        }
        
        if (myRooms && myRooms.length > 0) {
          // API 응답을 UI 형식에 맞게 변환
          // Swagger 응답 형식: { id, roomCode, meetingPoint, destination, meetingTime, capacity, status, memberCount, leaderId }
          // 백엔드에서 받은 데이터를 우선 사용 (나간 방은 백엔드에서 제거되므로)
          const formattedRooms = myRooms
            .filter(room => room && room.id) // null 체크
            .map(room => {
              return {
                room_id: room.id, // Swagger: id
                roomCode: room.roomCode, // Swagger: roomCode
                departure: room.meetingPoint, // Swagger: meetingPoint
                destination: room.destination, // Swagger: destination
                max_members: (room.capacity !== null && room.capacity !== undefined) ? room.capacity : 4, // Swagger: capacity (기본값 4)
                current_count: room.memberCount || 0, // Swagger: memberCount (기본값 0)
                host_id: room.leaderId, // Swagger: leaderId
                status: room.status || 'OPEN', // Swagger: status (기본값 OPEN)
                invite_code: room.roomCode || room.invite_code, // roomCode를 invite_code로도 사용
                invite_code_enabled: room.invite_code_enabled !== undefined ? room.invite_code_enabled : true, // 백엔드 응답 또는 기본값 true
                meetingTime: room.meetingTime || new Date().toISOString(), // Swagger: meetingTime
                time: room.meetingTime 
                  ? new Date(room.meetingTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
                  : new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
                isPublic: room.isPublic !== undefined ? room.isPublic : true, // 백엔드 응답 또는 기본값 true
              };
            });
          // 데모 데이터 필터링
          const filteredRooms = formattedRooms.filter(room => {
            const roomCode = room.roomCode || room.invite_code || '';
            return !roomCode.startsWith('100');
          });
          loadedParticipatingRooms = filteredRooms;
          setParticipatingRooms(filteredRooms);
          // AsyncStorage에 저장 (백엔드 데이터와 동기화)
          await saveParticipatingRooms(filteredRooms).catch(err => {
            console.error('AsyncStorage 저장 실패:', err);
          });
          // 초기 로드 완료 표시
          isInitialLoadComplete.current = true;
        } else {
          // API가 빈 배열을 반환한 경우
          // 백엔드가 정상적으로 빈 배열을 반환했다면 실제로 참여중인 방이 없는 것
          // 하지만 네트워크 에러나 일시적 문제일 수도 있으므로, AsyncStorage에 저장된 데이터가 있으면 유지
          if (loadedParticipatingRooms.length > 0) {
            // AsyncStorage에 저장된 데이터가 있으면 유지 (백엔드가 일시적으로 문제가 있을 수 있음)
            console.log('백엔드가 빈 배열을 반환했지만 AsyncStorage에 데이터가 있어 유지:', loadedParticipatingRooms.length);
            setParticipatingRooms(loadedParticipatingRooms);
          } else {
            // AsyncStorage에도 데이터가 없으면 실제로 참여중인 방이 없는 것
            loadedParticipatingRooms = [];
            setParticipatingRooms([]);
            await saveParticipatingRooms([]).catch(err => {
              console.error('AsyncStorage 비우기 실패:', err);
            });
          }
          // 초기 로드 완료 표시
          isInitialLoadComplete.current = true;
        }
      } catch (error) {
        console.error('참여중인 채팅방 목록 불러오기 실패:', error);
        // 에러 발생 시 기존 데이터 유지 (네트워크 에러나 일시적 문제일 수 있음)
        if (loadedParticipatingRooms.length > 0) {
          // AsyncStorage에 저장된 데이터가 있으면 유지
          console.log('초기 로드 에러: AsyncStorage 데이터 유지:', loadedParticipatingRooms.length);
          setParticipatingRooms(loadedParticipatingRooms);
        } else {
          // AsyncStorage에도 데이터가 없으면 빈 배열로 설정
          loadedParticipatingRooms = [];
          setParticipatingRooms([]);
        }
        // 초기 로드 완료 표시
        isInitialLoadComplete.current = true;
      }
      
      // 전체 방 목록 가져오기 (공개 방 목록)
      // 참여중인 방 목록을 먼저 로드한 후 호출하여 정확한 필터링 가능
      try {
        const allRooms = await getRooms();
        console.log('전체 방 목록 API 응답:', JSON.stringify(allRooms, null, 2));
        if (allRooms && allRooms.length > 0) {
          // Swagger 응답 형식에 맞게 UI 형식으로 변환
          // Swagger 응답: { id, roomCode, meetingPoint, destination, meetingTime, capacity, status, memberCount, leaderId }
          // 모든 방을 표시 (참여중인 방도 포함)
          const formattedRooms = allRooms
            .filter(room => room && room.id) // null 체크만 수행
            .map(room => {
              if (!room) return null; // null 체크
              console.log('방 데이터 변환 (Swagger 형식):', room);
              
              return {
                room_id: room.id, // Swagger: id
                roomCode: room.roomCode, // Swagger: roomCode
                departure: room.meetingPoint, // Swagger: meetingPoint
                destination: room.destination, // Swagger: destination
                max_members: (room.capacity !== null && room.capacity !== undefined) ? room.capacity : 4, // Swagger: capacity (기본값 4)
                current_count: room.memberCount || 0, // Swagger: memberCount (기본값 0)
                host_id: room.leaderId, // Swagger: leaderId
                status: room.status || 'OPEN', // Swagger: status (기본값 OPEN)
                invite_code: room.roomCode, // roomCode를 invite_code로도 사용
                invite_code_enabled: room.invite_code_enabled !== undefined ? room.invite_code_enabled : false, // 기본값 false (초대코드 필요)
                meetingTime: room.meetingTime || new Date().toISOString(), // Swagger: meetingTime
                time: room.meetingTime 
                  ? new Date(room.meetingTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
                  : new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
                isPublic: room.isPublic !== undefined ? room.isPublic : true, // 기본값 true (공개 방)
              };
            })
            .filter(room => room !== null); // null 제거
          
          console.log('필터링된 참여 가능한 방 목록:', formattedRooms);
          console.log('전체 방 개수:', allRooms.length, '표시할 방 개수:', formattedRooms.length);
          setAvailableRooms(formattedRooms);
        } else {
          // API가 없거나 빈 배열이면 빈 배열로 설정
          console.log('전체 방 목록이 비어있음 또는 null/undefined');
          setAvailableRooms([]);
        }
      } catch (error) {
        console.error('전체 방 목록 조회 실패:', error);
        console.error('에러 상세:', error.message, error.stack);
        // 에러 발생 시 빈 배열로 설정
        setAvailableRooms([]);
      }
    };
    
    loadRooms();
  }, []);

  // 참여중인 방이 변경되어도 availableRooms에서 제외하지 않음 (모든 방 표시)
  // useEffect(() => {
  //   if (participatingRooms.length > 0) {
  //     setAvailableRooms(prev => {
  //       const participatingRoomIds = participatingRooms.map(r => r.room_id);
  //       return prev.filter(room => !participatingRoomIds.includes(room.room_id));
  //     });
  //   }
  // }, [participatingRooms]);

  // availableRooms ref 업데이트
  useEffect(() => {
    availableRoomsRef.current = availableRooms;
  }, [availableRooms]);

  // 방 인원 실시간 업데이트 Polling (5초마다)
  useEffect(() => {
    if (!isInitialLoadComplete.current) return; // 초기 로드 완료 후에만 실행
    
    const roomInfoPolling = setInterval(async () => {
      try {
        // 참여중인 방 목록 업데이트
        const myRooms = await getMyRooms();
        if (myRooms && Array.isArray(myRooms) && myRooms.length > 0) {
          const formattedRooms = myRooms
            .filter(room => room && room.id)
            .map(room => {
              return {
                room_id: room.id,
                roomCode: room.roomCode,
                departure: room.meetingPoint,
                destination: room.destination,
                max_members: (room.capacity !== null && room.capacity !== undefined) ? room.capacity : 4,
                current_count: room.memberCount || 0,
                host_id: room.leaderId,
                status: room.status || 'OPEN',
                invite_code: room.roomCode || room.invite_code,
                invite_code_enabled: room.invite_code_enabled !== undefined ? room.invite_code_enabled : true,
                meetingTime: room.meetingTime || new Date().toISOString(),
                time: room.meetingTime 
                  ? new Date(room.meetingTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
                  : new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
                isPublic: room.isPublic !== undefined ? room.isPublic : true,
              };
            });
          
          // 데모 데이터 필터링
          const filteredRooms = formattedRooms.filter(room => {
            const roomCode = room.roomCode || room.invite_code || '';
            return !roomCode.startsWith('100');
          });
          
          setParticipatingRooms(filteredRooms);
          // AsyncStorage에도 저장 (백엔드 데이터와 동기화)
          await saveParticipatingRooms(filteredRooms).catch(err => {
            console.error('AsyncStorage 저장 실패:', err);
          });
        } else {
          // 백엔드가 빈 배열을 반환한 경우, 기존 데이터 유지 (일시적 문제일 수 있음)
          // 실제로 방을 나갔다면 handleLeaveRoomFromChat에서 제거되므로 여기서는 유지
          console.log('Polling: 백엔드가 빈 배열을 반환했지만 기존 데이터 유지');
        }
        
        // 참여 가능한 방 목록 업데이트
        const allRooms = await getRooms();
        if (allRooms && Array.isArray(allRooms) && allRooms.length > 0) {
          const formattedRooms = allRooms
            .filter(room => room && room.id)
            .map(room => {
              const existingRoom = availableRoomsRef.current.find(r => r.room_id === room.id);
              return {
                room_id: room.id,
                roomCode: room.roomCode,
                departure: room.meetingPoint,
                destination: room.destination,
                max_members: (room.capacity !== null && room.capacity !== undefined) ? room.capacity : 4,
                current_count: room.memberCount || 0,
                host_id: room.leaderId,
                status: room.status || 'OPEN',
                invite_code: room.roomCode,
                invite_code_enabled: room.invite_code_enabled !== undefined 
                  ? room.invite_code_enabled 
                  : (existingRoom?.invite_code_enabled !== undefined ? existingRoom.invite_code_enabled : false),
                meetingTime: room.meetingTime || new Date().toISOString(),
                time: room.meetingTime 
                  ? new Date(room.meetingTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
                  : new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
                isPublic: room.isPublic !== undefined 
                  ? room.isPublic 
                  : (existingRoom?.isPublic !== undefined ? existingRoom.isPublic : true),
              };
            });
          
          setAvailableRooms(formattedRooms);
        }
      } catch (error) {
        // 에러 발생 시 조용히 처리 (Polling은 계속 진행)
        console.log('방 인원 Polling 실패:', error.message);
      }
    }, 5000); // 5초마다 확인
    
    return () => {
      clearInterval(roomInfoPolling);
    };
  }, [isInitialLoadComplete.current]);

  // 참여중인 채팅방 목록이 변경될 때마다 AsyncStorage에 저장
  useEffect(() => {
    // 초기 로드가 완료된 후에만 저장 (백엔드에서 불러온 후)
    if (!isInitialLoadComplete.current) {
      return;
    }
    
    const saveRooms = async () => {
      try {
        // 데모 데이터 필터링 (roomCode가 '100'으로 시작하는 방 제외)
        const filteredRooms = participatingRooms.filter(room => {
          const roomCode = room.roomCode || room.invite_code || '';
          return !roomCode.startsWith('100');
        });
        // 필터링된 방 목록을 AsyncStorage에 저장
        await saveParticipatingRooms(filteredRooms);
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
  // 주의: ChatScreen에서 이미 leaveRoom API를 호출한 후 이 함수를 호출하므로,
  // 여기서는 로컬 상태와 AsyncStorage에서 제거합니다.
  const handleLeaveRoomFromChat = async (roomId) => {
    if (!roomId) return;
    
    // 나가는 방 정보 저장 (나중에 availableRooms에 추가하기 위해)
    const leavingRoom = participatingRooms.find(room => room.room_id === roomId);
    
    // 참여중인 채팅방 목록에서 제거
    setParticipatingRooms((prev) => {
      const filtered = prev.filter((room) => {
        const roomCode = room.roomCode || room.invite_code || '';
        // 나가는 방과 데모 데이터 모두 제거
        return room.room_id !== roomId && !roomCode.startsWith('100');
      });
      
      // AsyncStorage에서도 즉시 제거 (비동기로 처리)
      saveParticipatingRooms(filtered).catch(err => {
        console.error('AsyncStorage에서 방 제거 실패:', err);
      });
      
      return filtered;
    });
    
    // 나간 방을 참여 가능한 채팅방 목록에 다시 추가
    // getRooms를 호출하여 최신 방 정보를 가져옴
    try {
      const allRooms = await getRooms();
      if (allRooms && allRooms.length > 0) {
        // 나간 방을 찾아서 availableRooms에 추가
        const leftRoom = allRooms.find(r => r && r.id === roomId);
        if (leftRoom) {
          const formattedRoom = {
            room_id: leftRoom.id,
            roomCode: leftRoom.roomCode,
            departure: leftRoom.meetingPoint,
            destination: leftRoom.destination,
            max_members: leftRoom.capacity || 4, // 기본값 4
            current_count: leftRoom.memberCount || 0, // 기본값 0
            host_id: leftRoom.leaderId,
            status: leftRoom.status || 'OPEN', // 기본값 OPEN
            invite_code: leftRoom.roomCode,
            invite_code_enabled: leftRoom.invite_code_enabled !== undefined ? leftRoom.invite_code_enabled : false,
            meetingTime: leftRoom.meetingTime || new Date().toISOString(),
            time: leftRoom.meetingTime 
              ? new Date(leftRoom.meetingTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
              : new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
            isPublic: leftRoom.isPublic !== undefined ? leftRoom.isPublic : true,
          };
          
          setAvailableRooms((prev) => {
            // 이미 있는지 확인
            const exists = prev.some(r => r.room_id === formattedRoom.room_id);
            if (exists) {
              // 이미 있으면 업데이트
              return prev.map(r => r.room_id === formattedRoom.room_id ? formattedRoom : r);
            }
            // 없으면 추가
            return [...prev, formattedRoom];
          });
        }
      }
    } catch (error) {
      console.error('방 목록 새로고침 실패:', error);
      // 에러 발생 시에도 기존 방 정보로 availableRooms에 추가 시도
      if (leavingRoom) {
        setAvailableRooms((prev) => {
          const exists = prev.some(r => r.room_id === leavingRoom.room_id);
          if (!exists) {
            // 인원 수 감소
            const updatedRoom = {
              ...leavingRoom,
              current_count: Math.max(0, (leavingRoom.current_count || 1) - 1),
            };
            return [...prev, updatedRoom];
          }
          return prev;
        });
      }
    }
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
      let myRooms = [];
      try {
        myRooms = await getMyRooms();
      } catch (error) {
        // 에러 발생 시 조용히 처리 (콘솔 에러 로그 제거)
        // console.error('방 목록 새로고침 실패:', error);
        // 에러 발생 시 빈 배열로 처리
        myRooms = [];
      }
      
      if (myRooms && Array.isArray(myRooms) && myRooms.length > 0) {
        // API 응답을 UI 형식에 맞게 변환
        // Swagger 응답 형식: { id, roomCode, meetingPoint, destination, meetingTime, capacity, status, memberCount, leaderId }
        // 백엔드에서 받은 데이터를 우선 사용 (나간 방은 백엔드에서 제거되므로)
        const formattedRooms = myRooms
          .filter(room => room && room.id) // null 체크
          .map(room => {
            return {
              room_id: room.id, // Swagger: id
              roomCode: room.roomCode, // Swagger: roomCode
              departure: room.meetingPoint, // Swagger: meetingPoint
              destination: room.destination, // Swagger: destination
              max_members: room.capacity || 4, // Swagger: capacity (기본값 4)
              current_count: room.memberCount || 0, // Swagger: memberCount (기본값 0)
              host_id: room.leaderId, // Swagger: leaderId
              status: room.status || 'OPEN', // Swagger: status (기본값 OPEN)
              invite_code: room.roomCode || room.invite_code, // roomCode를 invite_code로도 사용
              invite_code_enabled: room.invite_code_enabled !== undefined ? room.invite_code_enabled : true, // 백엔드 응답 또는 기본값 true
              meetingTime: room.meetingTime || new Date().toISOString(), // Swagger: meetingTime
              time: room.meetingTime 
                ? new Date(room.meetingTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
                : new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
              isPublic: room.isPublic !== undefined ? room.isPublic : true, // 백엔드 응답 또는 기본값 true
            };
          });
        // 데모 데이터 필터링
        const filteredRooms = formattedRooms.filter(room => {
          const roomCode = room.roomCode || room.invite_code || '';
          return !roomCode.startsWith('100');
        });
        setParticipatingRooms(filteredRooms);
        // AsyncStorage에도 저장 (백엔드 데이터와 동기화)
        await saveParticipatingRooms(filteredRooms).catch(err => {
          console.error('AsyncStorage 저장 실패:', err);
        });
      } else {
        // 백엔드가 빈 배열을 반환한 경우
        // 네트워크 에러나 일시적 문제일 수 있으므로, 현재 상태 유지
        // 실제로 방을 나갔다면 handleLeaveRoomFromChat에서 제거되므로 여기서는 유지
        const currentRooms = await getParticipatingRooms();
        if (currentRooms && currentRooms.length > 0) {
          console.log('새로고침: 백엔드가 빈 배열을 반환했지만 기존 데이터 유지:', currentRooms.length);
          // 기존 데이터 유지 (AsyncStorage에서 가져온 데이터)
          setParticipatingRooms(currentRooms);
        } else {
          // AsyncStorage에도 데이터가 없으면 실제로 참여중인 방이 없는 것
          setParticipatingRooms([]);
          await saveParticipatingRooms([]).catch(err => {
            console.error('AsyncStorage 비우기 실패:', err);
          });
        }
      }
      
      // 전체 방 목록 새로고침
      const allRooms = await getRooms();
      console.log('새로고침 - 전체 방 목록 API 응답:', allRooms);
      if (allRooms && Array.isArray(allRooms) && allRooms.length > 0) {
        // Swagger 응답 형식에 맞게 UI 형식으로 변환
        // 모든 방을 표시 (참여중인 방도 포함)
        const formattedRooms = allRooms
          .filter(room => room && room.id) // null 체크만 수행
          .map(room => {
            if (!room) return null; // null 체크
            // 기존 availableRooms에서 같은 방을 찾아서 invite_code_enabled 값 유지
            const existingRoom = availableRooms.find(r => r.room_id === room.id);
            
            return {
              room_id: room.id, // Swagger: id
              roomCode: room.roomCode, // Swagger: roomCode
              departure: room.meetingPoint, // Swagger: meetingPoint
              destination: room.destination, // Swagger: destination
              max_members: room.capacity || 4, // Swagger: capacity (기본값 4)
              current_count: room.memberCount || 0, // Swagger: memberCount (기본값 0)
              host_id: room.leaderId, // Swagger: leaderId
              status: room.status || 'OPEN', // Swagger: status (기본값 OPEN)
              invite_code: room.roomCode, // roomCode를 invite_code로도 사용
              invite_code_enabled: room.invite_code_enabled !== undefined 
                ? room.invite_code_enabled 
                : (existingRoom?.invite_code_enabled !== undefined ? existingRoom.invite_code_enabled : false), // 기본값 false
              meetingTime: room.meetingTime || new Date().toISOString(), // Swagger: meetingTime
              time: room.meetingTime 
                ? new Date(room.meetingTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
                : new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
              isPublic: room.isPublic !== undefined 
                ? room.isPublic 
                : (existingRoom?.isPublic !== undefined ? existingRoom.isPublic : true), // 기본값 true
            };
          })
          .filter(room => room !== null); // null 제거
        
        console.log('새로고침 - 필터링된 참여 가능한 방 목록:', formattedRooms);
        console.log('새로고침 - 전체 방 개수:', allRooms.length, '표시할 방 개수:', formattedRooms.length);
        setAvailableRooms(formattedRooms);
      } else {
        // API가 없거나 빈 배열이면 빈 배열로 설정
        console.log('새로고침 - 전체 방 목록이 비어있음');
        setAvailableRooms([]);
      }
      } catch (error) {
        console.error('방 목록 새로고침 실패:', error);
        // 에러 발생 시 기존 데이터 유지 (네트워크 에러나 일시적 문제일 수 있음)
        const currentRooms = await getParticipatingRooms();
        if (currentRooms && currentRooms.length > 0) {
          console.log('새로고침 에러: 기존 데이터 유지:', currentRooms.length);
          setParticipatingRooms(currentRooms);
        } else {
          // AsyncStorage에도 데이터가 없으면 빈 배열로 설정
          setParticipatingRooms([]);
        }
      }
  };

  // 방 생성 완료 후 채팅방으로 이동
  const handleRoomCreated = (roomData) => {
    setCreateRoomModalVisible(false);
    // 방장이 생성한 방은 바로 참여중인 채팅방 목록에 추가 및 AsyncStorage에 저장
    setParticipatingRooms((prev) => {
      const exists = prev.some((room) => room.room_id === roomData.room_id);
      if (exists) {
        // 이미 있으면 업데이트
        const updated = prev.map(r => r.room_id === roomData.room_id ? roomData : r);
        // AsyncStorage에도 저장
        saveParticipatingRooms(updated).catch(err => console.error('AsyncStorage 저장 실패:', err));
        return updated;
      }
      const newList = [...prev, roomData];
      // AsyncStorage에도 저장
      saveParticipatingRooms(newList).catch(err => console.error('AsyncStorage 저장 실패:', err));
      return newList;
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
      // 모달 먼저 닫기
      setInviteCodeModalVisible(false);
      setSelectedRoomForInvite(null);
      
      // room_id가 없는 경우 (로컬에서 방을 찾지 못한 경우) 백엔드 API를 통해 방 찾기
      if (!roomData.room_id) {
        const roomCode = enteredCode || roomData.roomCode || roomData.invite_code;
        if (!roomCode) {
          Alert.alert('알림', '방 코드가 없습니다.');
          return;
        }
        
        // 백엔드 API를 통해 방 참여 시도
        try {
          const response = await joinRoom(roomCode);
          
          // API 응답을 UI 형식에 맞게 변환
          const updatedRoomData = {
            room_id: response.id,
            roomCode: response.roomCode || roomCode,
            departure: response.meetingPoint || '',
            destination: response.destination || '',
            max_members: response.capacity || 4,
            current_count: response.memberCount || 1,
            host_id: response.leaderId,
            status: response.status || 'OPEN',
            invite_code: response.roomCode || roomCode,
            invite_code_enabled: true,
            meetingTime: response.meetingTime || new Date().toISOString(),
            time: response.meetingTime 
              ? new Date(response.meetingTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
              : new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
            isPublic: true,
          };
          
          // 참여중인 채팅방 목록에 추가 및 AsyncStorage에 저장
          setParticipatingRooms((prev) => {
            const exists = prev.some((r) => r.room_id === updatedRoomData.room_id);
            if (exists) {
              // 이미 있으면 업데이트
              const updated = prev.map((r) => r.room_id === updatedRoomData.room_id ? updatedRoomData : r);
              // AsyncStorage에도 저장
              saveParticipatingRooms(updated).catch(err => console.error('AsyncStorage 저장 실패:', err));
              return updated;
            }
            const newList = [...prev, updatedRoomData];
            // AsyncStorage에도 저장
            saveParticipatingRooms(newList).catch(err => console.error('AsyncStorage 저장 실패:', err));
            return newList;
          });
          
          // 채팅방으로 이동
          setTimeout(() => {
            console.log('채팅방으로 이동:', updatedRoomData);
            navigateToChat(updatedRoomData, false);
          }, 100);
          return;
        } catch (apiError) {
          console.error('방 참여 API 에러:', apiError);
          if (apiError.message === 'Room not found' || apiError.message.includes('존재하지 않는')) {
            Alert.alert('알림', '존재하지 않는 방입니다.');
          } else if (apiError.message === 'Room is full' || apiError.message.includes('인원 초과')) {
            Alert.alert('알림', '인원이 가득 찼습니다.');
          } else {
            Alert.alert('알림', apiError.message || '방 참여에 실패했습니다.');
          }
          return;
        }
      }
      
      // 로컬에서 방을 찾은 경우
      // 인원이 가득 찬 경우 체크 (초대코드 모달에서 이미 증가시켰으므로 원래 값으로 체크)
      const originalCount = (roomData.current_count || 0) - 1; // 모달에서 증가시킨 값이므로 원래 값으로 복원
      if (originalCount >= (roomData.max_members || 4)) {
        Alert.alert('알림', '인원이 가득 찼습니다.');
        return;
      }

      // 초대코드가 맞았으므로 틀린 횟수 리셋
      if (roomData.room_id) {
        setRoomFailedAttempts((prev) => {
          const updated = { ...prev };
          delete updated[roomData.room_id];
          return updated;
        });
      }

      // 백엔드 API 호출하여 방 참여
      const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();
      const response = await joinRoom(roomCode);
      
      // API 응답을 UI 형식에 맞게 변환
      const updatedRoomData = {
        room_id: response.id || roomData.room_id,
        roomCode: response.roomCode || roomCode,
        departure: response.meetingPoint || roomData.departure,
        destination: response.destination || roomData.destination,
        max_members: response.capacity || roomData.max_members,
        current_count: response.memberCount || (roomData.current_count || 0) + 1,
        host_id: response.leaderId || roomData.host_id,
        status: response.status || roomData.status,
        invite_code: response.roomCode || roomData.invite_code || roomCode, // roomCode를 invite_code로도 사용
        invite_code_enabled: response.invite_code_enabled !== undefined 
          ? response.invite_code_enabled 
          : (roomData.invite_code_enabled !== undefined ? roomData.invite_code_enabled : true),
        meetingTime: response.meetingTime || roomData.meetingTime,
        time: response.meetingTime 
          ? new Date(response.meetingTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
          : roomData.time || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        isPublic: roomData.isPublic !== false,
      };
      
      // 참여중인 채팅방 목록에 추가 및 AsyncStorage에 저장
      setParticipatingRooms((prev) => {
        const exists = prev.some((r) => r.room_id === updatedRoomData.room_id);
        if (exists) {
          // 이미 있으면 업데이트
          const updated = prev.map((r) => r.room_id === updatedRoomData.room_id ? updatedRoomData : r);
          // AsyncStorage에도 저장
          saveParticipatingRooms(updated).catch(err => console.error('AsyncStorage 저장 실패:', err));
          return updated;
        }
        const newList = [...prev, updatedRoomData];
        // AsyncStorage에도 저장
        saveParticipatingRooms(newList).catch(err => console.error('AsyncStorage 저장 실패:', err));
        return newList;
      });
      
      // 모달이 닫힌 후 네비게이션 (약간의 지연을 두어 모달이 완전히 닫힌 후 이동)
      setTimeout(() => {
        console.log('채팅방으로 이동:', updatedRoomData);
        navigateToChat(updatedRoomData, false);
      }, 100);
    } catch (error) {
      console.error('방 참여 에러:', error);
      
      // 에러 메시지에 따라 다른 알림 표시
      setTimeout(() => {
        if (error.message === 'Room is full' || error.message.includes('인원 초과')) {
          Alert.alert('알림', '인원이 가득 찼습니다.');
        } else if (error.message === 'Room not found' || error.message.includes('존재하지 않는')) {
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
                  <Text style={[styles.listHeaderText, styles.listHeaderTextRight]}>목적지</Text>
                </View>
                <View style={styles.roomListColumn}>
                  <Text style={[styles.listHeaderText, styles.listHeaderTextRight, styles.listHeaderTextMoreRight, styles.listHeaderTextSingleLine]}>출발시간</Text>
                </View>
                <View style={styles.roomListColumn}>
                  <Text style={[styles.listHeaderText, styles.listHeaderTextRight, styles.listHeaderTextMoreRight, styles.listHeaderTextSingleLine, styles.listHeaderTextMostRight]}>인원현황</Text>
                </View>
                <View style={styles.roomListColumn}>
                </View>
              </View>
              
              {/* 참여중인 채팅방 방 정보들 */}
              {participatingRooms.length > 0 ? (
                participatingRooms.map((room) => {
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
                            {room.isPublic === false && (
                              <LockIcon size={10} />
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
                          onPress={async () => {
                            Alert.alert(
                              '채팅방 나가기',
                              '채팅방을 나가시겠습니까?',
                              [
                                { text: '취소', style: 'cancel' },
                                { 
                                  text: '나가기', 
                                  style: 'destructive',
                                  onPress: async () => {
                                    try {
                                      const roomCode = room.roomCode || room.invite_code || room.room_id?.toString();
                                      if (roomCode) {
                                        await leaveRoom(roomCode);
                                      }
                                      handleLeaveRoomFromChat(room.room_id);
                                    } catch (error) {
                                      console.error('방 나가기 에러:', error);
                                      Alert.alert('오류', error.message || '방 나가기에 실패했습니다.');
                                    }
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
                })
              ) : (
                <View style={styles.emptyRoomsContainer}>
                  <Text style={styles.emptyRoomsText}>참여중인 채팅방이 없습니다.</Text>
                </View>
              )}
            </View>
          </View>

        {/* 방 목록 섹션 - 항상 표시 */}
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
          {availableRooms.length > 0 ? (
            <>
              <View style={styles.listHeader}>
                <View style={styles.roomListColumn}>
                  <Text style={styles.listHeaderText}>방 번호</Text>
                </View>
                <View style={styles.roomListColumn}>
                  <Text style={[styles.listHeaderText, styles.listHeaderTextRight]}>목적지</Text>
                </View>
                <View style={styles.roomListColumn}>
                  <Text style={[styles.listHeaderText, styles.listHeaderTextRight, styles.listHeaderTextMoreRight, styles.listHeaderTextSingleLine]}>출발시간</Text>
                </View>
                <View style={styles.roomListColumn}>
                  <Text style={[styles.listHeaderText, styles.listHeaderTextRight, styles.listHeaderTextMoreRight, styles.listHeaderTextSingleLine, styles.listHeaderTextMostRight]}>인원현황</Text>
                </View>
                <View style={styles.roomListColumn}>
                </View>
              </View>
              {/* 다른 사람들이 생성한 방 목록 (공개 방만 표시) */}
              {availableRooms.map((room) => {
            const currentCount = room.current_count || 0;
            const maxMembers = room.max_members || 4; // 방 생성 시 설정한 인원 수
            // 참여중인 방인지 확인
            const isParticipating = participatingRooms.some(pRoom => pRoom.room_id === room.room_id);
            const isDisabled = isParticipating || (currentCount >= maxMembers);
            
            return (
              <View key={room.room_id} style={styles.roomItem}>
                <View style={styles.roomListColumn}>
                  <View style={styles.roomNumberWithLock}>
                    <Text style={styles.roomNumberText}>{room.room_id}</Text>
                    {room.isPublic === false && (
                      <LockIcon size={10} />
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
                <View style={[styles.roomListColumn, { alignItems: 'flex-end', flex: 0, width: 40 }]}>
                  <TouchableOpacity 
                    style={[
                      styles.roomListEnterButton,
                      isDisabled && styles.roomListEnterButtonDisabled
                    ]}
                    disabled={isDisabled}
                    onPress={async () => {
                    // 참여중인 방인 경우 입장 불가
                    if (isParticipating) {
                      Alert.alert('알림', '이미 참여중인 방입니다.');
                      return;
                    }
                    
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
                        
                        // 참여중인 채팅방 목록에 추가 및 AsyncStorage에 저장
                        setParticipatingRooms((prev) => {
                          const exists = prev.some((r) => r.room_id === updatedRoomData.room_id);
                          if (exists) {
                            // 이미 있으면 업데이트
                            const updated = prev.map(r => r.room_id === updatedRoomData.room_id ? updatedRoomData : r);
                            // AsyncStorage에도 저장
                            saveParticipatingRooms(updated).catch(err => console.error('AsyncStorage 저장 실패:', err));
                            return updated;
                          }
                          const newList = [...prev, updatedRoomData];
                          // AsyncStorage에도 저장
                          saveParticipatingRooms(newList).catch(err => console.error('AsyncStorage 저장 실패:', err));
                          return newList;
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
                            invite_code: response.roomCode || room.invite_code || roomCode, // roomCode를 invite_code로도 사용
                            invite_code_enabled: response.invite_code_enabled !== undefined 
                              ? response.invite_code_enabled 
                              : (room.invite_code_enabled !== undefined ? room.invite_code_enabled : true),
                            meetingTime: response.meetingTime || room.meetingTime,
                            time: room.time || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
                            isPublic: room.isPublic !== undefined ? room.isPublic : true,
                          };
                          
                          // 참여중인 채팅방 목록에 추가 및 AsyncStorage에 저장
                          setParticipatingRooms((prev) => {
                            const exists = prev.some((r) => r.room_id === updatedRoomData.room_id);
                            if (exists) {
                              // 이미 있으면 업데이트
                              const updated = prev.map(r => r.room_id === updatedRoomData.room_id ? updatedRoomData : r);
                              // AsyncStorage에도 저장
                              saveParticipatingRooms(updated).catch(err => console.error('AsyncStorage 저장 실패:', err));
                              return updated;
                            }
                            const newList = [...prev, updatedRoomData];
                            // AsyncStorage에도 저장
                            saveParticipatingRooms(newList).catch(err => console.error('AsyncStorage 저장 실패:', err));
                            return newList;
                          });
                          
                          // availableRooms에서 제거하지 않음 (모든 방 표시)
                          // setAvailableRooms((prev) => prev.filter(r => r.room_id !== updatedRoomData.room_id));
                          
                          // 채팅방으로 이동
                          navigateToChat(updatedRoomData, false);
                        } catch (error) {
                          console.error('방 참여 에러:', error);
                          // "이미 참여한 방" 에러인 경우, getMyRooms를 호출하여 방 정보를 가져와서 표시
                          if (error.message && (error.message.includes('이미 참여한 방') || error.message.includes('already'))) {
                            // getMyRooms를 호출하여 현재 참여중인 방 목록을 새로고침
                            try {
                              const myRooms = await getMyRooms();
                              if (myRooms && myRooms.length > 0) {
                                const roomCode = room.roomCode || room.invite_code || room.room_id?.toString();
                                // myRooms에서 해당 방 찾기
                                const foundRoom = myRooms.find(r => 
                                  (r.roomCode === roomCode) || 
                                  (r.id === room.room_id)
                                );
                                
                                if (foundRoom) {
                                  // API 응답을 UI 형식에 맞게 변환
                                  // Swagger 응답 형식: { id, roomCode, meetingPoint, destination, meetingTime, capacity, status, memberCount, leaderId }
                                  const updatedRoomData = {
                                    room_id: foundRoom.id, // Swagger: id
                                    roomCode: foundRoom.roomCode, // Swagger: roomCode
                                    departure: foundRoom.meetingPoint || room.departure, // Swagger: meetingPoint
                                    destination: foundRoom.destination || room.destination, // Swagger: destination
                                    max_members: foundRoom.capacity || room.max_members || 4, // Swagger: capacity (기본값 4)
                                    current_count: foundRoom.memberCount || room.current_count || 0, // Swagger: memberCount (기본값 0)
                                    host_id: foundRoom.leaderId || room.host_id, // Swagger: leaderId
                                    status: foundRoom.status || room.status || 'OPEN', // Swagger: status (기본값 OPEN)
                                    invite_code: foundRoom.roomCode || room.invite_code, // roomCode를 invite_code로도 사용
                                    invite_code_enabled: foundRoom.invite_code_enabled !== undefined ? foundRoom.invite_code_enabled : true,
                                    meetingTime: foundRoom.meetingTime || room.meetingTime || new Date().toISOString(), // Swagger: meetingTime
                                    time: foundRoom.meetingTime 
                                      ? new Date(foundRoom.meetingTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
                                      : (room.time || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })),
                                    isPublic: foundRoom.isPublic !== undefined ? foundRoom.isPublic : (room.isPublic !== undefined ? room.isPublic : true),
                                  };
                                  
                                  // 참여중인 채팅방 목록에 추가 및 AsyncStorage에 저장
                                  setParticipatingRooms((prev) => {
                                    const exists = prev.some((r) => r.room_id === updatedRoomData.room_id);
                                    if (exists) {
                                      const updated = prev.map(r => r.room_id === updatedRoomData.room_id ? updatedRoomData : r);
                                      saveParticipatingRooms(updated).catch(err => console.error('AsyncStorage 저장 실패:', err));
                                      return updated;
                                    }
                                    const newList = [...prev, updatedRoomData];
                                    saveParticipatingRooms(newList).catch(err => console.error('AsyncStorage 저장 실패:', err));
                                    return newList;
                                  });
                                  
                                  // availableRooms에서 제거하지 않음 (모든 방 표시)
                                  // setAvailableRooms((prev) => prev.filter(r => r.room_id !== updatedRoomData.room_id));
                                  
                                  // 채팅방으로 이동
                                  navigateToChat(updatedRoomData, false);
                                } else {
                                  // 방을 찾지 못한 경우, 기존 room 데이터로 이동
                                  const roomData = {
                                    ...room,
                                    invite_code: room.roomCode || room.invite_code,
                                  };
                                  navigateToChat(roomData, false);
                                }
                              } else {
                                // 방 목록을 가져오지 못한 경우, 기존 room 데이터로 이동
                                const roomData = {
                                  ...room,
                                  invite_code: room.roomCode || room.invite_code,
                                };
                                navigateToChat(roomData, false);
                              }
                            } catch (refreshError) {
                              console.error('방 목록 새로고침 실패:', refreshError);
                              // 에러 발생 시에도 기존 room 데이터로 이동
                              const roomData = {
                                ...room,
                                invite_code: room.roomCode || room.invite_code,
                              };
                              navigateToChat(roomData, false);
                            }
                          } else if (error.message === 'Room is full' || error.message.includes('인원 초과')) {
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
                >
                  <Text style={[
                    styles.roomListEnterButtonText,
                    isDisabled && styles.roomListEnterButtonTextDisabled
                  ]}>
                    입장
                  </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
            </>
          ) : (
            <View style={styles.emptyRoomsContainer}>
              <Text style={styles.emptyRoomsText}>참여 가능한 채팅방이 없습니다.</Text>
            </View>
          )}
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
    gap: 0,
  },
  roomNumberText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    width: '100%',
  },
  roomItemText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    width: '100%',
  },
  destinationContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  destinationText: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
    lineHeight: 14,
    width: '100%',
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
    width: '100%',
  },
  listHeaderTextRight: {
    paddingLeft: 15,
  },
  listHeaderTextMoreRight: {
    paddingLeft: 25,
  },
  listHeaderTextMostRight: {
    paddingLeft: 30,
  },
  listHeaderTextSingleLine: {
    fontSize: 14,
    flexShrink: 0,
    minWidth: 80,
    marginTop: 12,
  },
  // 5개 컬럼 레이아웃을 위한 공통 스타일
  roomListColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
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
    width: '100%',
  },
  roomListDestination: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    width: '100%',
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
    width: '100%',
  },
  roomListTime: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    width: '100%',
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
  emptyRoomsContainer: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRoomsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default TaxiScreen;


