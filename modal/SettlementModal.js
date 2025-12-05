import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';

const SettlementModal = ({ visible, onClose, roomData, onSettlementSubmit, initialSettlementData }) => {
  const [totalCost, setTotalCost] = useState('');
  const [selectedMemberCount, setSelectedMemberCount] = useState(4);
  const [individualCosts, setIndividualCosts] = useState({});
  
  // initialSettlementData가 변경되면 상태 업데이트
  useEffect(() => {
    if (initialSettlementData) {
      setTotalCost(initialSettlementData.totalCost?.toString() || '');
      setIndividualCosts(initialSettlementData.individualCosts || {});
      setSelectedMemberCount(Object.keys(initialSettlementData.individualCosts || {}).length || 4);
    } else {
      // initialSettlementData가 없으면 초기화
      // roomData의 current_count 또는 memberCount를 기본값으로 사용
      const defaultCount = roomData?.memberCount || 
                          roomData?.current_count || 
                          (roomData?.members?.length) || 
                          (roomData?.participants?.length) ||
                          (roomData?.member_names?.length) ||
                          4;
      setTotalCost('');
      setSelectedMemberCount(defaultCount);
      setIndividualCosts({});
    }
  }, [initialSettlementData, visible, roomData]);

  // 이용자 이름 생성 (방장이 첫 번째)
  // roomData에서 실제 참여자 이름 목록을 가져오거나, 없으면 더미 데이터 사용
  const getMemberNames = (count) => {
    // roomData에 members 배열이 있고 각 항목에 name이 있는 경우
    if (roomData?.members && Array.isArray(roomData.members) && roomData.members.length > 0) {
      // members 배열에서 name 추출 (방장이 첫 번째)
      const names = roomData.members.map((member, index) => {
        if (index === 0) {
          // 첫 번째는 방장
          return member.name || member.user_name || '방장';
        }
        return member.name || member.user_name || `이용자${index}`;
      });
      // 선택한 인원 수만큼만 반환
      return names.slice(0, count);
    }
    
    // roomData에 participants 배열이 있는 경우
    if (roomData?.participants && Array.isArray(roomData.participants) && roomData.participants.length > 0) {
      const names = roomData.participants.slice(0, count);
      return names;
    }
    
    // API에서 받아올 것으로 예상되는 구조: roomData.member_names
    if (roomData?.member_names && Array.isArray(roomData.member_names) && roomData.member_names.length > 0) {
      return roomData.member_names.slice(0, count);
    }
    
    // 더미 데이터 (API 연동 전까지 사용)
    const names = ['방장'];
    for (let i = 1; i < count; i++) {
      names.push(`이용자${i}`);
    }
    return names;
  };

  // 비용과 인원수에 따라 개별 요금 자동 계산
  useEffect(() => {
    if (totalCost && selectedMemberCount > 0) {
      const cost = parseFloat(totalCost);
      if (!isNaN(cost) && cost > 0) {
        const dividedCost = Math.floor(cost / selectedMemberCount);
        const remainder = cost % selectedMemberCount;
        
        const newCosts = {};
        const memberNames = getMemberNames(selectedMemberCount);
        
        // 나머지는 방장(첫 번째)에게 추가
        memberNames.forEach((name, index) => {
          newCosts[name] = (dividedCost + (index === 0 ? remainder : 0)).toString();
        });
        
        setIndividualCosts(newCosts);
      }
    } else {
      // 비용이 없으면 개별 요금 초기화
      const memberNames = getMemberNames(selectedMemberCount);
      const newCosts = {};
      memberNames.forEach((name) => {
        newCosts[name] = '';
      });
      setIndividualCosts(newCosts);
    }
  }, [totalCost, selectedMemberCount]);

  // 인원 선택 핸들러 (제거 - 방 인원수로 고정)

  // 초기화
  const handleReset = () => {
    setTotalCost('');
    setSelectedMemberCount(4);
    setIndividualCosts({});
  };

  // 전송하기
  const handleSubmit = () => {
    if (!totalCost || parseFloat(totalCost) <= 0) {
      alert('비용을 입력해주세요.');
      return;
    }
    
    const settlementData = {
      totalCost: parseFloat(totalCost),
      memberCount: selectedMemberCount,
      individualCosts,
    };
    
    // 정산 정보를 채팅방에 전송
    if (onSettlementSubmit) {
      onSettlementSubmit(settlementData);
    }
    
    onClose();
    // 초기화
    handleReset();
  };

  const memberNames = getMemberNames(selectedMemberCount);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* 헤더 */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>택시비 입력</Text>
            <View style={styles.cancelButtonPlaceholder} />
          </View>

          <ScrollView style={styles.modalBody}>
            {/* 비용 섹션 */}
            <View style={styles.section}>
              <View style={styles.rowContainer}>
                <Text style={styles.label}>비용</Text>
                <TextInput
                  style={styles.costInput}
                  value={totalCost}
                  onChangeText={setTotalCost}
                  keyboardType="numeric"
                  placeholder="입력"
                />
                <Text style={styles.unitText}>원</Text>
              </View>
            </View>

            {/* 인원 섹션 - 방 인원수로 고정 */}
            <View style={styles.section}>
              <View style={styles.rowContainer}>
                <Text style={styles.label}>인원</Text>
                <View style={styles.memberCountDisplay}>
                  <Text style={styles.memberCountText}>{selectedMemberCount}</Text>
                </View>
                <Text style={styles.unitText}>명</Text>
              </View>
            </View>

            {/* 1인당 금액 표시 */}
            {totalCost && selectedMemberCount > 0 && (
              <View style={styles.section}>
                <View style={styles.rowContainer}>
                  <Text style={styles.label}>1인당 금액</Text>
                  <View style={styles.perPersonDisplay}>
                    <Text style={styles.perPersonText}>
                      {Math.floor(parseFloat(totalCost) / selectedMemberCount).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.unitText}>원</Text>
                </View>
              </View>
            )}

            {/* 개별 요금 섹션 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>개별 요금</Text>
              {memberNames.map((memberName, index) => (
                <View key={index} style={styles.individualCostRow}>
                  <View style={styles.memberNameButton}>
                    <Text style={styles.memberNameText}>{memberName}</Text>
                  </View>
                  <View style={styles.individualCostDisplay}>
                    <Text style={styles.individualCostText}>
                      {individualCosts[memberName] || '0'}
                    </Text>
                  </View>
                  <Text style={styles.unitText}>원</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* 하단 버튼 */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.footerButton, styles.submitButton]}
              onPress={handleSubmit}
            >
              <Text style={[styles.footerButtonText, styles.submitButtonText]}>
                전송하기
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  label: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    minWidth: 80,
  },
  costInput: {
    width: 200,
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginHorizontal: 10,
  },
  unitText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    minWidth: 25,
  },
  memberCountDisplay: {
    width: 200,
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginLeft: 10,
    marginRight: 10,
    justifyContent: 'center',
  },
  memberCountText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  perPersonDisplay: {
    width: 200,
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginLeft: 10,
    marginRight: 10,
    justifyContent: 'center',
  },
  perPersonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 12,
  },
  individualCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberNameButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    width: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  memberNameText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  individualCostDisplay: {
    width: 200,
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  individualCostText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
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
  submitButton: {
    backgroundColor: '#4A90E2',
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  submitButtonText: {
    color: 'white',
  },
});

export default SettlementModal;

