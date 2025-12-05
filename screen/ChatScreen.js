import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Keyboard,
  Linking,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import MemberCounter from '../components/MemberCounter';
import SettlementModal from '../modal/SettlementModal';
import { sendMessage, getMessages, startOperation, endOperation, leaveRoom, createSplit, getSplit, confirmPayment, getRoomDetail } from '../services/taxiApi';
import { getDepositStatus } from '../services/depositApi';
import { getUsername, getUserId, saveUserId, getAccountInfo } from '../services/apiConfig';
import { getMyProfile } from '../services/myPageApi';

// 이미지 경로 (이미지 파일을 assets/images 폴더에 추가하세요)
// 이미지 파일이 없을 경우를 대비해 try-catch 사용
let kakaoPayLogo = null;
let tossLogo = null;

try {
  kakaoPayLogo = require('../assets/images/kakaopay.png');
} catch (e) {
  console.warn('카카오페이 로고 이미지를 찾을 수 없습니다. assets/images/kakaopay.png 파일을 추가하세요.');
}

try {
  tossLogo = require('../assets/images/toss.png');
} catch (e) {
  console.warn('토스 로고 이미지를 찾을 수 없습니다. assets/images/toss.png 파일을 추가하세요.');
}

const ChatScreen = ({ navigation, route }) => {
  const { roomData: initialRoomData, onLeaveRoom, onAddToParticipatingRooms, isFromCreate } = route.params || {};
  const [roomData, setRoomData] = useState(initialRoomData);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  // 액션 버튼 그리드 표시 여부 상태 (초기값 false - 채팅방 입장 시 숨김)
  const [showActionButtons, setShowActionButtons] = useState(false);
  // 키보드 높이 상태
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  // 키보드 높이 저장 (플러스 메뉴를 위해 유지)
  const savedKeyboardHeight = useRef(300); // 기본값 300
  // 정산 모달 표시 여부
  const [settlementModalVisible, setSettlementModalVisible] = useState(false);
  // 운행 시작 여부
  const [isOperationStarted, setIsOperationStarted] = useState(false);
  // 출발 메시지 표시 여부
  const [isDeparted, setIsDeparted] = useState(false);
  // 송금 완료한 사용자 목록 (사용자 ID 기반)
  const [paidUsers, setPaidUsers] = useState([]);
  // 앱 상태 추적 (외부 앱에서 돌아왔는지 확인)
  const appState = useRef(AppState.currentState);
  const [pendingPayment, setPendingPayment] = useState(null); // 대기 중인 송금 정보
  // TextInput ref
  const textInputRef = useRef(null);
  // 메시지 ref (Polling에서 최신 메시지 참조용)
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  // 입장 메시지 표시 여부 추적 (한 번만 표시)
  const hasShownJoinMessage = useRef(false);
  
  // 키보드 이벤트 리스너
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const height = e.endCoordinates.height;
        setKeyboardHeight(height);
        savedKeyboardHeight.current = height; // 키보드 높이 저장
        // 키보드가 올라오면 플러스 메뉴 닫기
        setShowActionButtons(false);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        // 키보드가 닫혀도 높이는 유지 (플러스 메뉴를 위해)
        // setKeyboardHeight는 유지하되, savedKeyboardHeight는 그대로 유지
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);
  
  // 채팅방 입장 시 입장 메시지 추가 및 이미 수락한 인원 수 초기화 (한 번만)
  useEffect(() => {
    if (!roomData?.room_id || hasShownJoinMessage.current) return;
    
    const addJoinMessage = async () => {
      // 회원가입 시 받은 이름 가져오기
      const userName = await getUsername() || '사용자';
      
      // 입장 시점의 시간을 고정 (매번 새로 생성되지 않도록)
      const joinTime = new Date().toISOString();
      
      const joinMessage = {
        message_id: `join_${Date.now()}`, // 고유 ID
        room_id: roomData.room_id,
        sender_id: null,
        sender_name: '시스템',
        message: `${userName}님이 입장했습니다.`,
        created_at: joinTime, // 고정된 입장 시간
        time: new Date(joinTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        type: 'user_joined',
      };
      
      // 수락 상태는 운행 시작 후 실제 참여자 기반으로 관리됨
      // 입장 시에는 수락 상태 초기화하지 않음
      
      setMessages(prev => {
        // 입장 메시지가 이미 있으면 추가하지 않음
        const hasJoinMessage = prev.some(msg => msg.type === 'user_joined' && msg.message_id === joinMessage.message_id);
        if (hasJoinMessage) return prev;
        
        const updated = [joinMessage, ...prev];
        // 시간순으로 정렬 (입장 메시지는 항상 맨 위에)
        return updated.sort((a, b) => {
          // 입장 메시지는 항상 맨 위에
          if (a.type === 'user_joined' && b.type !== 'user_joined') return -1;
          if (a.type !== 'user_joined' && b.type === 'user_joined') return 1;
          if (a.type === 'user_joined' && b.type === 'user_joined') {
            // 입장 메시지끼리는 시간순
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          }
          // 일반 메시지는 시간순
          const timeA = new Date(a.created_at).getTime();
          const timeB = new Date(b.created_at).getTime();
          return timeA - timeB;
        });
      });
      
      hasShownJoinMessage.current = true;
    };
    
    addJoinMessage();
  }, [roomData?.room_id, roomData?.current_count, isFromCreate]);
  
  // 채팅방 입장 시 메시지 조회 및 Polling 설정
  // 메시지에서 운행 시작 상태 복원 (모든 사용자, 메시지 로드 후)
  // 실제로 운행이 시작된 메시지인지 확인 (메시지 내용이 "운행이 시작되었습니다."인 경우만)
  useEffect(() => {
    if (messages.length === 0) return;
    
    const hasOperationStarted = messages.some(msg => 
      msg.type === 'operation_started' && 
      (msg.message === '운행이 시작되었습니다.' || msg.message?.includes('운행이 시작되었습니다'))
    );
    
    // 운행이 시작되었으면 상태 복원 (아직 시작하지 않았을 때만)
    if (hasOperationStarted && !isOperationStarted) {
      console.log('메시지에서 운행 시작 상태 복원 (모든 사용자)');
      setIsOperationStarted(true);
    }
  }, [messages, isOperationStarted]);

  useEffect(() => {
    if (!roomData?.room_id) return;

    // 초기 메시지 로드
    const loadMessages = async () => {
      try {
        const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();
        const response = await getMessages(roomCode, 0, 20); // 첫 페이지, 20개씩
        
        // 응답 형식 처리 (배열 또는 객체)
        let messageArray = [];
        if (Array.isArray(response)) {
          messageArray = response;
        } else if (response && response.content && Array.isArray(response.content)) {
          messageArray = response.content;
        } else if (response && response.messages && Array.isArray(response.messages)) {
          messageArray = response.messages;
        } else if (response && response.data && Array.isArray(response.data)) {
          messageArray = response.data;
        }
        
        if (messageArray.length > 0) {
          // 현재 사용자 ID 가져오기
          const currentUserId = await getUserId();
          const currentUserIdStr = currentUserId ? String(currentUserId) : null;
          
          // 프로필 이름 가져오기 (본인 메시지용)
          const myProfileName = await getUsername() || null;
          
          const formattedMessages = await Promise.all(messageArray.map(async (msg) => {
            // senderId를 문자열로 변환하여 저장 (일관성 유지)
            const senderId = msg.senderId || msg.sender_id;
            const senderIdStr = senderId !== null && senderId !== undefined ? String(senderId) : null;
            
            // 본인의 메시지인지 확인
            const isMyMessage = currentUserIdStr && senderIdStr && currentUserIdStr === senderIdStr;
            
            // 본인의 메시지인 경우 프로필 이름 사용, 아니면 서버에서 받은 이름 또는 이메일 사용
            let senderName;
            if (isMyMessage && myProfileName) {
              senderName = myProfileName;
            } else {
              senderName = msg.senderName || msg.sender_name || msg.senderEmail || '알 수 없음';
            }
            
            return {
              message_id: msg.id || msg.messageId || msg.message_id || Date.now(),
              room_id: msg.roomCode || msg.roomId || msg.room_id || roomData?.room_id,
              sender_id: senderIdStr,
              sender_name: senderName,
              message: msg.content || msg.message,
              created_at: msg.createdAt || msg.created_at || new Date().toISOString(),
              time: new Date(msg.createdAt || msg.created_at || new Date()).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
              type: msg.type || null, // 메시지 타입 유지
            };
          }));
          // 시간순으로 정렬
          const sortedMessages = formattedMessages.sort((a, b) => {
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();
            return timeA - timeB;
          });
          setMessages(sortedMessages);
        } else {
          // 데모 데이터인 경우 더미 메시지 추가
          const isDemoRoom = roomData?.roomCode && roomData.roomCode.startsWith('100');
          if (isDemoRoom) {
            const demoMessages = [
              {
                message_id: Date.now() - 300000,
                room_id: roomData.room_id,
                sender_id: String(roomData.host_id || 999),
                sender_name: '방장',
                message: '안녕하세요! 택시 합승하실 분 모집합니다.',
                created_at: new Date(Date.now() - 300000).toISOString(),
                time: new Date(Date.now() - 300000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
              },
              {
                message_id: Date.now() - 200000,
                room_id: roomData.room_id,
                sender_id: String((roomData.host_id || 999) + 1),
                sender_name: '참여자1',
                message: '저도 참여하고 싶어요!',
                created_at: new Date(Date.now() - 200000).toISOString(),
                time: new Date(Date.now() - 200000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
              },
            ];
            setMessages(demoMessages);
          }
        }
      } catch (error) {
        console.log('메시지 조회 실패:', error.message);
      }
    };

    loadMessages();

    // 메시지 Polling (3초마다 새 메시지 확인)
    const isDemoRoom = roomData?.roomCode && roomData.roomCode.startsWith('100');
    
    // 데모 방이 아닌 경우에만 Polling 실행
    const messagePollingInterval = isDemoRoom ? null : setInterval(async () => {
      try {
        const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();
        const currentMessages = messagesRef.current;
        const page = 0; // 최신 메시지부터 가져오기
        const size = 50;
        
        const response = await getMessages(roomCode, page, size);
        
        // 응답 형식 처리 (배열 또는 객체)
        let messageArray = [];
        if (Array.isArray(response)) {
          messageArray = response;
        } else if (response && response.content && Array.isArray(response.content)) {
          messageArray = response.content;
        } else if (response && response.messages && Array.isArray(response.messages)) {
          messageArray = response.messages;
        } else if (response && response.data && Array.isArray(response.data)) {
          messageArray = response.data;
        }
        
        if (messageArray.length > 0) {
          // 현재 사용자 ID 가져오기
          const currentUserId = await getUserId();
          const currentUserIdStr = currentUserId ? String(currentUserId) : null;
          
          // 프로필 이름 가져오기 (본인 메시지용)
          const myProfileName = await getUsername() || null;
          
          const formattedMessages = await Promise.all(messageArray.map(async (msg) => {
            // senderId를 문자열로 변환하여 저장 (일관성 유지)
            const senderId = msg.senderId || msg.sender_id;
            const senderIdStr = senderId !== null && senderId !== undefined ? String(senderId) : null;
            
            // 본인의 메시지인지 확인
            const isMyMessage = currentUserIdStr && senderIdStr && currentUserIdStr === senderIdStr;
            
            // 본인의 메시지인 경우 프로필 이름 사용, 아니면 서버에서 받은 이름 또는 이메일 사용
            let senderName;
            if (isMyMessage && myProfileName) {
              senderName = myProfileName;
            } else {
              senderName = msg.senderName || msg.sender_name || msg.senderEmail || '알 수 없음';
            }
            
            return {
              message_id: msg.id || msg.messageId || msg.message_id || Date.now(),
              room_id: msg.roomCode || msg.roomId || msg.room_id || roomData?.room_id,
              sender_id: senderIdStr,
              sender_name: senderName,
              message: msg.content || msg.message,
              created_at: msg.createdAt || msg.created_at || new Date().toISOString(),
              time: new Date(msg.createdAt || msg.created_at || new Date()).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
              type: msg.type || null, // 메시지 타입 유지
            };
          }));
          
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.message_id));
            const uniqueNewMessages = formattedMessages.filter(m => !existingIds.has(m.message_id));
            if (uniqueNewMessages.length > 0) {
              // 운행 시작 요청 메시지가 새로 추가되었는지 확인
              const hasNewOperationStart = uniqueNewMessages.some(msg => msg.type === 'operation_start');
              if (hasNewOperationStart) {
                console.log('Polling: 새로운 운행 시작 요청 메시지 감지, 상태 업데이트');
                setIsOperationRequested(true);
              }
              
              // 운행 시작 메시지가 새로 추가되었는지 확인 (실제 운행 시작 메시지인지 확인)
              const hasNewOperationStarted = uniqueNewMessages.some(msg => 
                msg.type === 'operation_started' && 
                (msg.message === '운행이 시작되었습니다.' || msg.message?.includes('운행이 시작되었습니다'))
              );
              if (hasNewOperationStarted) {
                console.log('Polling: 새로운 운행 시작 메시지 감지, 상태 업데이트');
                setIsOperationStarted(true);
              }
              
              // 시간순으로 정렬
              const allMessages = [...prev, ...uniqueNewMessages].sort((a, b) => {
                const timeA = new Date(a.created_at).getTime();
                const timeB = new Date(b.created_at).getTime();
                return timeA - timeB;
              });
              return allMessages;
            } else {
              // 새 메시지는 없지만, 기존 메시지에서 운행 시작 상태 확인 (메시지가 업데이트되었을 수 있음)
              // 실제 운행 시작 메시지인지 확인
              const hasOperationStarted = formattedMessages.some(msg => 
                msg.type === 'operation_started' && 
                (msg.message === '운행이 시작되었습니다.' || msg.message?.includes('운행이 시작되었습니다'))
              );
              
              if (hasOperationStarted && !isOperationStarted) {
                console.log('Polling: 기존 메시지에서 운행 시작 발견, 상태 업데이트');
                setIsOperationStarted(true);
              }
            }
            return prev;
          });
        }
      } catch (error) {
        console.log('메시지 Polling 실패:', error.message);
      }
    }, 3000); // 3초마다 확인

    return () => {
      if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
      }
    };
  }, [roomData?.room_id, roomData?.roomCode, isFromCreate]);

  // 방 정보 실시간 업데이트 Polling (3초마다)
  useEffect(() => {
    if (!roomData?.roomCode && !roomData?.room_id) return;
    
    const isDemoRoom = roomData?.roomCode && roomData.roomCode.startsWith('100');
    if (isDemoRoom) return; // 데모 방은 Polling 하지 않음
    
    const roomInfoPolling = setInterval(async () => {
      try {
        const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();
        const updatedRoomInfo = await getRoomDetail(roomCode);
        
        // getRoomDetail이 null을 반환하면 업데이트하지 않음
        if (!updatedRoomInfo) {
          return;
        }
        
        // 방 정보 업데이트 (인원수 등)
        setRoomData(prev => ({
          ...prev,
          current_count: updatedRoomInfo.memberCount || updatedRoomInfo.current_count || prev?.current_count,
          max_members: updatedRoomInfo.capacity || updatedRoomInfo.max_members || prev?.max_members,
          status: updatedRoomInfo.status || prev?.status,
        }));
      } catch (error) {
        // 에러 발생 시 조용히 처리 (Polling은 계속 진행)
        // console.log('방 정보 Polling 실패:', error.message);
      }
    }, 3000); // 3초마다 확인
    
    return () => {
      clearInterval(roomInfoPolling);
    };
  }, [roomData?.roomCode, roomData?.room_id]);

  // 송금 완료 처리 (useCallback으로 메모이제이션)
  const handlePaymentComplete = useCallback(async (paymentMethod) => {
    if (!myUserId) return; // myUserId가 없으면 처리하지 않음
    
    // 이미 송금 완료한 사용자인지 확인
    if (paidUsers.includes(myUserId)) {
      return; // 이미 송금 완료했으면 중복 처리 방지
    }

    try {
      const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();
      
      // 송금 완료 체크 API 호출
      const response = await confirmPayment(roomCode);
      
      // 현재 사용자를 송금 완료 목록에 추가
      setPaidUsers(prevPaidUsers => [...prevPaidUsers, myUserId]);
      
      // 정산 메시지 찾기 및 송금 완료 메시지 추가
      setMessages(prevMessages => {
        const settlementMessage = prevMessages.find(msg => msg.type === 'settlement');
        let totalMembers = 0;
        let completedCount = response.paidCount || (paidUsers.length + 1);
        
        if (settlementMessage && settlementMessage.settlementData) {
          totalMembers = settlementMessage.settlementData.memberCount || Object.keys(settlementMessage.settlementData.individualCosts || {}).length;
        }
        
        // 송금 완료 메시지 추가 (완료 인원 수 포함)
        const paymentMessage = {
          message_id: Date.now(),
          room_id: roomData?.room_id,
          sender_id: null,
          sender_name: '시스템',
          message: totalMembers > 0 
            ? `송금이 완료되었습니다. (${completedCount}/${totalMembers})`
            : '송금이 완료되었습니다.',
          created_at: new Date().toISOString(),
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          type: 'payment_complete',
        };
        
        const updated = [...prevMessages, paymentMessage];
        // 시간순으로 정렬
        return updated.sort((a, b) => {
          const timeA = new Date(a.created_at).getTime();
          const timeB = new Date(b.created_at).getTime();
          return timeA - timeB;
        });
      });
      
      // 모든 참여자가 송금 완료했는지 확인
      if (response.allPaid) {
        Alert.alert('알림', '모든 참여자의 송금이 완료되었습니다. 이제 채팅방을 나갈 수 있습니다.');
      }
    } catch (error) {
      // 송금 완료 체크 실패 시 보증금에서 자동 송금 시도
      try {
        const settlementMessage = messages.find(msg => msg.type === 'settlement');
        if (settlementMessage && settlementMessage.settlementData) {
          const amountPerPerson = settlementMessage.settlementData.amountPerPerson;
          if (amountPerPerson && amountPerPerson > 0) {
            // 보증금 상태 확인
            const depositStatus = await getDepositStatus();
            const currentDeposit = depositStatus.deposit_amount || 0;
            
            if (currentDeposit >= amountPerPerson) {
              // 보증금에서 자동 차감 (백엔드 API 필요: POST /me/deposit/deduct 또는 PUT /me/deposit)
              // TODO: 백엔드에 보증금 차감 API 추가 요청 필요
              // 현재는 payDeposit을 사용할 수 없으므로, 백엔드에 API 추가 후 연동 필요
              Alert.alert(
                '보증금 자동 송금',
                `보증금에서 ${amountPerPerson.toLocaleString()}원이 자동으로 송금됩니다.\n(현재 보증금: ${currentDeposit.toLocaleString()}원)`,
                [
                  {
                    text: '확인',
                    onPress: async () => {
                      // TODO: 보증금 차감 API 호출
                      // await deductDeposit(amountPerPerson);
                      
                      // 임시: 송금 완료 처리 (실제로는 백엔드에서 처리)
                      setPaidUsers(prevPaidUsers => [...prevPaidUsers, myUserId]);
                      
                      const paymentMessage = {
                        message_id: Date.now(),
                        room_id: roomData?.room_id,
                        sender_id: null,
                        sender_name: '시스템',
                        message: `보증금에서 ${amountPerPerson.toLocaleString()}원이 자동으로 송금되었습니다.`,
                        created_at: new Date().toISOString(),
                        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                        type: 'payment_complete',
                      };
                      setMessages(prev => {
                        const updated = [...prev, paymentMessage];
                        // 시간순으로 정렬
                        return updated.sort((a, b) => {
                          const timeA = new Date(a.created_at).getTime();
                          const timeB = new Date(b.created_at).getTime();
                          return timeA - timeB;
                        });
                      });
                    }
                  }
                ]
              );
            } else {
              Alert.alert('오류', `보증금이 부족합니다. (필요: ${amountPerPerson.toLocaleString()}원, 현재: ${currentDeposit.toLocaleString()}원)`);
            }
          }
        }
      } catch (depositError) {
        console.error('보증금 자동 송금 에러:', depositError);
        Alert.alert('오류', error.message || '송금 완료 체크에 실패했습니다.');
      }
    }
  }, [myUserId, roomData?.room_id, roomData?.roomCode, paidUsers, messages]);

  // 앱 상태 변경 감지 (외부 앱에서 돌아왔을 때 송금 완료 확인)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      // 앱이 백그라운드에서 포그라운드로 돌아왔을 때
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        pendingPayment
      ) {
        // 외부 앱에서 돌아왔고, 대기 중인 송금이 있으면 송금 완료 처리
        handlePaymentComplete(pendingPayment);
        setPendingPayment(null);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription?.remove();
    };
  }, [pendingPayment, handlePaymentComplete]);
  
  // 현재 사용자가 방장인지 확인
  // isFromCreate가 true이면 방장이 생성한 방
  // 또는 roomData의 leaderId와 현재 사용자 ID를 비교
  // myUserId는 useEffect에서 설정됨
  
  // 방장 판단: isFromCreate가 true이거나, leaderId가 현재 사용자 ID와 일치하는 경우
  // host_id도 확인 (백엔드 응답에 따라 다를 수 있음)
  const isHost = isFromCreate === true || 
    (roomData?.leaderId && myUserId && String(roomData.leaderId) === String(myUserId)) ||
    (roomData?.host_id && myUserId && String(roomData.host_id) === String(myUserId));
  
  // 디버깅용 로그 (개발 중에만 사용)
  useEffect(() => {
    console.log('ChatScreen - 방장 권한 체크:');
    console.log('  isFromCreate:', isFromCreate);
    console.log('  myUserId:', myUserId);
    console.log('  roomData.leaderId:', roomData?.leaderId);
    console.log('  roomData.host_id:', roomData?.host_id);
    console.log('  isHost:', isHost);
    console.log('  leaderId 매칭:', roomData?.leaderId && myUserId && String(roomData.leaderId) === String(myUserId));
    console.log('  host_id 매칭:', roomData?.host_id && myUserId && String(roomData.host_id) === String(myUserId));
  }, [isHost, isFromCreate, roomData?.host_id, roomData?.leaderId, myUserId]);
  
  // 방장을 제외한 참여자 수 계산
  const participantCount = Math.max(0, (roomData?.current_count || 1) - 1);
  
  // 현재 사용자의 고유 ID (AsyncStorage에서 가져오거나 생성)
  const [myUserId, setMyUserId] = useState(null);
  const [myProfileName, setMyProfileName] = useState(null);
  
  // 사용자 ID 초기화 (로그인 시 저장된 실제 사용자 ID 사용)
  useEffect(() => {
    const initUserId = async () => {
      try {
        // 먼저 AsyncStorage에서 사용자 ID 가져오기
        let userId = await getUserId();
        
        // 프로필 이름 가져오기
        const profileName = await getUsername();
        if (profileName) {
          setMyProfileName(profileName);
        }
        
        // AsyncStorage에 사용자 ID가 없으면 프로필 조회를 통해 가져오기
        if (!userId) {
          try {
            const profile = await getMyProfile();
            if (profile && (profile.id || profile.user_id || profile.userId)) {
              userId = String(profile.id || profile.user_id || profile.userId);
              // AsyncStorage에 저장
              await saveUserId(userId);
              console.log('프로필 조회를 통해 사용자 ID 가져옴:', userId);
            }
          } catch (profileError) {
            console.log('프로필 조회 실패 (사용자 ID 가져오기 실패):', profileError.message);
          }
        }
        
        if (userId) {
          const userIdString = String(userId);
          setMyUserId(userIdString); // 문자열로 변환하여 저장
          console.log('사용자 ID 초기화 완료:', userIdString);
        } else {
          // 사용자 ID가 없으면 임시 ID 생성 (테스트용)
          const tempUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          setMyUserId(tempUserId);
          console.log('임시 사용자 ID 생성:', tempUserId);
        }
      } catch (error) {
        console.error('사용자 ID 초기화 에러:', error);
        // AsyncStorage 실패 시 임시 ID 생성
        const tempUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setMyUserId(tempUserId);
      }
    };
    initUserId();
  }, []);
  
  // 방별 수락 상태 저장 키 (useCallback으로 메모이제이션)
  


  // 메시지 전송 (API 명세서에 맞춘 구조)
  const handleSend = async () => {
    if (!message.trim()) return;

    const messageText = message.trim();
    setMessage(''); // 입력 필드 먼저 비우기

    // 회원가입 시 받은 이름 가져오기
    const userName = await getUsername() || '나';
    const isDemoRoom = roomData?.roomCode && roomData.roomCode.startsWith('100');

    // 로컬에 즉시 표시 (낙관적 업데이트)
    const tempMessage = {
      message_id: Date.now(), // 임시 ID
      room_id: roomData?.room_id,
      sender_id: myUserId ? String(myUserId) : null, // 자신의 메시지로 표시하기 위해 myUserId 설정 (문자열로 변환)
      sender_name: userName,
      message: messageText,
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, tempMessage]);

    // 데모 방인 경우 API 호출 없이 로컬에서만 처리
    if (isDemoRoom) {
      return;
    }

    // 백엔드 API 연동
    try {
      const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();
      const response = await sendMessage(roomCode, messageText);
      
      // 본인이 방금 보낸 메시지이므로 무조건 본인의 이름과 ID 사용
      // 서버 응답의 senderId와 관계없이 본인이 보낸 메시지이므로 myUserId 사용
      const serverMessage = {
        message_id: response.id || response.messageId || response.message_id || Date.now(),
        room_id: response.roomCode || response.roomId || response.room_id || roomData?.room_id,
        sender_id: myUserId ? String(myUserId) : null, // 본인이 보낸 메시지이므로 항상 myUserId 사용 (문자열로 변환)
        sender_name: userName, // 본인이 보낸 메시지이므로 무조건 회원가입 시 받은 이름 사용
        message: response.content || response.message || messageText, // Swagger: content 필드 사용
        created_at: response.createdAt || response.created_at || new Date().toISOString(),
        time: new Date(response.createdAt || response.created_at || new Date()).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.message_id !== tempMessage.message_id);
        const updated = [...filtered, serverMessage];
        // 시간순으로 정렬
        return updated.sort((a, b) => {
          const timeA = new Date(a.created_at).getTime();
          const timeB = new Date(b.created_at).getTime();
          return timeA - timeB;
        });
      });
    } catch (error) {
      console.log('메시지 전송 실패:', error.message);
      // 실패 시 임시 메시지 제거
      setMessages(prev => prev.filter(msg => msg.message_id !== tempMessage.message_id));
      Alert.alert('메시지 전송 실패', error.message || '메시지 전송에 실패했습니다.');
    }
  };

  // 계좌 요청 핸들러
  const handleRequestAccount = async () => {
    // 회원가입 시 받은 이름 가져오기
    const userName = await getUsername() || '사용자';
    
    const accountRequestMessage = {
      message_id: Date.now(),
      room_id: roomData?.room_id,
      sender_id: null,
      sender_name: '시스템',
      message: `${userName}님이 계좌를 요청하였습니다.`,
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => {
      const updated = [...prev, accountRequestMessage];
      // 시간순으로 정렬
      return updated.sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return timeA - timeB;
      });
    });
    
    // TODO: 백엔드 API 연동 시 아래 주석 해제
    // try {
    //   await sendMessage(roomData.room_id, `${userName}님이 계좌를 요청하였습니다.`);
    // } catch (error) {
    //   console.log('계좌 요청 메시지 전송 실패:', error);
    // }
  };

  // 방 정보 표시용 (API 명세서에 맞춘 필드)
  const departureText = roomData?.departure || '기흥역';
  const destinationText = roomData?.destination || '이공관';
  const currentCount = roomData?.current_count || 1;
  const maxMembers = roomData?.max_members || 4; // 방 생성 시 설정한 인원수 사용
  const inviteCodeEnabled = roomData?.invite_code_enabled;
  // 초대코드 표시: invite_code가 없으면 roomCode 사용
  const displayInviteCode = inviteCodeEnabled === false 
    ? 'OFF' 
    : (roomData?.invite_code || roomData?.roomCode || 'OFF');
  
  // 운행 시작 핸들러
  const handleStartOperation = async () => {
    if (!isHost) {
      Alert.alert('알림', '방장만 운행을 시작할 수 있습니다.');
      return;
    }
    
    // 테스트용: 인원이 1명만 있어도 운행 시작 가능하도록 (개발 환경에서만)
    const currentCount = roomData?.current_count || 1;
    const maxMembers = roomData?.max_members || 4;
    const isTestMode = currentCount === 1 && maxMembers > 1; // 테스트 모드: 인원이 1명이고 최대 인원이 1명보다 많을 때
    
    // 출발 버튼인 경우 (운행 시작 후)
    if (isOperationStarted && !isDeparted) {
      // 출발 확정
      try {
        const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();
        await endOperation(roomCode);
        setIsDeparted(true);
        
        const departMessage = {
          message_id: Date.now(),
          room_id: roomData?.room_id,
          sender_id: null,
          sender_name: '시스템',
          message: '운행이 출발했습니다.',
          created_at: new Date().toISOString(),
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => {
          const updated = [...prev, departMessage];
          // 시간순으로 정렬
          return updated.sort((a, b) => {
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();
            return timeA - timeB;
          });
        });
      } catch (error) {
        Alert.alert('오류', error.message || '출발 확정에 실패했습니다.');
      }
      return;
    }
    
    // 운행 시작 (동의 없이 바로 시작)
    try {
      const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();
      await startOperation(roomCode);
      setIsOperationStarted(true);
      
      // 운행 시작 메시지를 모든 참여자에게 전송
      const startMessageText = '운행이 시작되었습니다.';
      const response = await sendMessage(roomCode, startMessageText);
      
      // 전송된 메시지를 메시지 목록에 추가
      const startMessage = {
        message_id: response.id || response.messageId || response.message_id || Date.now(),
        room_id: response.roomCode || response.roomId || response.room_id || roomData?.room_id,
        sender_id: null,
        sender_name: '시스템',
        message: response.content || response.message || startMessageText,
        created_at: response.createdAt || response.created_at || new Date().toISOString(),
        time: new Date(response.createdAt || response.created_at || new Date()).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        type: 'operation_started',
      };
      setMessages(prev => {
        const updated = [...prev, startMessage];
        // 시간순으로 정렬
        return updated.sort((a, b) => {
          const timeA = new Date(a.created_at).getTime();
          const timeB = new Date(b.created_at).getTime();
          return timeA - timeB;
        });
      });
    } catch (error) {
      Alert.alert('오류', error.message || '운행 시작에 실패했습니다.');
    }
  };



  // 정산 전송 핸들러 (모든 사용자 가능)
  const handleSettlementSubmit = async (settlementData) => {
    
    // 운행이 시작되지 않았으면 정산 불가
    const hasOperationStarted = messages.some(msg => 
      msg.type === 'operation_started' || 
      (msg.type === 'operation_start' && msg.message === '운행이 시작되었습니다.')
    );
    
    if (!hasOperationStarted) {
      Alert.alert('알림', '운행을 시작해야 작동됩니다.');
      return;
    }
    
    try {
      const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();
      const totalAmount = settlementData.totalCost;
      
      // 최신 방 정보 가져오기 (실시간 인원수 반영) - 정산 생성 전에 가져오기
      const latestRoomInfo = await getRoomDetail(roomCode);
      // getRoomDetail이 null을 반환하면 기존 roomData 사용
      const actualMemberCount = latestRoomInfo 
        ? (latestRoomInfo.memberCount || latestRoomInfo.current_count || roomData?.current_count || 2)
        : (roomData?.current_count || 2);
      
      // 방 정보 업데이트
      setRoomData(prev => ({
        ...prev,
        current_count: actualMemberCount,
        max_members: latestRoomInfo.capacity || latestRoomInfo.max_members || prev?.max_members,
      }));
      
      // 정산 생성 API 호출
      const response = await createSplit(roomCode, totalAmount);
      
      // API 응답에서 정산 정보 가져오기
      const totalCost = response.totalAmount || totalAmount;
      const memberCount = response.memberCount || actualMemberCount; // 최신 인원수 사용
      const amountPerPerson = response.amountPerPerson || Math.floor(totalCost / memberCount);
      const individualCosts = response.individualCosts || settlementData.individualCosts;
      
      // 정산 정보를 일반 채팅 메시지로 전송
      const currentUserId = await getUserId();
      const currentUserIdStr = currentUserId ? String(currentUserId) : null;
      const userName = await getUsername() || myProfileName || '나';
      
      // 정산 메시지 텍스트 생성
      const settlementMessageText = `정산: 총 ${totalCost.toLocaleString()}원, 1인당 ${amountPerPerson.toLocaleString()}원`;
      
      // API를 통해 메시지 전송
      const messageResponse = await sendMessage(roomCode, settlementMessageText);
      
      // 전송된 메시지를 메시지 목록에 추가 (정산 데이터 포함)
      const settlementMessage = {
        message_id: messageResponse.id || messageResponse.messageId || messageResponse.message_id || Date.now(),
        room_id: messageResponse.roomCode || messageResponse.roomId || messageResponse.room_id || roomData?.room_id,
        sender_id: currentUserIdStr,
        sender_name: userName,
        message: messageResponse.content || messageResponse.message || settlementMessageText,
        created_at: messageResponse.createdAt || messageResponse.created_at || new Date().toISOString(),
        time: new Date(messageResponse.createdAt || messageResponse.created_at || new Date()).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        type: 'settlement', // 정산 메시지 타입
        settlementData: {
          splitId: response.splitId,
          totalCost,
          memberCount,
          amountPerPerson,
          individualCosts,
        },
      };
      
      setMessages(prev => {
        console.log('정산 메시지 생성:', settlementMessage);
        const updated = [...prev, settlementMessage];
        // 시간순으로 정렬
        return updated.sort((a, b) => {
          const timeA = new Date(a.created_at).getTime();
          const timeB = new Date(b.created_at).getTime();
          return timeA - timeB;
        });
      });
      // 정산 메시지가 생성되면 송금 완료 목록 초기화
      setPaidUsers([]);
      
      // 디버깅: 정산 메시지 생성 확인
      console.log('정산 메시지 생성 완료, isHost:', isHost);
    } catch (error) {
      Alert.alert('오류', error.message || '정산 생성에 실패했습니다.');
    }
  };

  // 토스 앱 열기
  const openTossApp = async () => {
    try {
      const tossUrl = 'toss://';
      const canOpen = await Linking.canOpenURL(tossUrl);
      
      if (canOpen) {
        setPendingPayment('토스');
        await Linking.openURL(tossUrl);
      } else {
        // 토스 앱이 설치되지 않은 경우
        Alert.alert('알림', '토스 앱이 설치되어 있지 않습니다.');
      }
    } catch (error) {
      console.error('토스 앱 열기 실패:', error);
      Alert.alert('오류', '토스 앱을 열 수 없습니다.');
    }
  };

  // 카카오페이 앱 열기
  const openKakaoPayApp = async () => {
    try {
      // 카카오페이 앱 URL (kakaotalk:// 또는 kakaopay://)
      const kakaoPayUrl = 'kakaotalk://';
      const canOpen = await Linking.canOpenURL(kakaoPayUrl);
      
      if (canOpen) {
        setPendingPayment('카카오페이');
        await Linking.openURL(kakaoPayUrl);
      } else {
        // 카카오톡/카카오페이 앱이 설치되지 않은 경우
        Alert.alert('알림', '카카오톡 또는 카카오페이 앱이 설치되어 있지 않습니다.');
      }
    } catch (error) {
      console.error('카카오페이 앱 열기 실패:', error);
      Alert.alert('오류', '카카오페이 앱을 열 수 없습니다.');
    }
  };


  // 정산 상태 Polling (정산 생성 후 3초마다)
  useEffect(() => {
    const settlementMessage = messages.find(msg => msg.type === 'settlement');
    if (!settlementMessage || !roomData?.room_id || isDeparted === false) return;
    
    const settlementPolling = setInterval(async () => {
      try {
        const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();
        const splitData = await getSplit(roomCode);
        
        // 서버에서 받은 송금 완료 사용자 목록으로 업데이트
        if (splitData.paidMembers && Array.isArray(splitData.paidMembers)) {
          const serverPaidUserIds = splitData.paidMembers.map(id => String(id));
          setPaidUsers(serverPaidUserIds);
        }
        
        // 정산 상태가 COMPLETED로 변경되었는지 확인
        if (splitData.status === 'COMPLETED') {
          Alert.alert('알림', '모든 참여자의 송금이 완료되었습니다. 이제 채팅방을 나갈 수 있습니다.');
        }
      } catch (error) {
        // 정산이 아직 생성되지 않았으면 에러 무시
        if (error.message && !error.message.includes('정산 정보를 찾을 수 없습니다')) {
          console.log('정산 상태 Polling 실패:', error.message);
        }
      }
    }, 3000);
    
    return () => {
      clearInterval(settlementPolling);
    };
  }, [messages, roomData?.room_id, roomData?.roomCode, isDeparted]);

  // 모든 참여자가 송금을 완료했는지 확인
  const checkAllPaymentsComplete = () => {
    // 정산 메시지 찾기
    const settlementMessage = messages.find(msg => msg.type === 'settlement');
    if (!settlementMessage || !settlementMessage.settlementData) {
      return true; // 정산 메시지가 없으면 나가기 허용
    }
    
    const individualCosts = settlementMessage.settlementData.individualCosts || {};
    const allMembers = Object.keys(individualCosts);
    const totalMembers = allMembers.length;
    
    // 송금 완료 메시지 개수 확인 (각 참여자가 송금하면 payment_complete 메시지가 생성됨)
    const paymentCompleteMessages = messages.filter(msg => msg.type === 'payment_complete');
    const completedPayments = paymentCompleteMessages.length;
    
    // 모든 참여자가 송금을 완료했는지 확인
    return completedPayments >= totalMembers;
  };

  // 채팅방 나가기
  const handleLeaveRoom = async () => {
    if (!roomData) {
      navigation.goBack();
      return;
    }

    // 운행 시작 후 나가기 불가 (모든 사용자)
    if (isOperationStarted) {
      Alert.alert('알림', '운행이 시작되어 나갈 수 없습니다.');
      return;
    }

    // 운행 수락 후 정산 완료 후 송금 완료 전까지 나가기 불가
    // (운행 수락한 이용자만 제한, 방장은 제한 없음)
    
    // 운행 시작 후 정산 가능
    if (isOperationStarted) {
      // 정산 메시지 확인
      const settlementMessage = messages.find(msg => msg.type === 'settlement');
      
      if (settlementMessage) {
        // 정산이 생성되었고, 현재 사용자가 송금 완료하지 않았으면 나가기 불가
        const hasUserPaid = paidUsers.includes(myUserId);
        
        if (!hasUserPaid) {
          Alert.alert(
            '알림',
            '송금 완료 후 채팅방을 나갈 수 있습니다.',
            [{ text: '확인', style: 'default' }]
          );
          return;
        }
      }
    }

    const performLeave = async () => {
      try {
        const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();
        await leaveRoom(roomCode); // 백엔드 API 호출
        if (onLeaveRoom) {
          onLeaveRoom(roomData.room_id);
        }
        navigation.goBack();
      } catch (error) {
        Alert.alert('오류', error.message || '방 나가기에 실패했습니다.');
      }
    };

    Alert.alert(
      '채팅방 나가기',
      '채팅방에서 나가시면 참여 목록에서도 삭제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '나가기', style: 'destructive', onPress: performLeave },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <TouchableOpacity 
              style={styles.headerRouteContainer}
              onPress={() => {
                Alert.alert('경로 정보', `${departureText} → ${destinationText}`);
              }}
            >
              <Text 
                style={styles.headerRoute}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {departureText}
              </Text>
              <Text style={styles.headerArrow}>→</Text>
              <Text 
                style={styles.headerRoute}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {destinationText}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerMemberInfo}>
            <MemberCounter currentCount={currentCount} maxMembers={maxMembers} size={16} />
          </View>
          <View style={styles.headerInviteCode}>
            <Text style={styles.inviteCodeTitle}>초대코드</Text>
            <Text style={styles.inviteCodeText}>{displayInviteCode}</Text>
          </View>
        </View>
        
        {/* 운행 시작 버튼 (방장에게만 표시, 운행 시작 전에만) */}
        {isHost && !isOperationStarted && (
          <View style={styles.operationStartHeader}>
            <TouchableOpacity 
              style={styles.operationStartButton}
              onPress={handleStartOperation}
            >
              <Text style={styles.operationStartButtonText}>운행 시작</Text>
            </TouchableOpacity>
          </View>
        )}

      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        enabled={!showActionButtons}
      >
        {/* 채팅 메시지 영역 */}
        <ScrollView 
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.length === 0 && (
            <View style={styles.emptyMessage}>
              <Text style={styles.emptyMessageText}>채팅을 시작해보세요!</Text>
            </View>
          )}
          {[...messages].sort((a, b) => {
            // 입장 메시지는 항상 맨 위에
            if (a.type === 'user_joined' && b.type !== 'user_joined') return -1;
            if (a.type !== 'user_joined' && b.type === 'user_joined') return 1;
            if (a.type === 'user_joined' && b.type === 'user_joined') {
              // 입장 메시지끼리는 시간순
              return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            }
            // 일반 메시지는 시간순
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();
            return timeA - timeB;
          }).map((msg) => {
            // 입장 메시지인 경우 (가운데 정렬)
            if (msg.type === 'user_joined') {
              return (
                <View key={msg.message_id} style={styles.joinMessageBubble}>
                  <Text style={styles.joinMessageText}>{msg.message}</Text>
                </View>
              );
            }
            
            
            // 일반 메시지 (정산 메시지도 일반 메시지처럼 표시)
            // 자신의 메시지인지 확인 (sender_id가 null이거나 시스템 메시지인 경우 제외)
            // 서버에서 받은 senderId와 현재 사용자 ID를 문자열로 변환하여 비교
            const msgSenderId = msg.sender_id !== null && msg.sender_id !== undefined ? String(msg.sender_id) : null;
            const currentUserId = myUserId !== null ? String(myUserId) : null;
            const isMyMessage = msgSenderId !== null && currentUserId !== null && msgSenderId === currentUserId;
            
            // 본인의 메시지인 경우 프로필 이름 사용, 아니면 서버에서 받은 이름 사용
            const displayName = isMyMessage ? (myProfileName || msg.sender_name || '알 수 없음') : (msg.sender_name || '알 수 없음');
            
            // 디버깅용 로그 (개발 중에만 사용) - 문제 발생 시 확인용
            if (__DEV__) {
              if (isMyMessage) {
                console.log('✅ 본인 메시지 확인:', {
                  msgSenderId,
                  currentUserId,
                  message: msg.message?.substring(0, 20),
                });
              } else if (msgSenderId && currentUserId && msgSenderId !== currentUserId) {
                console.log('❌ 다른 사용자 메시지:', {
                  msgSenderId,
                  currentUserId,
                  message: msg.message?.substring(0, 20),
                });
              }
            }
            
            return (
            <View 
              key={msg.message_id} 
              style={[
                styles.messageContainer,
                isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
              ]}
            >
              {/* 사용자 이름 (버블 밖에 표시) */}
              <Text style={[
                styles.messageSender,
                isMyMessage ? styles.myMessageSender : styles.otherMessageSender
              ]}>
                {displayName}
              </Text>
              
              {/* 채팅 내용 버블 */}
              <View style={[
                styles.messageBubble,
                isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
              ]}>
                <Text style={[
                  styles.messageText,
                  isMyMessage ? styles.myMessageText : styles.otherMessageText
                ]}>
                  {msg.message}
                </Text>
              </View>
              {/* 시간 (버블 밖에 표시) */}
              <Text style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.otherMessageTime,
                { alignSelf: isMyMessage ? 'flex-end' : 'flex-start' }
              ]}>
                {msg.time}
              </Text>
            </View>
            );
          })}
        </ScrollView>

            {/* 채팅 입력 영역 */}
        <View style={styles.inputContainer}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  // 액션 그리드 토글
                  const newShowState = !showActionButtons;
                  setShowActionButtons(newShowState);
                  
                  if (newShowState) {
                    // 플러스 버튼을 눌렀을 때 저장된 키보드 높이 사용
                    if (keyboardHeight === 0) {
                      // 키보드가 닫혀있으면 저장된 높이 또는 기본값 사용
                      setKeyboardHeight(savedKeyboardHeight.current || 300);
                    }
                    // 키보드 닫기
                    Keyboard.dismiss();
                  } else {
                    // 플러스 버튼을 닫을 때는 키보드 높이 유지
                    Keyboard.dismiss();
                  }
                }}
              >
            <Text style={styles.closeButtonText}>{showActionButtons ? '✕' : '+'}</Text>
              </TouchableOpacity>
              <TextInput
                ref={textInputRef}
                style={styles.inputField}
                placeholder="채팅을 입력하세요"
                value={message}
                onChangeText={setMessage}
                multiline
                editable={true}
                autoFocus={false}
                keyboardType="default"
                returnKeyType="default"
                blurOnSubmit={false}
                onFocus={() => {
                  // 채팅 입력 필드 포커스 시 액션 그리드 숨기기
                  setShowActionButtons(false);
                }}
                onPressIn={() => {
                  // 터치 시 확실히 포커스 받기
                  setShowActionButtons(false);
                  // 포커스 강제
                  if (textInputRef.current) {
                    textInputRef.current.focus();
                  }
                }}
                onTouchStart={() => {
                  // 터치 시작 시 포커스
                  if (textInputRef.current) {
                    textInputRef.current.focus();
                  }
                }}
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                <Text style={styles.sendButtonText}>전송</Text>
              </TouchableOpacity>
            </View>

            {/* 액션 버튼 그리드 */}
        {showActionButtons && (
            <View style={styles.actionButtonsGrid}>
              <View style={styles.actionButtonsContent}>
            {/* 첫 번째 행: 정산하기 */}
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  setShowActionButtons(false);
                  setSettlementModalVisible(true);
                }}
              >
                <Text style={styles.actionButtonText}>정산하기</Text>
              </TouchableOpacity>
              {/* 첫 번째 행: 계좌 보내기 */}
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={async () => {
                  try {
                    // 내정보에서 등록한 계좌 정보 가져오기
                    const accountInfo = await getAccountInfo();
                    
                    if (!accountInfo) {
                      Alert.alert('알림', '내정보에서 계좌 정보를 먼저 등록해주세요.');
                      return;
                    }
                    
                    const bank = accountInfo.bank || '';
                    const accountNumber = accountInfo.accountNumber || '';
                    
                    if (!bank || !accountNumber) {
                      Alert.alert('알림', '내정보에서 계좌 정보를 먼저 등록해주세요.');
                      return;
                    }
                    
                    // 계좌 정보를 일반 채팅 메시지로 전송
                    const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();
                    const accountMessage = `계좌 정보: ${bank} ${accountNumber}`;
                    
                    // API를 통해 메시지 전송
                    const response = await sendMessage(roomCode, accountMessage);
                    
                    // 현재 사용자 정보 가져오기
                    const currentUserId = await getUserId();
                    const currentUserIdStr = currentUserId ? String(currentUserId) : null;
                    const userName = await getUsername() || myProfileName || '나';
                    
                    // 전송된 메시지를 메시지 목록에 추가
                    const accountSendMessage = {
                      message_id: response.id || response.messageId || response.message_id || Date.now(),
                      room_id: response.roomCode || response.roomId || response.room_id || roomData?.room_id,
                      sender_id: currentUserIdStr,
                      sender_name: userName,
                      message: response.content || response.message || accountMessage,
                      created_at: response.createdAt || response.created_at || new Date().toISOString(),
                      time: new Date(response.createdAt || response.created_at || new Date()).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                    };
                    setMessages(prev => {
                      const updated = [...prev, accountSendMessage];
                      // 시간순으로 정렬
                      return updated.sort((a, b) => {
                        const timeA = new Date(a.created_at).getTime();
                        const timeB = new Date(b.created_at).getTime();
                        return timeA - timeB;
                      });
                    });
                    
                    // 플러스 메뉴 닫기
                    setShowActionButtons(false);
                  } catch (error) {
                    console.error('계좌 정보 전송 에러:', error);
                    Alert.alert('오류', '계좌 정보 전송에 실패했습니다.');
                  }
                }}
              >
                <Text style={styles.actionButtonText}>계좌 보내기</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  setShowActionButtons(false);
                  navigation.navigate('Report', { roomData });
                }}
              >
                <Text style={styles.actionButtonText}>신고</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.actionButton,
                  isOperationStarted ? styles.actionButtonDisabled : null
                ]} 
                onPress={() => {
                  setShowActionButtons(false);
                  handleLeaveRoom();
                }}
                disabled={isOperationStarted}
              >
                <Text style={[
                  styles.actionButtonText,
                  isOperationStarted ? styles.actionButtonTextDisabled : null
                ]}>채팅방 나가기</Text>
            </TouchableOpacity>
              </View>
            </View>
        )}
      </KeyboardAvoidingView>
        
      {/* 정산 모달 (정산하기 버튼에서) */}
      <SettlementModal
        visible={settlementModalVisible}
        onClose={() => setSettlementModalVisible(false)}
        roomData={roomData}
        onSettlementSubmit={handleSettlementSubmit}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  inner: {
    flex: 1,
  },
  // 헤더 스타일
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    height: 64,
  },
  backButton: {
    width: 40,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 20,
    color: '#0D47A1',
  },
  headerInfo: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMemberInfo: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRouteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
    paddingHorizontal: 4,
  },
  headerRoute: {
    fontSize: 11,
    color: '#0D47A1',
    fontWeight: '500',
    includeFontPadding: false,
    textAlignVertical: 'center',
    flexShrink: 1,
    maxWidth: '40%',
  },
  headerArrow: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D47A1',
    marginHorizontal: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 16,
  },
  memberCounterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMembersText: {
    fontSize: 12,
    color: '#0D47A1',
  },
  headerInviteCode: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  inviteCodeTitle: {
    fontSize: 11,
    color: '#0D47A1',
    fontWeight: '600',
    marginBottom: 2,
  },
  inviteCodeText: {
    fontSize: 13,
    color: '#0D47A1',
    fontWeight: '600',
  },
  operationStartHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  operationStartButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  operationStartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // 채팅 메시지 영역
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
  },
  emptyMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyMessageText: {
    fontSize: 16,
    color: '#999',
  },
  // 메시지 컨테이너 (사용자 이름 + 버블)
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  // 자신의 메시지 컨테이너 (오른쪽 정렬)
  myMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  // 다른 사람의 메시지 컨테이너 (왼쪽 정렬)
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  // 채팅 내용 버블 (채팅 내용만 감싸기)
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  // 자신의 메시지 버블 (파란색)
  myMessageBubble: {
    backgroundColor: '#4A90E2',
    borderTopRightRadius: 4,
  },
  // 다른 사람의 메시지 버블 (회색)
  otherMessageBubble: {
    backgroundColor: '#E0E0E0',
    borderTopLeftRadius: 4,
  },
  // 사용자 이름 스타일
  messageSender: {
    fontSize: 12,
    marginBottom: 0,
    fontWeight: '500',
  },
  // 자신의 메시지 사용자 이름
  myMessageSender: {
    color: '#666',
    textAlign: 'right',
  },
  // 다른 사람의 메시지 사용자 이름
  otherMessageSender: {
    color: '#666',
    textAlign: 'left',
  },
  messageText: {
    fontSize: 14,
    marginBottom: 0,
  },
  // 자신의 메시지 텍스트 (흰색)
  myMessageText: {
    color: '#FFFFFF',
  },
  // 다른 사람의 메시지 텍스트 (검정색)
  otherMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  // 자신의 메시지 시간 (연한 흰색)
  myMessageTime: {
    color: '#E0E0E0',
  },
  // 다른 사람의 메시지 시간 (회색)
  otherMessageTime: {
    color: '#666',
  },
  // 입장 메시지 스타일 (가운데 정렬)
  joinMessageBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 5,
  },
  joinMessageText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  // 정산 메시지 스타일
  settlementMessageBubble: {
    backgroundColor: '#E0E0E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  settlementMessageText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  settlementButton: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  settlementButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  settlementActionButtons: {
    flexDirection: 'column',
    marginTop: 8,
  },
  settlementActionButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  paymentLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  settlementActionButtonText: {
    fontSize: 14,
    color: '#333',
  },
  settlementConfirmButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  settlementConfirmButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  paidIndicator: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  paidText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  paymentStatusText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  paymentCompleteButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
  },
  paymentCompleteButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  // 운행 시작 메시지 스타일
  operationStartMessageBubble: {
    backgroundColor: '#E0E0E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  operationStartMessageText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  // 게이지 바 스타일
  progressContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFA726', // 주황색 (진행 중)
    borderRadius: 4,
  },
  progressBarFillComplete: {
    backgroundColor: '#4A90E2', // 파란색 (완료)
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  acceptButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  acceptButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  acceptedIndicator: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  acceptedText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  // 채팅 입력 영역
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#E0E0E0',
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    minHeight: 60,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  showButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  showButtonText: {
    fontSize: 30,
    color: '#333',
    fontWeight: '300',
  },
  hiddenInputContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  inputField: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    fontSize: 14,
    color: '#333',
    maxHeight: 100,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  sendButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  // 액션 버튼 그리드
  actionButtonsGrid: {
    backgroundColor: '#f5f5f5',
    width: '100%',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButtonsContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  actionButton: {
    width: '48%',
    height: 70,
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 10,
  },
  actionButtonEmpty: {
    width: '30%',
    height: 70,
    backgroundColor: 'transparent',
    marginBottom: 10,
  },
  actionButtonImage: {
    width: 36,
    height: 36,
    marginBottom: 6,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.5,
  },
  actionButtonTextDisabled: {
    color: '#999',
  },
});

export default ChatScreen;


