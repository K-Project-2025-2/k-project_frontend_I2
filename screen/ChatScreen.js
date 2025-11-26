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
import { sendMessage, getMessages, startOperation, acceptOperation, getOperationStatus, endOperation } from '../services/taxiApi';

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
  const { roomData, onLeaveRoom, onAddToParticipatingRooms, isFromCreate } = route.params || {};
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  // 액션 버튼 그리드 표시 여부 상태
  const [showActionButtons, setShowActionButtons] = useState(true);
  // 정산 모달 표시 여부
  const [settlementModalVisible, setSettlementModalVisible] = useState(false);
  // 운행 시작 여부 (방장이 운행시작 버튼을 눌렀는지 여부)
  // 초기값은 false로 설정 (방장이 운행시작을 누르기 전까지는 false)
  const [isOperationStarted, setIsOperationStarted] = useState(false);
  // 운행 수락한 사용자 목록 (방장 제외)
  const [acceptedUsers, setAcceptedUsers] = useState([]);
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
  
  // 채팅방 입장 시 입장 메시지 추가 및 이미 수락한 인원 수 초기화 (한 번만)
  useEffect(() => {
    if (!roomData?.room_id || hasShownJoinMessage.current) return;
    
    
    // TODO: 실제 사용자 이름으로 교체 (백엔드 API에서 가져올 예정)
    const userName = '홍길동';
    
    const joinMessage = {
      message_id: Date.now() - 1, // 다른 메시지보다 먼저 표시되도록
      room_id: roomData.room_id,
      sender_id: null,
      sender_name: '시스템',
      message: `${userName}님이 입장했습니다.`,
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      type: 'user_joined',
    };
    
    // 수락 상태는 운행 시작 후 실제 참여자 기반으로 관리됨
    // 입장 시에는 수락 상태 초기화하지 않음
    
    setMessages(prev => [joinMessage, ...prev]);
    
    hasShownJoinMessage.current = true;
  }, [roomData?.room_id, roomData?.current_count, isFromCreate]);
  
  // 채팅방 입장 시 메시지 조회 및 Polling 설정
  useEffect(() => {
    if (!roomData?.room_id) return;

    // 초기 메시지 로드
    const loadMessages = async () => {
      // 운행 준비중 메시지는 방장이 운행시작 버튼을 눌렀을 때만 표시됨
      // (handleStartOperation에서 처리)
      
      // TODO: 백엔드 API 연동 시 아래 주석 해제
      // try {
      //   const fetchedMessages = await getMessages(roomData.room_id);
      //   const formattedMessages = fetchedMessages.map(msg => ({
      //     ...msg,
      //     time: new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      //   }));
      //   setMessages(formattedMessages);
      // } catch (error) {
      //   console.log('메시지 조회 실패:', error.message);
      // }
    };

    loadMessages();

    // TODO: 백엔드 API 연동 시 아래 Polling 주석 해제
    // const pollingInterval = setInterval(async () => {
    //   try {
    //     const currentMessages = messagesRef.current;
    //     const lastMessageId = currentMessages.length > 0 ? currentMessages[currentMessages.length - 1].message_id : null;
    //     const newMessages = await getMessages(roomData.room_id, lastMessageId);
    //     if (newMessages && newMessages.length > 0) {
    //       const formattedMessages = newMessages.map(msg => ({
    //         ...msg,
    //         time: new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    //       }));
    //       setMessages(prev => {
    //         const existingIds = new Set(prev.map(m => m.message_id));
    //         const uniqueNewMessages = formattedMessages.filter(m => !existingIds.has(m.message_id));
    //         return [...prev, ...uniqueNewMessages];
    //       });
    //     }
    //   } catch (error) {
    //     console.log('메시지 Polling 실패:', error.message);
    //   }
    // }, 3000);
    
    // 백엔드 API 연동 전까지 Polling 없음
    const pollingInterval = null;

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [roomData?.room_id, isFromCreate]);

  // 송금 완료 처리 (useCallback으로 메모이제이션)
  const handlePaymentComplete = useCallback((paymentMethod) => {
    if (!myUserId) return; // myUserId가 없으면 처리하지 않음
    
    // 이미 송금 완료한 사용자인지 확인
    setPaidUsers(prevPaidUsers => {
      if (prevPaidUsers.includes(myUserId)) {
        return prevPaidUsers; // 이미 송금 완료했으면 중복 처리 방지
      }

      // 현재 사용자를 송금 완료 목록에 추가
      const newPaidUsers = [...prevPaidUsers, myUserId];
      
      // 정산 메시지 찾기 및 송금 완료 메시지 추가
      setMessages(prevMessages => {
        const settlementMessage = prevMessages.find(msg => msg.type === 'settlement');
        let totalMembers = 0;
        let completedCount = newPaidUsers.length;
        
        if (settlementMessage && settlementMessage.settlementData) {
          const individualCosts = settlementMessage.settlementData.individualCosts || {};
          totalMembers = Object.keys(individualCosts).length;
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
        
        return [...prevMessages, paymentMessage];
      });
      
      return newPaidUsers;
    });
  }, [myUserId, roomData?.room_id]);

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
  
  // 현재 사용자가 방장인지 확인 (임시로 roomData의 host_id와 비교)
  // 실제로는 로그인한 사용자 ID와 비교해야 함
  const currentUserId = null; // TODO: 실제 사용자 ID로 교체
  // 임시: currentUserId가 null이면 방장이 생성한 방(isFromCreate)인 경우에만 방장으로 인식
  // 그 외의 경우(다른 사람이 생성한 방에 입장)는 참여자로 인식
  const isHost = isFromCreate || (roomData?.host_id === currentUserId && currentUserId !== null);
  
  // 방장을 제외한 참여자 수 계산
  const participantCount = Math.max(0, (roomData?.current_count || 1) - 1);
  
  // 현재 사용자의 고유 ID (AsyncStorage에서 가져오거나 생성)
  const [myUserId, setMyUserId] = useState(null);
  
  // 사용자 ID 초기화 (영구 저장)
  useEffect(() => {
    const initUserId = async () => {
      try {
        let userId = await AsyncStorage.getItem('myUserId');
        if (!userId) {
          userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await AsyncStorage.setItem('myUserId', userId);
        }
        setMyUserId(userId);
      } catch (error) {
        // AsyncStorage 실패 시 임시 ID 생성
        const tempUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setMyUserId(tempUserId);
      }
    };
    initUserId();
  }, []);
  
  // 방별 수락 상태 저장 키 (useCallback으로 메모이제이션)
  const getAcceptedKey = useCallback((roomId) => {
    if (!roomId) return null;
    return `accepted_${roomId}`;
  }, []);
  
  // 방 입장 시 이전 수락 상태 복원 (운행 시작된 상태에서만)
  useEffect(() => {
    if (!roomData?.room_id || !myUserId || !isOperationStarted) return;
    
    const restoreAcceptedState = async () => {
      try {
        const acceptedKey = getAcceptedKey(roomData.room_id);
        if (!acceptedKey) return;
        
        const acceptedUserIds = await AsyncStorage.getItem(acceptedKey);
        if (acceptedUserIds) {
          const parsed = JSON.parse(acceptedUserIds);
          // 현재 사용자가 수락한 경우 acceptedUsers에 추가
          if (Array.isArray(parsed) && parsed.includes(myUserId)) {
            setAcceptedUsers(prev => {
              if (!prev.includes(myUserId)) {
                return [...prev, myUserId];
              }
              return prev;
            });
          }
        }
      } catch (error) {
        console.log('수락 상태 복원 실패:', error);
      }
    };
    
    restoreAcceptedState();
  }, [roomData?.room_id, myUserId, isOperationStarted, getAcceptedKey]);

  // 참여자 수 변경 시 수락 상태 동기화
  // current_count가 변경되면 (사용자가 나갔을 때) 수락 상태도 업데이트
  useEffect(() => {
    if (!isOperationStarted || !roomData?.room_id) return;
    
    const totalMembers = roomData?.max_members || roomData?.current_count || 1;
    const currentAcceptedCount = acceptedUsers.length + 1; // 방장 포함
    
    // 현재 참여자 수보다 수락한 인원이 많으면 조정
    // (사용자가 나갔을 때 해당 사용자의 수락 상태 제거)
    if (currentAcceptedCount > totalMembers) {
      // 참여자 수에 맞게 수락 상태 조정
      // TODO: 백엔드 API 연동 시 서버에서 받은 수락 상태 사용
      // 임시: 참여자 수에 맞게 조정
      const adjustedAcceptedUsers = acceptedUsers.slice(0, Math.max(0, totalMembers - 1));
      setAcceptedUsers(adjustedAcceptedUsers);
    }
  }, [roomData?.current_count, roomData?.max_members, isOperationStarted, roomData?.room_id, acceptedUsers.length]);

  // 현재 사용자가 수락했는지 확인
  const hasCurrentUserAccepted = myUserId ? acceptedUsers.includes(myUserId) : false;

  // 메시지 전송 (API 명세서에 맞춘 구조)
  const handleSend = async () => {
    if (!message.trim()) return;

    const messageText = message.trim();
    setMessage(''); // 입력 필드 먼저 비우기

    // 로컬에 즉시 표시 (낙관적 업데이트)
    const tempMessage = {
      message_id: Date.now(), // 임시 ID
      room_id: roomData?.room_id,
      sender_id: myUserId, // 자신의 메시지로 표시하기 위해 myUserId 설정
      sender_name: '나',
      message: messageText,
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, tempMessage]);

    // TODO: 백엔드 API 연동 시 아래 주석 해제
    // 메시지는 이미 로컬에 추가되었으므로 그대로 유지
    // try {
    //   const response = await sendMessage(roomData.room_id, messageText);
    //   const serverMessage = {
    //     ...response,
    //     time: new Date(response.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    //   };
    //   setMessages(prev => {
    //     const filtered = prev.filter(msg => msg.message_id !== tempMessage.message_id);
    //     return [...filtered, serverMessage];
    //   });
    // } catch (error) {
    //   console.log('메시지 전송 실패:', error.message);
    // }
  };

  // 계좌 요청 핸들러
  const handleRequestAccount = () => {
    // TODO: 실제 사용자 이름으로 교체 (백엔드 API에서 가져올 예정)
    // 현재는 roomData에서 사용자 이름을 가져오거나 임시로 사용
    const userName = roomData?.members?.find(m => m.user_id === myUserId)?.name 
      || roomData?.current_members?.find(m => m.user_id === myUserId)?.name 
      || '홍길동'; // 임시
    
    const accountRequestMessage = {
      message_id: Date.now(),
      room_id: roomData?.room_id,
      sender_id: null,
      sender_name: '시스템',
      message: `${userName}님이 계좌를 요청하였습니다.`,
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, accountRequestMessage]);
    
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
  const displayInviteCode = inviteCodeEnabled === false ? 'OFF' : (roomData?.invite_code || 'OFF');
  
  // 운행 시작 핸들러
  const handleStartOperation = async () => {
    if (!isHost) {
      Alert.alert('알림', '방장만 운행을 시작할 수 있습니다.');
      return;
    }
    
    if (isOperationStarted) {
      // 운행 종료
      setIsOperationStarted(false);
      setAcceptedUsers([]);
      setIsDeparted(false);
      const endMessage = {
        message_id: Date.now(),
        room_id: roomData?.room_id,
        sender_id: null,
        sender_name: '시스템',
        message: '운행이 종료되었습니다.',
        created_at: new Date().toISOString(),
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...messages, endMessage]);
    } else {
      // 운행 시작
      setIsOperationStarted(true);
      // 운행 시작 시 수락 상태 초기화 (현재 참여자 수 기반으로 관리)
      setAcceptedUsers([]);
      setIsDeparted(false);
      
      // AsyncStorage에서 수락 상태 초기화
      try {
        const acceptedKey = getAcceptedKey(roomData?.room_id);
        if (acceptedKey) {
          await AsyncStorage.removeItem(acceptedKey);
        }
      } catch (error) {
        console.log('수락 상태 초기화 실패:', error);
      }
      
      const startMessage = {
        message_id: Date.now(),
        room_id: roomData?.room_id,
        sender_id: null,
        sender_name: '시스템',
        message: '운행 준비중입니다.',
        created_at: new Date().toISOString(),
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        type: 'operation_start', // 운행 시작 메시지 타입
      };
      setMessages([...messages, startMessage]);
      
      // 운행 시작 시 참여중인 채팅방 목록에 추가 (방장이 생성한 방이 아닌 경우만)
      if (onAddToParticipatingRooms && !isFromCreate) {
        onAddToParticipatingRooms(roomData);
      }
    }
  };

  // 출발 수락 핸들러
  const handleAcceptOperation = async () => {
    if (isHost || !myUserId) {
      return; // 방장은 수락할 필요 없음
    }
    
    // 이미 수락한 사용자인지 확인
    if (hasCurrentUserAccepted) {
      return;
    }
    
    // 수락한 사용자 목록에 추가
    const newAcceptedUsers = [...acceptedUsers, myUserId];
    setAcceptedUsers(newAcceptedUsers);
    
    // AsyncStorage에 수락 상태 저장
    try {
      const acceptedKey = getAcceptedKey(roomData?.room_id);
      if (acceptedKey) {
        await AsyncStorage.setItem(acceptedKey, JSON.stringify(newAcceptedUsers));
      }
    } catch (error) {
      console.log('수락 상태 저장 실패:', error);
    }
    
    // 총 인원 수 계산 (max_members 사용)
    const totalMembers = roomData?.max_members || roomData?.current_count || 1;
    // 수락한 인원 수 = 참여자 중 수락한 수 + 방장(자동 수락) = newAcceptedUsers.length + 1
    const acceptedCount = newAcceptedUsers.length + 1;
    
    // 수락 진행 상황 메시지는 제거 (게이지 바로만 표시)
    
    // 모든 인원이 수락했는지 확인
    const isAllAccepted = acceptedCount >= totalMembers;
    
    // 모든 인원이 수락했으면 운행 시작 메시지 표시
    if (isAllAccepted) {
      setIsDeparted(true);
      setTimeout(() => {
        const startMessage = {
          message_id: Date.now() + 1,
          room_id: roomData?.room_id,
          sender_id: null,
          sender_name: '시스템',
          message: '운행이 시작되었습니다.',
          created_at: new Date().toISOString(),
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, startMessage]);
      }, 300);
    }
  };

  // 모든 참여자가 수락했는지 확인하고 운행 시작 메시지 표시
  useEffect(() => {
    if (isOperationStarted && !isDeparted && participantCount > 0) {
      if (acceptedUsers.length >= participantCount) {
        setIsDeparted(true);
        // 수락 진행 상황 메시지는 제거 (게이지 바로만 표시)
        
        // 운행 시작 메시지
        const startMessage = {
          message_id: Date.now() + 1,
          room_id: roomData?.room_id,
          sender_id: null,
          sender_name: '시스템',
          message: '운행이 시작되었습니다.',
          created_at: new Date().toISOString(),
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, startMessage]);
      }
    }
  }, [acceptedUsers.length, participantCount, isOperationStarted, isDeparted, roomData?.room_id, roomData?.current_count]);

  // 정산 전송 핸들러
  const handleSettlementSubmit = (settlementData) => {
    const totalCost = settlementData.totalCost;
    const individualCosts = settlementData.individualCosts;
    
    // 정산 메시지 생성
    const settlementMessage = {
      message_id: Date.now(),
      room_id: roomData?.room_id,
      sender_id: null,
      sender_name: '방장',
      message: `${totalCost}원 결제 완료`,
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      type: 'settlement', // 정산 메시지 타입
      settlementData: {
        totalCost,
        individualCosts,
      },
    };
    
    setMessages([...messages, settlementMessage]);
    // 정산 메시지가 생성되면 송금 완료 목록 초기화
    setPaidUsers([]);
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
  const handleLeaveRoom = () => {
    if (!roomData) {
      navigation.goBack();
      return;
    }

    // 정산 메시지가 있고 모든 참여자가 송금을 완료하지 않았다면 나가기 막기
    const settlementMessage = messages.find(msg => msg.type === 'settlement');
    if (settlementMessage && !checkAllPaymentsComplete()) {
      Alert.alert(
        '알림',
        '모든 참여자의 송금이 완료되어야 채팅방을 나갈 수 있습니다.',
        [{ text: '확인', style: 'default' }]
      );
      return;
    }

    const performLeave = () => {
      if (onLeaveRoom) {
        onLeaveRoom(roomData.room_id);
      }
      navigation.goBack();
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
            <View style={styles.headerRouteContainer}>
              <Text style={styles.headerRoute}>{departureText}</Text>
              <Text style={styles.headerArrow}>→</Text>
              <Text style={styles.headerRoute}>{destinationText}</Text>
            </View>
          </View>
          <View style={styles.headerMemberInfo}>
            <MemberCounter currentCount={currentCount} maxMembers={maxMembers} size={16} />
          </View>
          <View style={styles.headerInviteCode}>
            <Text style={styles.inviteCodeTitle}>초대코드</Text>
            <Text style={styles.inviteCodeText}>{displayInviteCode}</Text>
          </View>
        </View>

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
          {messages.map((msg) => {
            // 입장 메시지인 경우 (가운데 정렬)
            if (msg.type === 'user_joined') {
              return (
                <View key={msg.message_id} style={styles.joinMessageBubble}>
                  <Text style={styles.joinMessageText}>{msg.message}</Text>
                </View>
              );
            }
            
            // 운행 시작 메시지인 경우
            if (msg.type === 'operation_start') {
              // 디버깅: 버튼 표시 조건 확인
              const shouldShowButton = !isHost && !hasCurrentUserAccepted && isOperationStarted;
              
              // 게이지 계산: 수락한 인원 수 / 전체 인원 수
              // 현재 참여자 수(current_count)를 기준으로 계산
              // 사용자가 나가면 current_count가 감소하고, 게이지도 자동으로 반영됨
              const totalMembers = roomData?.current_count || roomData?.max_members || 1;
              // acceptedUsers에는 이미 수락한 참여자들이 포함되어 있음
              // 방장은 자동으로 수락한 것으로 간주하므로 +1
              const acceptedCount = acceptedUsers.length + 1; // 방장 포함
              const progress = Math.min(acceptedCount / totalMembers, 1); // 0 ~ 1 (최대 1로 제한)
              const isAllAccepted = acceptedCount >= totalMembers;
              
              return (
                <View key={msg.message_id} style={styles.operationStartMessageBubble}>
                  <Text style={styles.operationStartMessageText}>{msg.message}</Text>
                  
                  {/* 게이지 바 */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBarBackground}>
                      <View 
                        style={[
                          styles.progressBarFill,
                          { width: `${progress * 100}%` },
                          isAllAccepted && styles.progressBarFillComplete
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {isAllAccepted ? '수락 완료' : `${acceptedCount}/${totalMembers}`}
                    </Text>
                  </View>
                  
                  {shouldShowButton && (
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={handleAcceptOperation}
                    >
                      <Text style={styles.acceptButtonText}>출발 수락하기</Text>
                    </TouchableOpacity>
                  )}
                  {!isHost && hasCurrentUserAccepted && (
                    <View style={styles.acceptedIndicator}>
                      <Text style={styles.acceptedText}>✓ 수락 완료</Text>
                    </View>
                  )}
                  <Text style={styles.messageTime}>{msg.time}</Text>
                </View>
              );
            }
            
            // 정산 메시지인 경우
            if (msg.type === 'settlement') {
              const individualCosts = msg.settlementData?.individualCosts || {};
              const memberNames = Object.keys(individualCosts);
              // 첫 번째 이용자(방장)의 금액만 표시
              const firstMemberCost = memberNames.length > 0 ? individualCosts[memberNames[0]] : '0';
              
              return (
                <View key={msg.message_id} style={styles.settlementMessageBubble}>
                  <Text style={styles.settlementMessageText}>{msg.message}</Text>
                  <View style={styles.settlementButton}>
                    <Text style={styles.settlementButtonText}>
                      {firstMemberCost}원
                    </Text>
                  </View>
                  <View style={styles.settlementActionButtons}>
                    <TouchableOpacity 
                      style={styles.settlementActionButton}
                      onPress={openTossApp}
                    >
                      {tossLogo && (
                        <Image 
                          source={tossLogo} 
                          style={styles.paymentLogo}
                          resizeMode="contain"
                        />
                      )}
                      <Text style={styles.settlementActionButtonText}>토스 송금</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.settlementActionButton}
                      onPress={openKakaoPayApp}
                    >
                      {kakaoPayLogo && (
                        <Image 
                          source={kakaoPayLogo} 
                          style={styles.paymentLogo}
                          resizeMode="contain"
                        />
                      )}
                      <Text style={styles.settlementActionButtonText}>카카오페이 송금</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.settlementActionButton}
                      onPress={() => {
                        // 계좌 요청하기
                        Alert.alert('계좌 요청하기', '계좌 요청 기능을 실행합니다.');
                      }}
                    >
                      <Text style={styles.settlementActionButtonText}>계좌 요청하기</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.messageTime}>{msg.time}</Text>
                </View>
              );
            }
            
            // 일반 메시지
            // 자신의 메시지인지 확인 (sender_id가 null이거나 시스템 메시지인 경우 제외)
            const isMyMessage = msg.sender_id !== null && msg.sender_id === myUserId;
            
            return (
            <View 
              key={msg.message_id} 
              style={[
                styles.messageBubble,
                isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
              ]}
            >
              {!isMyMessage && (
                <Text style={styles.messageSender}>{msg.sender_name || '알 수 없음'}</Text>
              )}
              <Text style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.otherMessageText
              ]}>{msg.message}</Text>
              <Text style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.otherMessageTime
              ]}>{msg.time}</Text>
            </View>
            );
          })}
        </ScrollView>

            {/* 채팅 입력 영역 */}
        <View style={styles.inputContainer}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
              // 키보드 닫기
                  Keyboard.dismiss();
              // 액션 그리드 토글
              setShowActionButtons(!showActionButtons);
                }}
              >
            <Text style={styles.closeButtonText}>{showActionButtons ? '✕' : '+'}</Text>
              </TouchableOpacity>
              <TextInput
            ref={textInputRef}
                style={styles.inputField}
                placeholder="(채팅을 입력하세요)"
                value={message}
                onChangeText={setMessage}
                multiline
            editable={true}
            autoFocus={false}
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
            {/* 첫 번째 행: 토스 송금 | 운행 시작/종료 | 정산 */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={openTossApp}
            >
              {tossLogo && (
                <Image 
                  source={tossLogo} 
                  style={styles.actionButtonImage}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.actionButtonText}>토스 송금</Text>
              </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.actionButton,
                !isHost && styles.actionButtonDisabled,
              ]}
              onPress={handleStartOperation}
              disabled={!isHost}
            >
              <Text style={[
                styles.actionButtonText,
                !isHost && styles.actionButtonTextDisabled,
              ]}>
                {isOperationStarted ? '운행 종료' : '운행 시작'}
              </Text>
              </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setSettlementModalVisible(true)}
            >
              <Text style={styles.actionButtonText}>정산</Text>
              </TouchableOpacity>
            
            {/* 두 번째 행: 카카오페이 송금 | 빈 버튼 | 빈 버튼 */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={openKakaoPayApp}
            >
              {kakaoPayLogo && (
                <Image 
                  source={kakaoPayLogo} 
                  style={styles.actionButtonImage}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.actionButtonText}>카카오페이 송금</Text>
              </TouchableOpacity>
            <View style={styles.actionButtonEmpty} />
            <View style={styles.actionButtonEmpty} />
            
            {/* 세 번째 행: 계좌 요청 | 신고 | 채팅방 나가기 */}
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleRequestAccount}
              >
                <Text style={styles.actionButtonText}>계좌 요청</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('Report', { roomData })}
              >
                <Text style={styles.actionButtonText}>신고</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleLeaveRoom}>
                <Text style={styles.actionButtonText}>채팅방 나가기</Text>
            </TouchableOpacity>
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
  },
  headerRoute: {
    fontSize: 14,
    color: '#0D47A1',
    fontWeight: '500',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  headerArrow: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0D47A1',
    marginHorizontal: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 20,
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
  messageBubble: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    maxWidth: '80%',
  },
  // 자신의 메시지 (오른쪽 정렬, 파란색)
  myMessageBubble: {
    backgroundColor: '#4A90E2',
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
  },
  // 다른 사람의 메시지 (왼쪽 정렬, 회색)
  otherMessageBubble: {
    backgroundColor: '#E0E0E0',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
  },
  messageSender: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 14,
    marginBottom: 4,
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
    alignSelf: 'flex-end',
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
    paddingVertical: 10,
    backgroundColor: '#E0E0E0',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
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
    paddingVertical: 8,
    borderRadius: 6,
    fontSize: 14,
    color: '#333',
    maxHeight: 100,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    maxHeight: 280, // 키보드 높이와 유사하게 고정
  },
  actionButton: {
    width: '30%',
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


