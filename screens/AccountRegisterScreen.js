import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { saveAccountInfo } from '../services/apiConfig';

const AccountRegisterScreen = ({navigation, route}) => {
  const isEdit = route?.params?.isEdit || false;
  const existingBank = route?.params?.bank || '';
  const existingAccountNumber = route?.params?.accountNumber || '';
  
  // 기존 은행이 목록에 없으면 직접입력으로 처리
  const defaultBanks = ['국민은행', '신한은행', '우리은행', '하나은행', '카카오뱅크', '토스뱅크'];
  const isCustomBank = existingBank && !defaultBanks.includes(existingBank);
  
  const [selectedBank, setSelectedBank] = useState(isCustomBank ? '직접입력' : existingBank);
  const [customBank, setCustomBank] = useState(isCustomBank ? existingBank : '');
  const [accountNumber, setAccountNumber] = useState(existingAccountNumber);

const handleSave = async () => {
  // 직접입력인 경우 customBank 사용, 아니면 selectedBank 사용
  const finalBank = selectedBank === '직접입력' ? customBank : selectedBank;
  
  if (!finalBank || !finalBank.trim() || !accountNumber) {
    Alert.alert('입력 오류', '은행과 계좌번호를 모두 입력해주세요.');
    return;
  }

  // AsyncStorage에 계좌 정보 저장
  await saveAccountInfo(finalBank, accountNumber);

  if (isEdit) {
    Alert.alert('수정 완료', `${finalBank} 계좌(${accountNumber})가 수정되었습니다.`);
  } else {
    Alert.alert('등록 완료', `${finalBank} 계좌(${accountNumber})가 등록되었습니다.`);
  }

  navigation.navigate("Main", {
    screen: "MyPage",
    params: {
    bank: finalBank,
    accountNumber: accountNumber
    }
  });
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isEdit ? '계좌 수정' : '계좌 등록'}</Text>


      <Text style={styles.label}>은행 선택</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedBank}
          onValueChange={(value) => {
            setSelectedBank(value);
            if (value !== '직접입력') {
              setCustomBank(''); // 직접입력이 아니면 커스텀 은행명 초기화
            }
          }}
          style={styles.picker}
        >
          <Picker.Item label="은행을 선택하세요" value="" />
          <Picker.Item label="국민은행" value="국민은행" />
          <Picker.Item label="신한은행" value="신한은행" />
          <Picker.Item label="우리은행" value="우리은행" />
          <Picker.Item label="하나은행" value="하나은행" />
          <Picker.Item label="카카오뱅크" value="카카오뱅크" />
          <Picker.Item label="토스뱅크" value="토스뱅크" />
          <Picker.Item label="직접입력" value="직접입력" />
        </Picker>
      </View>

      {selectedBank === '직접입력' && (
        <>
          <Text style={styles.label}>은행명 입력</Text>
          <TextInput
            style={styles.input}
            placeholder="은행명을 입력하세요"
            value={customBank}
            onChangeText={setCustomBank}
          />
        </>
      )}


      <Text style={styles.label}>계좌번호</Text>
      <TextInput
        style={styles.input}
        placeholder="계좌번호를 입력하세요"
        keyboardType="numeric"
        value={accountNumber}
        onChangeText={setAccountNumber}
      />


      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{isEdit ? '수정하기' : '등록하기'}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AccountRegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 10,
    marginBottom: 15,
    height: 120,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  picker: {
    height: 120,
    marginTop: -40,
    paddingTop: 0,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 17,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
