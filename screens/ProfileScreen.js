import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { getMyProfile, updateMyProfile } from '../services/myPageApi';
import { getUsername, saveUsername } from '../services/apiConfig';

const ProfileScreen = ({ route, navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phone, setPhone] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 프로필 정보 불러오기
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // 먼저 AsyncStorage에서 회원가입 시 저장한 이름 가져오기
      const savedName = await getUsername();
      if (savedName) {
        setName(savedName);
      }
      
      // 서버에서 프로필 정보 가져오기
      try {
        const data = await getMyProfile();
        if (data.name) {
          setName(data.name);
        }
        setEmail(data.email || '');
        setStudentId(data.studentId || '');
        setPhone(data.phone || '');
      } catch (apiError) {
        console.error('프로필 조회 에러:', apiError);
        // API 에러가 발생해도 AsyncStorage의 이름으로 계속 진행
      }
    } catch (error) {
      console.error('프로필 불러오기 에러:', error);
      Alert.alert('오류', '프로필 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      // 서버에 프로필 업데이트
      await updateMyProfile(name, phone, studentId);
      // AsyncStorage에도 이름 저장 (마이페이지에서 사용)
      await saveUsername(name);
      Alert.alert('변경 완료', '프로필이 성공적으로 변경되었습니다.');
      setEditing(false);
    } catch (error) {
      Alert.alert('오류', error.message || '프로필 변경에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    navigation.replace("Login");
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>프로필</Text>

      <View style={styles.section}>
        <Text style={styles.label}>이름</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="이름을 입력하세요"
          />
        ) : (
          <Text style={styles.value}>{name || '이름 없음'}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>학교 이메일</Text>
        <Text style={styles.value}>{email || '이메일 정보 없음'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>학번</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={studentId}
            onChangeText={setStudentId}
            placeholder="학번을 입력하세요"
          />
        ) : (
          <Text style={styles.value}>{studentId || '학번 없음'}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>전화번호</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="전화번호를 입력하세요"
            keyboardType="phone-pad"
          />
        ) : (
          <Text style={styles.value}>{phone || '전화번호 없음'}</Text>
        )}
      </View>

      {editing ? (
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>저장</Text>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
          <Text style={styles.editButtonText}>프로필 수정</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fafafa",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
  },
  section: {
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  value: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 5,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: "#007bff",
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  editButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: "#007bff",
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  logoutButton: {
    marginTop: 50,
    backgroundColor: "#e63946",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
