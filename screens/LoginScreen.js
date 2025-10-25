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

const LoginScreen = ({ navigation }) => {
  const [emailId, setEmailId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!emailId.trim()) {
      setError('학교 이메일 앞부분을 입력하세요.');
      return;
    }
    if (!password.trim()) {
      setError('비밀번호를 입력하세요.');
      return;
    }

    // 로그인 성공 시 메인 화면으로 이동
    navigation.replace('Main');
  };

  const handleSignup = () => {
    navigation.navigate('Register');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={styles.card}>
        <Text style={styles.title}>로그인</Text>
        
        {/* 학교 이메일 섹션 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>학교 이메일</Text>
          <View style={styles.emailContainer}>
            <TextInput
              style={styles.emailInput}
              placeholder="아이디"
              placeholderTextColor="#999"
              value={emailId}
              onChangeText={setEmailId}
            />
            <View style={styles.domainContainer}>
              <Text style={styles.domainText}>@kangnam.ac.kr</Text>
            </View>
          </View>
        </View>

        {/* 비밀번호 섹션 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>비밀번호</Text>
          <TextInput
            style={styles.passwordInput}
            placeholder="비밀번호"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* 에러 메시지 */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* 로그인 버튼 */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>로그인</Text>
        </TouchableOpacity>

        {/* 회원가입 링크 */}
        <TouchableOpacity onPress={handleSignup}>
          <Text style={styles.signupText}>
            계정이 없으신가요? <Text style={styles.signupLink}>회원가입</Text>
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
    color: '#333',
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
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  domainContainer: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  domainText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginBottom: 15,
  },
  loginButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  signupLink: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
