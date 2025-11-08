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
  Keyboard,
  Image,
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
  // 입력 칸과 버튼 표시 여부 상태
  const [showInputAndButtons, setShowInputAndButtons] = useState(true);
  // 키보드 높이 상태
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  // 정산 모달 표시 여부
  const [settlementModalVisible, setSettlementModalVisible] = useState(false);
  // 운행 시작 여부
  const [isOperationStarted, setIsOperationStarted] = useState(false);
  
  // 현재 사용자가 방장인지 확인 (임시로 roomData의 host_id와 비교)
  // 실제로는 로그인한 사용자 ID와 비교해야 함
  const currentUserId = null; // TODO: 실제 사용자 ID로 교체
  const isHost = roomData?.host_id === currentUserId || currentUserId === null; // 임시로 true

  // 키보드 이벤트 리스너
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

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
      const startMessage = {
        message_id: Date.now(),
        room_id: roomData?.room_id,
        sender_id: null,
        sender_name: '시스템',
        message: '운행이 시작되었습니다.',
        created_at: new Date().toISOString(),
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...messages, startMessage]);
      
      // 운행 시작 시 참여중인 채팅방 목록에 추가 (방장이 생성한 방이 아닌 경우만)
      if (onAddToParticipatingRooms && !isFromCreate) {
        onAddToParticipatingRooms(roomData);
      }
    }
  };

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
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
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

        {/* 채팅 메시지 영역 */}
        <ScrollView style={styles.messagesContainer}>
          {messages.length === 0 && (
            <View style={styles.emptyMessage}>
              <Text style={styles.emptyMessageText}>채팅을 시작해보세요!</Text>
            </View>
          )}
          {messages.map((msg) => {
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
                        // 토스 송금하기
                        Alert.alert('토스 송금하기', '토스 송금 기능을 실행합니다.');
                      }}
                    >
                      {tossLogo && (
                        <Image 
                          source={tossLogo} 
                          style={styles.paymentLogo}
                          resizeMode="contain"
                        />
                      )}
                      <Text style={styles.settlementActionButtonText}>토스 송금하기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.settlementActionButton}
                      onPress={() => {
                        // 카카오페이 송금하기
                        Alert.alert('카카오페이 송금하기', '카카오페이 송금 기능을 실행합니다.');
                      }}
                    >
                      {kakaoPayLogo && (
                        <Image 
                          source={kakaoPayLogo} 
                          style={styles.paymentLogo}
                          resizeMode="contain"
                        />
                      )}
                      <Text style={styles.settlementActionButtonText}>카카오페이 송금하기</Text>
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

        {/* 채팅 입력 영역 및 액션 버튼 */}
        {showInputAndButtons ? (
          <>
            {/* 채팅 입력 영역 */}
            <View style={[
              styles.inputContainer,
              keyboardHeight > 0 && { marginBottom: Platform.OS === 'android' ? keyboardHeight - (Platform.OS === 'android' ? 0 : 0) : 0 }
            ]}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowInputAndButtons(false);
                  Keyboard.dismiss();
                }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.inputField}
                placeholder="(채팅을 입력하세요)"
                value={message}
                onChangeText={setMessage}
                multiline
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                <Text style={styles.sendButtonText}>전송</Text>
              </TouchableOpacity>
            </View>

            {/* 액션 버튼 그리드 */}
            <View style={styles.actionButtonsGrid}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>토스 송금하기</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setSettlementModalVisible(true)}
              >
                <Text style={styles.actionButtonText}>정산하기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>카카오페이 송금하기</Text>
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
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>계좌 요청하기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>신고하기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleLeaveRoom}>
                <Text style={styles.actionButtonText}>채팅방 나가기</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* 숨김 상태일 때 + 버튼만 표시 */
          <View style={styles.hiddenInputContainer}>
            <TouchableOpacity 
              style={styles.showButton}
              onPress={() => {
                setShowInputAndButtons(true);
                Keyboard.dismiss();
              }}
            >
              <Text style={styles.showButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* 정산 모달 (정산하기 버튼에서) */}
        <SettlementModal
          visible={settlementModalVisible}
          onClose={() => setSettlementModalVisible(false)}
          roomData={roomData}
          onSettlementSubmit={handleSettlementSubmit}
        />
      </KeyboardAvoidingView>
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
    gap: 10,
  },
  actionButton: {
    width: '30%',
    backgroundColor: 'white',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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


