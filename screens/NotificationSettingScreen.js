import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationSettingScreen = ({ navigation }) => {

  const [isPushEnabled, setIsPushEnabled] = useState(true);
  const [isMarketingEnabled, setIsMarketingEnabled] = useState(false);
  const [isEmailEnabled, setIsEmailEnabled] = useState(true);
  const [isVibrationEnabled, setIsVibrationEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedPush = await AsyncStorage.getItem('isPushEnabled');
      const savedMarketing = await AsyncStorage.getItem('isMarketingEnabled');
      const savedEmail = await AsyncStorage.getItem('isEmailEnabled');
      const savedVibration = await AsyncStorage.getItem('isVibrationEnabled');

      if (savedPush !== null) setIsPushEnabled(JSON.parse(savedPush));
      if (savedMarketing !== null) setIsMarketingEnabled(JSON.parse(savedMarketing));
      if (savedEmail !== null) setIsEmailEnabled(JSON.parse(savedEmail));
      if (savedVibration !== null) setIsVibrationEnabled(JSON.parse(savedVibration));
    } catch (e) {
      console.error("불러오기 실패", e);
    }
  };

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem('isPushEnabled', JSON.stringify(isPushEnabled));
      await AsyncStorage.setItem('isMarketingEnabled', JSON.stringify(isMarketingEnabled));
      await AsyncStorage.setItem('isEmailEnabled', JSON.stringify(isEmailEnabled));
      await AsyncStorage.setItem('isVibrationEnabled', JSON.stringify(isVibrationEnabled));

      Alert.alert('설정 저장', '알림 설정이 기기에 저장되었습니다.', [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (e) {
      Alert.alert('오류', '저장에 실패했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>알림 설정</Text>

      {/* 앱 푸시 알림 */}
      <View style={styles.settingItem}>
        <Text style={styles.label}>앱 푸시 알림</Text>
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isPushEnabled ? '#007AFF' : '#f4f3f4'}
          onValueChange={setIsPushEnabled}
          value={isPushEnabled}
        />
      </View>
      <View style={styles.divider} />

      {/* 마케팅 정보 */}
      <View style={styles.settingItem}>
        <Text style={styles.label}>마케팅 정보 수신</Text>
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isMarketingEnabled ? '#007AFF' : '#f4f3f4'}
          onValueChange={setIsMarketingEnabled}
          value={isMarketingEnabled}
        />
      </View>
      <View style={styles.divider} />

      {/* 이메일 알림 */}
      <View style={styles.settingItem}>
        <Text style={styles.label}>이메일 알림</Text>
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isEmailEnabled ? '#007AFF' : '#f4f3f4'}
          onValueChange={setIsEmailEnabled}
          value={isEmailEnabled}
        />
      </View>
      <View style={styles.divider} />

      {/* 진동 알림 */}
      <View style={styles.settingItem}>
        <Text style={styles.label}>진동 알림</Text>
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isVibrationEnabled ? '#007AFF' : '#f4f3f4'}
          onValueChange={setIsVibrationEnabled}
          value={isVibrationEnabled}
        />
      </View>

      <View style={styles.spacer} />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>설정 저장하기</Text>
      </TouchableOpacity>
    </View>
  );
};

export default NotificationSettingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    marginTop: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  label: {
    fontSize: 17,
    fontWeight: '500',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  spacer: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 17,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});