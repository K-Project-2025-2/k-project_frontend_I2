import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';

const ProfileScreen = ({ route, navigation }) => {
  const { email = "이메일 정보 없음", password = "" } = route.params ?? {};

  const [newPassword, setNewPassword] = useState(password);
  const [editing, setEditing] = useState(false);

  const handleSavePassword = () => {
    Alert.alert("변경 완료", "비밀번호가 성공적으로 변경되었습니다.");
    setEditing(false);
  };

  const handleLogout = () => {
    navigation.replace("Login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>프로필</Text>

      <View style={styles.section}>
        <Text style={styles.label}>학교 이메일</Text>
        <Text style={styles.value}>{email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>비밀번호</Text>

        {editing ? (
          <>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSavePassword}>
              <Text style={styles.saveButtonText}>저장</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.value}>********</Text>
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.changeText}>비밀번호 변경</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

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
  },
  changeText: {
    color: "#007bff",
    marginTop: 8,
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: "#007bff",
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    width: 80,
    alignItems: "center",
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
