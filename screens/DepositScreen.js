import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { getDepositStatus, payDeposit, refundDeposit } from '../services/depositApi';

const DepositScreen = ({ navigation }) => {
  const [balance, setBalance] = useState(0);
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [chargeAmount, setChargeAmount] = useState('');

  useEffect(() => {
    fetchWalletData();
  }, []);


  const fetchWalletData = async () => {
    try {
      // 보증금 상태 조회
      const depositData = await getDepositStatus();
      setBalance(depositData.deposit_amount || 0);
      
      // TODO: 충전 내역 API가 있으면 여기서 가져오기
      // 현재는 빈 배열로 설정
      setHistoryList([]);
    } catch (error) {
      console.error("보증금 데이터 로드 실패:", error);
      setBalance(0);
      setHistoryList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const MIN_DEPOSIT = 5000;

  // 보증금 충전 (0원일 때 모달에서 사용)
  const requestCharge = async () => {
    if (!chargeAmount || parseInt(chargeAmount) <= 0) {
      Alert.alert("알림", "올바른 금액을 입력해주세요.");
      return;
    }

    try {
      setIsLoading(true);
      await payDeposit(parseInt(chargeAmount));
      Alert.alert("충전 완료", `${formatMoney(chargeAmount)}원이 충전되었습니다.`);
      setModalVisible(false);
      setChargeAmount('');
      await fetchWalletData();
    } catch (error) {
      console.error("충전 에러:", error);
      Alert.alert("오류", error.message || "서버와 연결할 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 보증금 반환 (5000원 이상일 때)
  const handleRefund = async () => {
    Alert.alert(
      '보증금 반환',
      '보증금을 반환하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await refundDeposit();
              Alert.alert('반환 완료', '반환되었습니다.');
              await fetchWalletData();
            } catch (error) {
              Alert.alert('오류', error.message || '보증금 반환에 실패했습니다.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // 보증금 재충전 (1~4999원일 때)
  const handleRecharge = async () => {
    Alert.alert(
      '보증금 재충전',
      `${MIN_DEPOSIT.toLocaleString()}원을 재충전하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: async () => {
            try {
              setIsLoading(true);
              await payDeposit(MIN_DEPOSIT);
              Alert.alert('재충전 완료', '재충전되었습니다.');
              await fetchWalletData();
            } catch (error) {
              Alert.alert('오류', error.message || '보증금 재충전에 실패했습니다.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatMoney = (value) => {
    if (!value) return "0";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const renderItem = ({ item }) => {
    const isIncome = item.type === 'INCOME';
    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemLeft}>
          <Text style={styles.itemDate}>{item.date}</Text>
          <Text style={styles.itemTitle}>{item.title}</Text>
        </View>
        <View style={styles.itemRight}>
          <Text style={[styles.itemAmount, isIncome ? styles.blueText : styles.redText]}>
            {isIncome ? '+' : ''}{formatMoney(item.amount)}원
          </Text>
          <Text style={styles.itemType}>{isIncome ? '충전/입금' : '사용/출금'}</Text>
        </View>
      </View>
    );
  };

  if (isLoading && !modalVisible) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.headerTitle}>내 지갑</Text>

        {/* 잔액 카드 */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>현재 보증금 잔액</Text>
          <Text style={styles.balanceText}>{formatMoney(balance)}원</Text>
          <View style={styles.cardDivider} />
          <Text style={styles.balanceSubText}>안전하게 보관 중입니다.</Text>
        </View>

        <Text style={styles.sectionTitle}>최근 이용 내역</Text>

        {/* 내역 리스트 */}
        <FlatList
          data={historyList}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>거래 내역이 없습니다.</Text>
            </View>
          }
        />

        {/* 하단 버튼 (보증금 금액에 따라 변경) */}
        {balance >= MIN_DEPOSIT ? (
          // 5000원 이상: 보증금 반환
          <TouchableOpacity
            style={styles.chargeButton}
            onPress={handleRefund}
            disabled={isLoading}
          >
            <Text style={styles.chargeButtonText}>보증금 반환</Text>
          </TouchableOpacity>
        ) : balance >= 1 && balance < MIN_DEPOSIT ? (
          // 1~4999원: 보증금 재충전
          <TouchableOpacity
            style={styles.chargeButton}
            onPress={handleRecharge}
            disabled={isLoading}
          >
            <Text style={styles.chargeButtonText}>보증금 재충전하기</Text>
          </TouchableOpacity>
        ) : (
          // 0원: 보증금 충전 (모달 열기)
          <TouchableOpacity
            style={styles.chargeButton}
            onPress={() => setModalVisible(true)}
            disabled={isLoading}
          >
            <Text style={styles.chargeButtonText}>+ 보증금 충전하기</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ★ 충전 팝업 (Modal) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalBackground}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>보증금 충전</Text>
            <Text style={styles.modalDesc}>충전할 금액을 입력해주세요.</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="예: 50000"
              keyboardType="numeric"
              value={chargeAmount}
              onChangeText={setChargeAmount}
              autoFocus={true}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={requestCharge}
              >
                <Text style={styles.confirmButtonText}>충전하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
};

export default DepositScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { flex: 1, padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 10, color: '#333' },

  // 잔액 카드
  balanceCard: {
    backgroundColor: '#007AFF', borderRadius: 20, padding: 25, marginBottom: 25,
    shadowColor: "#007AFF", shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 10,
  },
  balanceLabel: { color: '#D6EAFF', fontSize: 14, marginBottom: 8 },
  balanceText: { color: '#FFF', fontSize: 32, fontWeight: 'bold', marginBottom: 15 },
  cardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: 12 },
  balanceSubText: { color: '#D6EAFF', fontSize: 12 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },

  // 리스트 아이템
  itemContainer: {
    backgroundColor: '#FFF', borderRadius: 15, padding: 18, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#EFF2F5',
  },
  itemLeft: { flexDirection: 'column' },
  itemDate: { fontSize: 12, color: '#999', marginBottom: 4 },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  itemRight: { alignItems: 'flex-end' },
  itemAmount: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  blueText: { color: '#007AFF' },
  redText: { color: '#FF3B30' },
  itemType: { fontSize: 11, color: '#AAA' },
  emptyBox: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#999', fontSize: 15 },


  chargeButton: {
    backgroundColor: '#1E293B',
    paddingVertical: 18,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  chargeButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // ★ 팝업(Modal) 스타일
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 30,
    paddingVertical: 10,
    fontWeight: 'bold',
  },
  modalButtonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    marginRight: 10,
    backgroundColor: '#F1F3F5',
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    padding: 15,
    marginLeft: 10,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: { color: '#555', fontWeight: 'bold' },
  confirmButtonText: { color: '#FFF', fontWeight: 'bold' },
});