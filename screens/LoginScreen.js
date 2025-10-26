import React, { useState } from 'react';
import {
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  SafeAreaView,
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
    setError('');
    navigation.replace('Main');
  };

  const handleSignup = () => {
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <View style={styles.mainContent}>
        <Image
          source={require('../assets/login_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.formContainer}>
          <View style={styles.inputSection}>
            <Text style={styles.label}>학교 이메일</Text>
            <View style={styles.emailContainer}>
              <TextInput
                style={styles.emailInput}
                placeholderTextColor="#999"
                value={emailId}
                onChangeText={setEmailId}
              />
              <View style={styles.domainContainer}>
                <Text style={styles.domainText}>@kangnam.ac.kr</Text>
              </View>
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={styles.passwordInput}
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>로그인</Text>
          </TouchableOpacity>
        </View>
      </View>


      <TouchableOpacity onPress={handleSignup}>
        <Text style={styles.signupText}>
          계정이 없으신가요? <Text style={styles.signupLink}>회원가입</Text>
        </Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,

    paddingTop: 80,
    paddingBottom: 40,
    // ---
  },
  mainContent: {
    width: '100%',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 50,
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  inputSection: {
    marginBottom: 20,
    width: '100%',
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
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 5,
    paddingVertical: 12,
    fontSize: 16,
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
    width: '100%',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 5,
    paddingVertical: 12,
    fontSize: 16,
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
    width: '100%',
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