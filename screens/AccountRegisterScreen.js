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

const AccountRegisterScreen = ({navigation, route}) => {
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

const handleSave = () => {
  if (!selectedBank || !accountNumber) {
    Alert.alert('입력 오류', '은행과 계좌번호를 모두 입력해주세요.');
    return;
  }

  Alert.alert('등록 완료', `${selectedBank} 계좌(${accountNumber})가 등록되었습니다.`);

  navigation.navigate("Main", {
    screen: "MyPage",
    params: {
    bank: selectedBank,
    accountNumber: accountNumber
    }
  });
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>계좌 등록</Text>


      <Text style={styles.label}>은행 선택</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedBank}
          onValueChange={(value) => setSelectedBank(value)}
        >
          <Picker.Item label="은행을 선택하세요" value="" />
          <Picker.Item label="국민은행" value="국민은행" />
          <Picker.Item label="신한은행" value="신한은행" />
          <Picker.Item label="우리은행" value="우리은행" />
          <Picker.Item label="하나은행" value="하나은행" />
          <Picker.Item label="카카오뱅크" value="카카오뱅크" />
          <Picker.Item label="토스뱅크" value="토스뱅크" />
        </Picker>
      </View>


      <Text style={styles.label}>계좌번호</Text>
      <TextInput
        style={styles.input}
        placeholder="계좌번호를 입력하세요"
        keyboardType="numeric"
        value={accountNumber}
        onChangeText={setAccountNumber}
      />


      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>등록하기</Text>
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
