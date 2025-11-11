import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MemberCounter from '../components/MemberCounter';
import SettlementModal from '../modal/SettlementModal';

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
  // 운행 시작 여부
  // 참여자로 입장한 경우(isFromCreate=false) 더미 데이터 테스트를 위해 초기값을 true로 설정
  const [isOperationStarted, setIsOperationStarted] = useState(!isFromCreate);
  // 운행 수락한 사용자 목록 (방장 제외)
  const [acceptedUsers, setAcceptedUsers] = useState([]);
  // 출발 메시지 표시 여부
  const [isDeparted, setIsDeparted] = useState(false);
  
  // 참여자로 입장한 경우(isFromCreate=false) 더미 데이터 테스트를 위해 초기 메시지 추가
  useEffect(() => {
    if (!isFromCreate && messages.length === 0) {
      const initialMessage = {
        message_id: Date.now(),
        room_id: roomData?.room_id,
        sender_id: null,
        sender_name: '시스템',
        message: '운행 준비중입니다.',
        created_at: new Date().toISOString(),
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        type: 'operation_start', // 운행 시작 메시지 타입
      };
      setMessages([initialMessage]);
    }
  }, [isFromCreate, roomData?.room_id]);
  
  // 현재 사용자가 방장인지 확인 (임시로 roomData의 host_id와 비교)
  // 실제로는 로그인한 사용자 ID와 비교해야 함
  const currentUserId = null; // TODO: 실제 사용자 ID로 교체
  // 임시: currentUserId가 null이면 방장이 생성한 방(isFromCreate)인 경우에만 방장으로 인식
  // 그 외의 경우(다른 사람이 생성한 방에 입장)는 참여자로 인식
  const isHost = isFromCreate || (roomData?.host_id === currentUserId && currentUserId !== null);
  
  // 방장을 제외한 참여자 수 계산
  const participantCount = Math.max(0, (roomData?.current_count || 1) - 1);
  
  // 현재 사용자의 고유 ID (임시로 생성, 실제로는 로그인한 사용자 ID 사용)
  const [myUserId] = useState(() => {
    // AsyncStorage나 서버에서 가져온 사용자 ID를 사용해야 함
    // 임시로 로컬 스토리지 키 사용
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  });
  
  // 현재 사용자가 수락했는지 확인
  const hasCurrentUserAccepted = acceptedUsers.includes(myUserId);

  // 메시지 전송 (API 명세서에 맞춘 구조)
  const handleSend = async () => {
    if (!message.trim()) return;

    // 실제로는 sendMessage API를 호출해야 함
    // POST /taxi/rooms/{roomId}/messages
    const newMessage = {
      message_id: Date.now(), // API: message_id (number)
      room_id: roomData?.room_id, // API: room_id
      sender_id: null, // API: sender_id (서버에서 받아올 값)
      sender_name: '나', // API: sender_name (서버에서 받아올 값)
      message: message.trim(), // API: message
      created_at: new Date().toISOString(), // API: created_at (ISO 8601)
      // UI 표시용
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, newMessage]);
    setMessage('');
    
    // TODO: 실제 API 호출
    // try {
    //   await sendMessage(roomData.room_id, message.trim());
    // } catch (error) {
    //   alert('메시지 전송 실패');
    // }
  };

  // 방 정보 표시용 (API 명세서에 맞춘 필드)
  const displayDestination = roomData?.departure && roomData?.destination 
    ? `${roomData.departure} → ${roomData.destination}`
    : '기흥역 → 이공관';
  const currentCount = roomData?.current_count || 1;
  const maxMembers = 4; // 항상 4명으로 고정
  const inviteCodeEnabled = roomData?.invite_code_enabled;
  const displayInviteCode = inviteCodeEnabled === false ? 'OFF' : (roomData?.invite_code || 'OFF');
  
  // 운행 시작 핸들러
  const handleStartOperation = () => {
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
      setAcceptedUsers([]);
      setIsDeparted(false);
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
  const handleAcceptOperation = () => {
    if (isHost) {
      return; // 방장은 수락할 필요 없음
    }
    
    // 이미 수락한 사용자인지 확인
    if (hasCurrentUserAccepted) {
      return;
    }
    
    // 수락한 사용자 목록에 추가
    const newAcceptedUsers = [...acceptedUsers, myUserId];
    setAcceptedUsers(newAcceptedUsers);
    
    // 총 인원 수 계산 (방장 포함)
    const totalMembers = roomData?.current_count || 1;
    // 수락한 인원 수 = 참여자 중 수락한 수 + 방장(자동 수락) = newAcceptedUsers.length + 1
    const acceptedCount = newAcceptedUsers.length + 1;
    
    // 수락 진행 상황 메시지 추가 (수락 X/4 형식)
    const acceptMessage = {
      message_id: Date.now(),
      room_id: roomData?.room_id,
      sender_id: null,
      sender_name: '시스템',
      message: `수락 ${acceptedCount}/${totalMembers}`,
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, acceptMessage]);
  };

  // 모든 참여자가 수락했는지 확인하고 운행 시작 메시지 표시
  useEffect(() => {
    if (isOperationStarted && !isDeparted && participantCount > 0) {
      if (acceptedUsers.length >= participantCount) {
        setIsDeparted(true);
        const totalMembers = roomData?.current_count || 1;
        // 모든 참여자가 수락했을 때 최종 수락 메시지
        const finalAcceptMessage = {
          message_id: Date.now(),
          room_id: roomData?.room_id,
          sender_id: null,
          sender_name: '시스템',
          message: `수락 ${totalMembers}/${totalMembers}`,
          created_at: new Date().toISOString(),
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, finalAcceptMessage]);
        
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
  };

  // 채팅방 나가기
  const handleLeaveRoom = () => {
    if (!roomData) {
      navigation.goBack();
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
          <Text style={styles.headerRoute}>{displayDestination}</Text>
            <View style={styles.memberCounterContainer}>
              <MemberCounter currentCount={currentCount} maxMembers={4} size={16} />
            </View>
        </View>
        <View style={styles.headerInviteCode}>
          <Text style={styles.inviteCodeTitle}>초대코드</Text>
          <Text style={styles.inviteCodeText}>{displayInviteCode}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
            // 운행 시작 메시지인 경우
            if (msg.type === 'operation_start') {
              // 디버깅: 버튼 표시 조건 확인
              const shouldShowButton = !isHost && !hasCurrentUserAccepted && isOperationStarted;
              
              return (
                <View key={msg.message_id} style={styles.operationStartMessageBubble}>
                  <Text style={styles.operationStartMessageText}>{msg.message}</Text>
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
                      onPress={() => {
                        // 토스 송금
                        Alert.alert('토스 송금', '토스 송금 기능을 실행합니다.');
                      }}
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
                      onPress={() => {
                        // 카카오페이 송금
                        Alert.alert('카카오페이 송금', '카카오페이 송금 기능을 실행합니다.');
                      }}
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
            return (
            <View key={msg.message_id} style={styles.messageBubble}>
              <Text style={styles.messageSender}>{msg.sender_name || '나'}</Text>
              <Text style={styles.messageText}>{msg.message}</Text>
              <Text style={styles.messageTime}>{msg.time}</Text>
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
            style={styles.inputField}
            placeholder="(채팅을 입력하세요)"
            value={message}
            onChangeText={setMessage}
            multiline
            onFocus={() => {
              // 채팅 입력 필드 포커스 시 액션 그리드 숨기기
              setShowActionButtons(false);
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
            <TouchableOpacity style={styles.actionButton}>
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
            <TouchableOpacity style={styles.actionButton}>
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
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>계좌 요청</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
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
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 20,
    color: '#0D47A1',
  },
  headerInfo: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#4A90E2',
    height: 44,
    justifyContent: 'center',
  },
  headerRoute: {
    fontSize: 14,
    color: '#0D47A1',
    fontWeight: '500',
  },
  memberCounterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  headerMembersText: {
    fontSize: 12,
    color: '#0D47A1',
  },
  headerInviteCode: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
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
    backgroundColor: '#E0E0E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  messageSender: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 10,
    color: '#666',
    alignSelf: 'flex-end',
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
    backgroundColor: '#666',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
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
    width: 24,
    height: 24,
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


