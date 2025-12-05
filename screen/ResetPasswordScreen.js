import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { sendPasswordResetCode, resetPassword } from '../services/authApi';

const ResetPasswordScreen = ({ navigation }) => {
  const [emailId, setEmailId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  const handleVerificationRequest = async () => {
    if (!emailId.trim()) {
      Alert.alert('알림', '이메일 아이디를 입력하세요.');
      return;
    }

    setVerificationLoading(true);
    try {
      const email = `${emailId}@kangnam.ac.kr`;
      await sendPasswordResetCode(email);
      setIsCodeSent(true);
      Alert.alert('알림', '인증번호가 전송되었습니다.');
    } catch (error) {
      Alert.alert('오류', error.message || '인증번호 발송에 실패했습니다.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleVerificationConfirm = () => {
    if (!verificationCode.trim()) {
      Alert.alert('알림', '인증번호를 입력하세요.');
      return;
    }
    setIsCodeVerified(true);
    Alert.alert('알림', '인증번호가 확인되었습니다. 아래에 새 비밀번호를 입력해주세요.');
  };

  const handleResetPassword = async () => {
    if (!emailId.trim()) {
      Alert.alert('알림', '이메일 아이디를 입력하세요.');
      return;
    }
    if (!verificationCode.trim()) {
      Alert.alert('알림', '인증번호를 입력하세요.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('알림', '새 비밀번호를 입력하세요.');
      return;
    }
    if (password.length < 8 || password.length > 64) {
      Alert.alert('알림', '비밀번호는 8자 이상 64자 이하여야 합니다.');
      return;
    }
    if (!confirmPassword.trim()) {
      Alert.alert('알림', '비밀번호 확인을 입력하세요.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('알림', '비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const email = `${emailId}@kangnam.ac.kr`;
      await resetPassword(email, verificationCode, password);
      Alert.alert('성공', '비밀번호가 재설정되었습니다.', [
        { text: '확인', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      Alert.alert('오류', error.message || '비밀번호 재설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>비밀번호 재설정</Text>
          
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
                autoCapitalize="none"
                editable={!isCodeSent}
              />
              <View style={styles.domainButton}>
                <Text style={styles.domainText}>@kangnam.ac.kr</Text>
              </View>
              <TouchableOpacity 
                style={styles.verifyButton} 
                onPress={handleVerificationRequest}
                disabled={verificationLoading || isCodeSent}
              >
                {verificationLoading ? (
                  <ActivityIndicator size="small" color="#333" />
                ) : (
                  <Text style={styles.verifyButtonText}>인증요청</Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.verificationRow}>
              <TextInput
                style={styles.verificationInput}
                placeholder="인증번호"
                placeholderTextColor="#999"
                value={verificationCode}
                onChangeText={setVerificationCode}
                editable={isCodeSent}
              />
              <TouchableOpacity 
                style={[
                  styles.verifyConfirmButton, 
                  (!isCodeSent || !verificationCode.trim() || isCodeVerified) && styles.verifyConfirmButtonDisabled
                ]} 
                disabled={!isCodeSent || !verificationCode.trim() || isCodeVerified}
                onPress={handleVerificationConfirm}
              >
                {isCodeVerified ? (
                  <Text style={styles.verifyConfirmButtonTextVerified}>✓ 확인됨</Text>
                ) : (
                  <Text style={styles.verifyConfirmButtonText}>인증확인</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* 인증번호 확인 밑에 새 비밀번호 입력 */}
          {isCodeVerified && (
            <>
              {/* 새 비밀번호 */}
              <View style={styles.inputSection}>
                <Text style={styles.label}>새 비밀번호</Text>
                <TextInput
                  style={styles.input}
                  placeholder="새 비밀번호"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {/* 비밀번호 확인 */}
              <View style={styles.inputSection}>
                <Text style={styles.label}>새 비밀번호 확인</Text>
                <TextInput
                  style={styles.input}
                  placeholder="새 비밀번호 확인"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                {password !== confirmPassword && confirmPassword.length > 0 && (
                  <Text style={styles.errorText}>비밀번호가 일치하지 않습니다.</Text>
                )}
              </View>

              {/* 비밀번호 재설정 버튼 */}
              <TouchableOpacity 
                style={[
                  styles.resetButton, 
                  (loading || password !== confirmPassword || !password.trim() || !confirmPassword.trim() || password.length < 8 || password.length > 64) && styles.resetButtonDisabled
                ]} 
                onPress={handleResetPassword}
                disabled={loading || password !== confirmPassword || !password.trim() || !confirmPassword.trim() || password.length < 8 || password.length > 64}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.resetButtonText}>비밀번호 재설정</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* 로그인 링크 */}
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.loginText}>
              로그인 화면으로 돌아가기
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
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
  verifyConfirmButtonTextVerified: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '500',
  },
  resetButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginText: {
    textAlign: 'center',
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '500',
  },
  verifyConfirmButtonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 5,
  },
});

export default ResetPasswordScreen;

