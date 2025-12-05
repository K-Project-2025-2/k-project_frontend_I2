import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

const CustomerSupportScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('입력 오류', '제목과 내용을 모두 입력해주세요.');
      return;
    }

    Alert.alert('접수 완료', '문의가 성공적으로 접수되었습니다.\n빠른 시일 내에 답변 드리겠습니다.', [
      {
        text: '확인',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.headerTitle}>고객센터</Text>

          {/* 고객센터 안내 박스 */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>📞 학생복지위원회 전화번호</Text>
            <Text style={styles.infoText}>0000-0000</Text>
            <Text style={styles.infoSubText}>평일 09:00 ~ 18:00</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>1:1 문의 작성</Text>

          {/* 제목 입력 */}
          <Text style={styles.label}>제목</Text>
          <TextInput
            style={styles.input}
            placeholder="문의 제목을 입력해주세요"
            value={title}
            onChangeText={setTitle}
            maxLength={50}
          />

          {/* 내용 입력 (여러 줄) */}
          <Text style={styles.label}>문의 내용</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="문의하실 내용을 자세히 적어주세요."
            value={content}
            onChangeText={setContent}
            multiline={true}
            numberOfLines={10}
            textAlignVertical="top"
          />

          {/* 제출 버튼 */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>문의하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CustomerSupportScreen;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 15,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 5,
  },
  // 안내 박스 스타일
  infoBox: {
    backgroundColor: '#F5F7FA',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  infoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  infoSubText: {
    fontSize: 13,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 20,
    backgroundColor: '#FFF',
  },

  textArea: {
    height: 150,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 30,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 17,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});