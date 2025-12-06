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
import { sendMessage, getMessages, startOperation, endOperation, leaveRoom, getRoomDetail } from '../services/taxiApi';
import { getDepositStatus } from '../services/depositApi';
import { getUsername, getUserId, saveUserId, getAccountInfo } from '../services/apiConfig';
import { getMyProfile } from '../services/myPageApi';

// 이미지 경로 (이미지 파일을 assets/images 폴더에 추가하세요)
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
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const savedKeyboardHeight = useRef(300);
  const [settlementModalVisible, setSettlementModalVisible] = useState(false);
  const [isOperationStarted, setIsOperationStarted] = useState(false);
  const [isDeparted, setIsDeparted] = useState(false);
  const [paidUsers, setPaidUsers] = useState([]);
  const appState = useRef(AppState.currentState);
  const [pendingPayment, setPendingPayment] = useState(null);
  const textInputRef = useRef(null);
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const hasShownJoinMessage = useRef(false);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const height = e.endCoordinates.height;
        setKeyboardHeight(height);
        savedKeyboardHeight.current = height;
        setShowActionButtons(false);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (!roomData?.room_id || hasShownJoinMessage.current) return;

    const addJoinMessage = async () => {
      const userName = await getUsername() || '사용자';
      const joinTime = new Date().toISOString();

      const joinMessage = {
        message_id: `join_${Date.now()}`,
        room_id: roomData.room_id,
        sender_id: null,
        sender_name: '시스템',
        message: `${userName}님이 입장했습니다.`,
        created_at: joinTime,
        time: new Date(joinTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        type: 'user_joined',
      };

      setMessages(prev => {
        const hasJoinMessage = prev.some(msg => msg.type === 'user_joined' && msg.message_id === joinMessage.message_id);
        if (hasJoinMessage) return prev;

        const updated = [joinMessage, ...prev];
        return updated.sort((a, b) => {
          if (a.type === 'user_joined' && b.type !== 'user_joined') return -1;
          if (a.type !== 'user_joined' && b.type === 'user_joined') return 1;
          if (a.type === 'user_joined' && b.type === 'user_joined') {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          }
          const timeA = new Date(a.created_at).getTime();
          const timeB = new Date(b.created_at).getTime();
          return timeA - timeB;
        });
      });
      hasShownJoinMessage.current = true;
    };

    addJoinMessage();
  }, [roomData?.room_id, roomData?.current_count, isFromCreate]);

  useEffect(() => {
    if (messages.length === 0) return;
    if (isHost) return;

    const hasOperationStarted = messages.some(msg =>
      (msg.type === 'operation_started' || msg.message === '운행이 시작되었습니다.' || msg.message?.includes('운행이 시작되었습니다'))
    );

    if (hasOperationStarted && !isOperationStarted) {
      setIsOperationStarted(true);
    }
  }, [messages, isOperationStarted, isHost]);

  useEffect(() => {
    if (!roomData?.room_id) return;

    const loadMessages = async () => {
      try {
        const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();
        const response = await getMessages(roomCode, 0, 20);

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
          const currentUserId = await getUserId();
          const currentUserIdStr = currentUserId ? String(currentUserId) : null;
          const myProfileName = await getUsername() || null;

          const formattedMessages = await Promise.all(messageArray.map(async (msg) => {
            const senderId = msg.senderId || msg.sender_id;
            const senderIdStr = senderId !== null && senderId !== undefined ? String(senderId) : null;
            const isMyMessage = currentUserIdStr && senderIdStr && currentUserIdStr === senderIdStr;

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
              type: msg.type || null,
            };
          }));
          const sortedMessages = formattedMessages.sort((a, b) => {
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();
            return timeA - timeB;
          });
          setMessages(sortedMessages);
        } else {
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

    const isDemoRoom = roomData?.roomCode && roomData.roomCode.startsWith('100');
    const messagePollingInterval = isDemoRoom ? null : setInterval(async () => {
      try {
        const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();
        const page = 0;
        const size = 50;

        const response = await getMessages(roomCode, page, size);

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
          const currentUserId = await getUserId();
          const currentUserIdStr = currentUserId ? String(currentUserId) : null;
          const myProfileName = await getUsername() || null;

          const formattedMessages = await Promise.all(messageArray.map(async (msg) => {
            const senderId = msg.senderId || msg.sender_id;
            const senderIdStr = senderId !== null && senderId !== undefined ? String(senderId) : null;
            const isMyMessage = currentUserIdStr && senderIdStr && currentUserIdStr === senderIdStr;

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
              type: msg.type || null,
            };
          }));

          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.message_id));
            const uniqueNewMessages = formattedMessages.filter(m => !existingIds.has(m.message_id));
            if (uniqueNewMessages.length > 0) {
              const hasNewOperationStarted = uniqueNewMessages.some(msg =>
                (msg.type === 'operation_started' || msg.message === '운행이 시작되었습니다.' || msg.message?.includes('운행이 시작되었습니다'))
              );
              if (hasNewOperationStarted && !isHost) {
                setIsOperationStarted(true);
              }

              const allMessages = [...prev, ...uniqueNewMessages].sort((a, b) => {
                const timeA = new Date(a.created_at).getTime();
                const timeB = new Date(b.created_at).getTime();
                return timeA - timeB;
              });
              return allMessages;
            } else {
              const hasOperationStarted = formattedMessages.some(msg =>
                (msg.type === 'operation_started' || msg.message === '운행이 시작되었습니다.' || msg.message?.includes('운행이 시작되었습니다'))
              );

              if (hasOperationStarted && !isOperationStarted && !isHost) {
                setIsOperationStarted(true);
              }
            }
            return prev;
          });
        }
      } catch (error) {
        console.log('메시지 Polling 실패:', error.message);
      }
    }, 3000);

    return () => {
      if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
      }
    };
  }, [roomData?.room_id, roomData?.roomCode, isFromCreate, isHost, isOperationStarted]);

  useEffect(() => {
    if (!roomData?.roomCode && !roomData?.room_id) return;

    const isDemoRoom = roomData?.roomCode && roomData.roomCode.startsWith('100');
    if (isDemoRoom) return;

    const roomInfoPolling = setInterval(async () => {
      try {
        const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();
        const updatedRoomInfo = await getRoomDetail(roomCode);

        if (updatedRoomInfo && typeof updatedRoomInfo === 'object') {
          setRoomData(prev => ({
            ...prev,
            current_count: updatedRoomInfo.memberCount || updatedRoomInfo.current_count || prev?.current_count,
            max_members: (updatedRoomInfo.capacity !== null && updatedRoomInfo.capacity !== undefined)
              ? updatedRoomInfo.capacity
              : (updatedRoomInfo.max_members || prev?.max_members || 4),
            status: updatedRoomInfo.status || prev?.status,
          }));
        }
      } catch (error) {}
    }, 3000);

    return () => {
      clearInterval(roomInfoPolling);
    };
  }, [roomData?.roomCode, roomData?.room_id]);

  const handlePaymentComplete = useCallback(async (paymentMethod) => {
    if (!myUserId) return;

    if (paidUsers.includes(myUserId)) {
      return;
    }

    try {
      const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();
      setPaidUsers(prevPaidUsers => [...prevPaidUsers, myUserId]);

      setMessages(prevMessages => {
        const settlementMessage = prevMessages.find(msg => msg.type === 'settlement');
        let totalMembers = 0;
        let completedCount = paidUsers.length + 1;

        if (settlementMessage && settlementMessage.settlementData) {
          totalMembers = settlementMessage.settlementData.memberCount || Object.keys(settlementMessage.settlementData.individualCosts || {}).length;
        }

        const paymentMessageText = totalMembers > 0
          ? `송금이 완료되었습니다. (${completedCount}/${totalMembers})`
          : '송금이 완료되었습니다.';

        sendMessage(roomCode, paymentMessageText).then(messageResponse => {
          const paymentMessage = {
            message_id: messageResponse.id || messageResponse.messageId || messageResponse.message_id || Date.now(),
            room_id: messageResponse.roomCode || messageResponse.roomId || messageResponse.room_id || roomData?.room_id,
            sender_id: myUserId ? String(myUserId) : null,
            sender_name: myProfileName || '나',
            message: messageResponse.content || messageResponse.message || paymentMessageText,
            created_at: messageResponse.createdAt || messageResponse.created_at || new Date().toISOString(),
            time: new Date(messageResponse.createdAt || messageResponse.created_at || new Date()).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            type: 'payment_complete',
          };

          setMessages(prev => {
            const updated = [...prev, paymentMessage];
            return updated.sort((a, b) => {
              const timeA = new Date(a.created_at).getTime();
              const timeB = new Date(b.created_at).getTime();
              return timeA - timeB;
            });
          });
        }).catch(error => {
          console.error('송금 완료 메시지 전송 실패:', error);
        });

        const paymentMessage = {
          message_id: Date.now(),
          room_id: roomData?.room_id,
          sender_id: myUserId ? String(myUserId) : null,
          sender_name: myProfileName || '나',
          message: paymentMessageText,
          created_at: new Date().toISOString(),
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          type: 'payment_complete',
        };

        const updated = [...prevMessages, paymentMessage];
        return updated.sort((a, b) => {
          const timeA = new Date(a.created_at).getTime();
          const timeB = new Date(b.created_at).getTime();
          return timeA - timeB;
        });
      });

    } catch (error) {
    }
  }, [myUserId, roomData?.room_id, roomData?.roomCode, paidUsers, messages]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        pendingPayment
      ) {
        handlePaymentComplete(pendingPayment);
        setPendingPayment(null);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription?.remove();
    };
  }, [pendingPayment, handlePaymentComplete]);

  const [myUserId, setMyUserId] = useState(null);
  const [myProfileName, setMyProfileName] = useState(null);

  const isHost = isFromCreate === true ||
    (roomData?.leaderId && myUserId && String(roomData.leaderId) === String(myUserId)) ||
    (roomData?.host_id && myUserId && String(roomData.host_id) === String(myUserId));

  useEffect(() => {
    const initUserId = async () => {
      try {
        let userId = await getUserId();
        const profileName = await getUsername();
        if (profileName) {
          setMyProfileName(profileName);
        }

        if (!userId) {
          try {
            const profile = await getMyProfile();
            if (profile && (profile.id || profile.user_id || profile.userId)) {
              userId = String(profile.id || profile.user_id || profile.userId);
              await saveUserId(userId);
            }
          } catch (profileError) {}
        }

        if (userId) {
          setMyUserId(String(userId));
        } else {
          const tempUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          setMyUserId(tempUserId);
        }
      } catch (error) {
        const tempUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setMyUserId(tempUserId);
      }
    };
    initUserId();
  }, []);

  const handleSend = async () => {
    if (!message.trim()) return;

    const messageText = message.trim();
    setMessage('');

    const userName = await getUsername() || '나';
    const isDemoRoom = roomData?.roomCode && roomData.roomCode.startsWith('100');

    const tempMessage = {
      message_id: Date.now(),
      room_id: roomData?.room_id,
      sender_id: myUserId ? String(myUserId) : null,
      sender_name: userName,
      message: messageText,
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, tempMessage]);

    if (isDemoRoom) return;

    try {
      const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();
      const response = await sendMessage(roomCode, messageText);

      const serverMessage = {
        message_id: response.id || response.messageId || response.message_id || Date.now(),
        room_id: response.roomCode || response.roomId || response.room_id || roomData?.room_id,
        sender_id: myUserId ? String(myUserId) : null,
        sender_name: userName,
        message: response.content || response.message || messageText,
        created_at: response.createdAt || response.created_at || new Date().toISOString(),
        time: new Date(response.createdAt || response.created_at || new Date()).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.message_id !== tempMessage.message_id);
        const updated = [...filtered, serverMessage];
        return updated.sort((a, b) => {
          const timeA = new Date(a.created_at).getTime();
          const timeB = new Date(b.created_at).getTime();
          return timeA - timeB;
        });
      });
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg.message_id !== tempMessage.message_id));
      Alert.alert('메시지 전송 실패', error.message || '메시지 전송에 실패했습니다.');
    }
  };

  const departureText = roomData?.departure || '기흥역';
  const destinationText = roomData?.destination || '이공관';
  const currentCount = roomData?.current_count || 1;
  const maxMembers = roomData?.max_members || 4;
  const inviteCodeEnabled = roomData?.invite_code_enabled;
  const displayInviteCode = inviteCodeEnabled === false
    ? 'OFF'
    : (roomData?.invite_code || roomData?.roomCode || 'OFF');

  const handleStartOperation = async () => {
    if (!isHost) {
      Alert.alert('알림', '방장만 운행을 시작할 수 있습니다.');
      return;
    }

    if (isOperationStarted && !isDeparted) {
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

    try {
      const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();
      await startOperation(roomCode);
      setIsOperationStarted(true);

      const startMessageText = '운행이 시작되었습니다.';
      const response = await sendMessage(roomCode, startMessageText);

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

  const handleSettlementSubmit = async (settlementData) => {
    if (!isOperationStarted) {
      Alert.alert('알림', '운행을 시작해야 정산할 수 있습니다.');
      return;
    }

    try {
      const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();
      const totalAmount = settlementData.totalCost;

      const latestRoomInfo = await getRoomDetail(roomCode);
      const actualMemberCount = latestRoomInfo
        ? (latestRoomInfo.memberCount || latestRoomInfo.current_count || roomData?.current_count || 2)
        : (roomData?.current_count || 2);

      setRoomData(prev => ({
        ...prev,
        current_count: actualMemberCount,
        max_members: (latestRoomInfo && latestRoomInfo.capacity !== null && latestRoomInfo.capacity !== undefined)
          ? latestRoomInfo.capacity
          : (latestRoomInfo?.max_members || prev?.max_members),
      }));

      const totalCost = totalAmount;
      const memberCount = actualMemberCount;
      const amountPerPerson = Math.floor(totalCost / memberCount);
      const individualCosts = settlementData.individualCosts || {};

      const currentUserId = await getUserId();
      const currentUserIdStr = currentUserId ? String(currentUserId) : null;
      const userName = await getUsername() || myProfileName || '나';

      const settlementMessageText = `정산: 총 ${totalCost.toLocaleString()}원, 1인당 ${amountPerPerson.toLocaleString()}원`;

      const messageResponse = await sendMessage(roomCode, settlementMessageText);

      const settlementMessage = {
        message_id: messageResponse.id || messageResponse.messageId || messageResponse.message_id || Date.now(),
        room_id: messageResponse.roomCode || messageResponse.roomId || messageResponse.room_id || roomData?.room_id,
        sender_id: currentUserIdStr,
        sender_name: userName,
        message: messageResponse.content || messageResponse.message || settlementMessageText,
        created_at: messageResponse.createdAt || messageResponse.created_at || new Date().toISOString(),
        time: new Date(messageResponse.createdAt || messageResponse.created_at || new Date()).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        type: 'settlement',
        settlementData: {
          totalCost,
          memberCount,
          amountPerPerson,
          individualCosts,
        },
      };

      setMessages(prev => {
        const updated = [...prev, settlementMessage];
        return updated.sort((a, b) => {
          const timeA = new Date(a.created_at).getTime();
          const timeB = new Date(b.created_at).getTime();
          return timeA - timeB;
        });
      });
      setPaidUsers([]);

    } catch (error) {
      Alert.alert('오류', error.message || '정산 생성에 실패했습니다.');
    }
  };

  useEffect(() => {
    const settlementMessage = messages.find(msg => msg.type === 'settlement');
    if (!settlementMessage || !settlementMessage.settlementData || !roomData?.room_id) return;

    const paymentCompleteMessages = messages.filter(msg =>
      msg.type === 'payment_complete' && msg.sender_id
    );

    const paidUserIds = paymentCompleteMessages
      .map(msg => msg.sender_id)
      .filter(id => id !== null && id !== undefined);

    const uniquePaidUserIds = [...new Set(paidUserIds)];
    setPaidUsers(uniquePaidUserIds);

    const totalMembers = settlementMessage.settlementData.memberCount || 0;
    if (totalMembers > 0 && uniquePaidUserIds.length >= totalMembers) {
      const allPaidMessage = messages.find(msg =>
        msg.type === 'all_payment_complete' ||
        (msg.message && msg.message.includes('모든 참여자의 송금이 완료되었습니다'))
      );

      if (!allPaidMessage) {
        const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();
        const completeMessageText = '모든 참여자의 송금이 완료되었습니다. 이제 채팅방을 나갈 수 있습니다.';

        sendMessage(roomCode, completeMessageText).then(messageResponse => {
          const completeMessage = {
            message_id: messageResponse.id || messageResponse.messageId || messageResponse.message_id || Date.now(),
            room_id: messageResponse.roomCode || messageResponse.roomId || messageResponse.room_id || roomData?.room_id,
            sender_id: null,
            sender_name: '시스템',
            message: messageResponse.content || messageResponse.message || completeMessageText,
            created_at: messageResponse.createdAt || messageResponse.created_at || new Date().toISOString(),
            time: new Date(messageResponse.createdAt || messageResponse.created_at || new Date()).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            type: 'all_payment_complete',
          };

          setMessages(prev => {
            const updated = [...prev, completeMessage];
            return updated.sort((a, b) => {
              const timeA = new Date(a.created_at).getTime();
              const timeB = new Date(b.created_at).getTime();
              return timeA - timeB;
            });
          });
        }).catch(error => {
          console.error('송금 완료 메시지 전송 실패:', error);
        });
      }
    }
  }, [messages, roomData?.room_id, roomData?.roomCode, myProfileName]);

  const handleLeaveRoom = async () => {
    if (!roomData) {
      navigation.goBack();
      return;
    }

    const currentCount = roomData?.memberCount || roomData?.current_count || 1;
    if (isHost && currentCount === 1) {
    } else {
      if (isOperationStarted) {
        Alert.alert('알림', '운행이 시작되어 나갈 수 없습니다.');
        return;
      }
    }

    if (isOperationStarted) {
      const settlementMessage = messages.find(msg => msg.type === 'settlement');

      if (settlementMessage) {
        const hasUserPaid = paidUsers.includes(myUserId);
        if (!hasUserPaid) {
          Alert.alert('알림', '송금 완료 후 채팅방을 나갈 수 있습니다.');
          return;
        }
      }
    }

    const performLeave = async () => {
      try {
        const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();

        if (isHost) {
          try {
            const latestRoomInfo = await getRoomDetail(roomCode);
            const latestMemberCount = latestRoomInfo?.memberCount || latestRoomInfo?.current_count || currentCount;

            if (latestMemberCount === 1) {
              if (onLeaveRoom) {
                onLeaveRoom(roomData.room_id);
              }
              navigation.goBack();
              return;
            }
          } catch (infoError) {
            if (currentCount === 1) {
              if (onLeaveRoom) {
                onLeaveRoom(roomData.room_id);
              }
              navigation.goBack();
              return;
            }
          }
        }

        await leaveRoom(roomCode);
        if (onLeaveRoom) {
          onLeaveRoom(roomData.room_id);
        }
        navigation.goBack();
      } catch (error) {
        if (error.message && error.message.includes('방장은 퇴장할 수 없습니다') && isHost) {
          let shouldLeave = false;
          let latestMemberCount = null;

          try {
            const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();
            const latestRoomInfo = await getRoomDetail(roomCode);

            if (latestRoomInfo) {
              latestMemberCount = latestRoomInfo.memberCount !== undefined ? latestRoomInfo.memberCount
                : (latestRoomInfo.current_count !== undefined ? latestRoomInfo.current_count : null);

              if (latestMemberCount === 1) {
                shouldLeave = true;
              }
            }
          } catch (infoError) {}

          if (!shouldLeave && (currentCount === 1 || roomData?.memberCount === 1)) {
            shouldLeave = true;
          }

          if (shouldLeave) {
            if (onLeaveRoom) {
              onLeaveRoom(roomData.room_id);
            }
            navigation.goBack();
            return;
          }
          Alert.alert('알림', '방에 다른 참여자가 있어 방장은 퇴장할 수 없습니다.');
          return;
        }
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
            if (a.type === 'user_joined' && b.type !== 'user_joined') return -1;
            if (a.type !== 'user_joined' && b.type === 'user_joined') return 1;
            if (a.type === 'user_joined' && b.type === 'user_joined') {
              return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            }
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();
            return timeA - timeB;
          }).map((msg) => {
            if (msg.type === 'user_joined') {
              return (
                <View key={msg.message_id} style={styles.joinMessageBubble}>
                  <Text style={styles.joinMessageText}>{msg.message}</Text>
                </View>
              );
            }

            const msgSenderId = msg.sender_id !== null && msg.sender_id !== undefined ? String(msg.sender_id) : null;
            const currentUserId = myUserId !== null ? String(myUserId) : null;
            const isMyMessage = msgSenderId !== null && currentUserId !== null && msgSenderId === currentUserId;

            const displayName = isMyMessage ? (myProfileName || msg.sender_name || '알 수 없음') : (msg.sender_name || '알 수 없음');

            return (
            <View
              key={msg.message_id}
              style={[
                styles.messageContainer,
                isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
              ]}
            >
              <Text style={[
                styles.messageSender,
                isMyMessage ? styles.myMessageSender : styles.otherMessageSender
              ]}>
                {displayName}
              </Text>

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

        <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  const newShowState = !showActionButtons;
                  setShowActionButtons(newShowState);

                  if (newShowState) {
                    if (keyboardHeight === 0) {
                      setKeyboardHeight(savedKeyboardHeight.current || 300);
                    }
                    Keyboard.dismiss();
                  } else {
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
                  setShowActionButtons(false);
                }}
                onPressIn={() => {
                  setShowActionButtons(false);
                  if (textInputRef.current) {
                    textInputRef.current.focus();
                  }
                }}
                onTouchStart={() => {
                  if (textInputRef.current) {
                    textInputRef.current.focus();
                  }
                }}
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                <Text style={styles.sendButtonText}>전송</Text>
              </TouchableOpacity>
            </View>

        {showActionButtons && (() => {
          // 키보드 높이에 맞춰 액션 버튼 높이 계산 (안드로이드/iOS 차이 고려)
          const currentKeyboardHeight = keyboardHeight > 0 ? keyboardHeight : (savedKeyboardHeight.current || 300);
          // 2x2 그리드이므로: (키보드 높이 - 상하 padding 30 - 버튼 간격 20) / 2
          const buttonHeight = Math.max(60, Math.floor((currentKeyboardHeight - 30 - 20) / 2));
          
          return (
            <View style={[
              styles.actionButtonsGrid,
              { height: currentKeyboardHeight }
            ]}>
              <View style={styles.actionButtonsContent}>
              <TouchableOpacity
                style={[styles.actionButton, { height: buttonHeight }]}
                onPress={() => {
                  setShowActionButtons(false);
                  setSettlementModalVisible(true);
                }}
              >
                <Text style={styles.actionButtonText}>정산하기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { height: buttonHeight }]}
                onPress={async () => {
                  try {
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

                    const roomCode = roomData.roomCode || roomData.invite_code || roomData.room_id?.toString();
                    const accountMessage = `계좌 정보: ${bank} ${accountNumber}`;

                    const response = await sendMessage(roomCode, accountMessage);

                    const currentUserId = await getUserId();
                    const currentUserIdStr = currentUserId ? String(currentUserId) : null;
                    const userName = await getUsername() || myProfileName || '나';

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
                      return updated.sort((a, b) => {
                        const timeA = new Date(a.created_at).getTime();
                        const timeB = new Date(b.created_at).getTime();
                        return timeA - timeB;
                      });
                    });

                    setShowActionButtons(false);
                  } catch (error) {
                    Alert.alert('오류', '계좌 정보 전송에 실패했습니다.');
                  }
                }}
              >
                <Text style={styles.actionButtonText}>계좌 보내기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { height: buttonHeight }]}
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
                  { height: buttonHeight },
                  (isOperationStarted && !(isHost && (roomData?.current_count || 1) === 1)) ? styles.actionButtonDisabled : null
                ]}
                onPress={() => {
                  setShowActionButtons(false);
                  handleLeaveRoom();
                }}
                disabled={isOperationStarted && !(isHost && (roomData?.current_count || 1) === 1)}
              >
                <Text style={[
                  styles.actionButtonText,
                  (isOperationStarted && !(isHost && (roomData?.current_count || 1) === 1)) ? styles.actionButtonTextDisabled : null
                ]}>채팅방 나가기</Text>
            </TouchableOpacity>
              </View>
            </View>
          );
        })()}
      </KeyboardAvoidingView>

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
  messageContainer: {
    marginBottom: 6,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    marginTop: 2,
  },
  myMessageBubble: {
    backgroundColor: '#4A90E2',
    borderTopRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#E0E0E0',
    borderTopLeftRadius: 4,
  },
  messageSender: {
    fontSize: 12,
    marginBottom: 0,
    fontWeight: '500',
  },
  myMessageSender: {
    color: '#666',
    textAlign: 'right',
  },
  otherMessageSender: {
    color: '#666',
    textAlign: 'left',
  },
  messageText: {
    fontSize: 14,
    marginBottom: 0,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  myMessageTime: {
    color: '#E0E0E0',
  },
  otherMessageTime: {
    color: '#666',
  },
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#E0E0E0',
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
  actionButtonsGrid: {
    backgroundColor: '#f5f5f5',
    width: '100%',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    justifyContent: 'center',
  },
  actionButtonsContent: {
    flexDirection: 'row', // 가로 배열로 변경
    flexWrap: 'wrap',     // 줄 바꿈 허용
    justifyContent: 'space-between', // 버튼 사이 간격 균등 배치
    paddingHorizontal: 15,
  },
  actionButton: {
    width: '48%',
    height: 130, // 기본 높이 (키보드 높이에 맞춰 동적으로 조정됨)
    backgroundColor: 'white',
    paddingVertical: 0,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 10,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
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