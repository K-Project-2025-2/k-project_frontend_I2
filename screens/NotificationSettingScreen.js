import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { getNotificationSettings, updateNotificationSettings } from '../services/myPageApi';

const NotificationSettingScreen = ({ navigation }) => {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [shuttleAlert, setShuttleAlert] = useState(true);
  const [taxiAlert, setTaxiAlert] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getNotificationSettings();
      setPushNotifications(data.push_notifications ?? true);
      setShuttleAlert(data.shuttle_alert ?? true);
      setTaxiAlert(data.taxi_alert ?? true);
    } catch (error) {
      console.error("알림 설정 불러오기 실패", error);
      // 에러가 발생해도 기본값으로 계속 진행
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateNotificationSettings(pushNotifications, shuttleAlert, taxiAlert);
      Alert.alert('설정 저장', '알림 설정이 저장되었습니다.', [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('오류', error.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>알림 설정</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <>
          {/* 앱 푸시 알림 */}
          <View style={styles.settingItem}>
            <Text style={styles.label}>앱 푸시 알림</Text>
            <Switch
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={pushNotifications ? '#007AFF' : '#f4f3f4'}
              onValueChange={setPushNotifications}
              value={pushNotifications}
            />
          </View>
          <View style={styles.divider} />

          {/* 셔틀 알림 */}
          <View style={styles.settingItem}>
            <Text style={styles.label}>셔틀 알림</Text>
            <Switch
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={shuttleAlert ? '#007AFF' : '#f4f3f4'}
              onValueChange={setShuttleAlert}
              value={shuttleAlert}
            />
          </View>
          <View style={styles.divider} />

          {/* 택시 알림 */}
          <View style={styles.settingItem}>
            <Text style={styles.label}>택시 알림</Text>
            <Switch
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={taxiAlert ? '#007AFF' : '#f4f3f4'}
              onValueChange={setTaxiAlert}
              value={taxiAlert}
            />
          </View>

          <View style={styles.spacer} />

          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>설정 저장하기</Text>
            )}
          </TouchableOpacity>
        </>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 17,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});