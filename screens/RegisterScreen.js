import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [emailId, setEmailId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const handleVerificationRequest = () => {
    if (!emailId.trim()) {
      Alert.alert('알림', '이메일 아이디를 입력하세요.');
      return;
    }
    Alert.alert('알림', '인증번호가 전송되었습니다.');
  };

  const handleVerification = () => {
    if (!verificationCode.trim()) {
      Alert.alert('알림', '인증번호를 입력하세요.');
      return;
    }
    setIsEmailVerified(true);
    Alert.alert('알림', '이메일 인증이 완료되었습니다.');
  };

  const handleRegister = () => {
    if (!name.trim()) {
      Alert.alert('알림', '이름을 입력하세요.');
      return;
    }
    if (!studentId.trim()) {
      Alert.alert('알림', '학번을 입력하세요.');
      return;
    }
    if (!emailId.trim()) {
      Alert.alert('알림', '이메일 아이디를 입력하세요.');
      return;
    }
    if (!isEmailVerified) {
      Alert.alert('알림', '이메일 인증을 완료하세요.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('알림', '비밀번호를 입력하세요.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('알림', '비밀번호가 일치하지 않습니다.');
      return;
    }

    Alert.alert('성공', '회원가입이 완료되었습니다.', [
      { text: '확인', onPress: () => navigation.navigate('Login') }
    ]);
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={styles.card}>
        <Text style={styles.title}>회원가입</Text>
        
        {/* 이름 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>이름</Text>
          <TextInput
            style={styles.input}
            placeholder="이름"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* 학번 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>학번</Text>
          <TextInput
            style={styles.input}
            placeholder="학번"
            placeholderTextColor="#999"
            value={studentId}
            onChangeText={setStudentId}
          />
        </View>

        {/* 학교 이메일 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>학교 이메일</Text>
          <View style={styles.emailRow}>
            <TextInput
              style={styles.emailInput}
              placeholder="아이디"
              placeholderTextColor="#999"
              value={emailId}
              onChangeText={setEmailId}
            />
            <View style={styles.domainButton}>
              <Text style={styles.domainText}>@kangnam.ac.kr</Text>
            </View>
            <TouchableOpacity style={styles.verifyButton} onPress={handleVerificationRequest}>
              <Text style={styles.verifyButtonText}>인증요청</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.verificationRow}>
            <TextInput
              style={styles.verificationInput}
              placeholder="인증번호"
              placeholderTextColor="#999"
              value={verificationCode}
              onChangeText={setVerificationCode}
            />
            <TouchableOpacity style={styles.verifyConfirmButton} onPress={handleVerification}>
              <Text style={styles.verifyConfirmButtonText}>인증확인</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 비밀번호 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>비밀번호</Text>
          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* 비밀번호 확인 */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.input}
            placeholder="비밀번호 확인"
            placeholderTextColor="#999"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        {/* 회원가입 버튼 */}
        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
          <Text style={styles.registerButtonText}>회원가입</Text>
        </TouchableOpacity>

        {/* 로그인 링크 */}
        <TouchableOpacity onPress={handleLogin}>
          <Text style={styles.loginText}>
            이미 계정이 있으신가요? <Text style={styles.loginLink}>로그인</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  emailInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    marginRight: 8,
  },
  domainButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  domainText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '500',
  },
  verifyButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  verifyButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    marginRight: 8,
  },
  verifyConfirmButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  verifyConfirmButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  loginLink: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
