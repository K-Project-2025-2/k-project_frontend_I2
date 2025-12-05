import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMyProfile } from '../services/myPageApi';
import { getUsername, getAccountInfo, removeAuthToken, removeUsername, removeUserId, removeAccountInfo, removeParticipatingRooms } from '../services/apiConfig';
import { logout } from '../services/authApi';

const menuItems = [
  '프로필',
  '계좌등록',
  '알림설정',
  '분실물 신고',
  '보증금',
  '고객센터 문의',
];

const MyPageScreen = ({ navigation, route }) => {
  const email = route?.params?.email || "";
  const password = route?.params?.password || "";

  // route.params에서 계좌 정보를 가져오되, 없으면 AsyncStorage에서 불러오기
  const [bank, setBank] = useState(route?.params?.bank || "");
  const [accountNumber, setAccountNumber] = useState(route?.params?.accountNumber || "");
  
  const [username, setUsername] = useState(''); // 기본값
  const [loading, setLoading] = useState(true);

  // 프로필 정보 불러오기
  const loadProfile = async () => {
    try {
      setLoading(true);
      // 먼저 AsyncStorage에서 회원가입 시 저장한 이름 가져오기
      const savedName = await getUsername();
      if (savedName) {
        setUsername(savedName);
      }
      
      // 서버에서 프로필 정보 가져오기 (서버에 저장된 이름이 있으면 우선 사용)
      try {
        const data = await getMyProfile();
        if (data && data !== null && data.name) {
          setUsername(data.name);
        }
      } catch (apiError) {
        console.error('프로필 조회 에러:', apiError);
        // API 에러가 발생해도 AsyncStorage의 이름으로 계속 진행
      }

      // AsyncStorage에서 계좌 정보 불러오기
      const accountInfo = await getAccountInfo();
      if (accountInfo.bank || accountInfo.accountNumber) {
        setBank(accountInfo.bank);
        setAccountNumber(accountInfo.accountNumber);
      }
    } catch (error) {
      console.error('이름 불러오기 에러:', error);
      // 에러가 발생해도 기본값으로 계속 진행
    } finally {
      setLoading(false);
    }
  };

  // 화면이 포커스될 때마다 프로필 정보 다시 불러오기
  useEffect(() => {
    loadProfile();
  }, []);

  // 프로필 화면에서 돌아올 때 이름 다시 불러오기
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const handleCopyAccount = (number) => {
    Alert.alert('복사 완료', `${number} 복사되었습니다.`);
  };

  const handleMenuItemPress = (item) => {
    if (item === '계좌등록') {
      navigation.navigate('AccountRegister');
      return;
    }

    if (item === '분실물 신고') {
      navigation.navigate('LostItem');
      return;
    }

    if (item === '프로필') {
      navigation.navigate('Profile', {
        email,
        password,
      });
      return;
    }

    if (item === '알림설정') {
      navigation.navigate('NotificationSetting');
      return;
    }

    if (item === '보증금') {
      navigation.navigate('Deposit');
      return;
    }

    if (item === '고객센터 문의') {
      navigation.navigate('CustomerSupport');
      return;
    }

    Alert.alert('페이지 이동', `${item} 화면으로 이동합니다.`);
  };

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              // 로그아웃 API 호출
              await logout();
              // 모든 인증 정보 및 데이터 삭제
              await removeAuthToken();
              await removeUserId();
              await removeUsername();
              await removeAccountInfo();
              await removeParticipatingRooms();
              // 로그인 화면으로 이동
              navigation.replace('Login');
            } catch (error) {
              console.error('로그아웃 에러:', error);
              // 에러가 발생해도 로컬 데이터는 삭제하고 로그인 화면으로 이동
              await removeAuthToken();
              await removeUserId();
              await removeUsername();
              await removeAccountInfo();
              await removeParticipatingRooms();
              navigation.replace('Login');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.profileSection}>
          <Image 
            source={require('../assets/images/image.png')} 
            style={styles.avatar} 
          />
          <Text style={styles.nameText}>{username}</Text>
        </View>

        <View style={styles.accountSection}>
          <View>
            <Text style={styles.accountText}>계좌번호</Text>
            <Text style={styles.bankText}>{bank}</Text>
            <Text style={styles.accountNumberText}>{accountNumber}</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => handleCopyAccount(accountNumber)}
            >
              <Text style={styles.copyButtonText}>복사</Text>
            </TouchableOpacity>
            {accountNumber && accountNumber.trim() ? (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('AccountRegister', {
                  bank: bank,
                  accountNumber: accountNumber,
                  isEdit: true
                })}
              >
                <Text style={styles.editButtonText}>수정</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.menuListSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleMenuItemPress(item)}
            >
              <Text style={styles.menuItemText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyPageScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  profileSection: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  accountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EBF3FF',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  accountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bankText: {
    fontSize: 14,
    color: '#555',
    marginTop: 3,
  },
  accountNumberText: {
    fontSize: 14,
    color: '#555',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  copyButton: {
    backgroundColor: '#D1D1D1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 5,
  },
  copyButtonText: {
    fontSize: 14,
    color: '#333',
  },
  editButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 5,
  },
  editButtonText: {
    fontSize: 14,
    color: '#FFF',
  },
  menuListSection: {
    marginTop: 10,
  },
  menuItem: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 17,
  },
  logoutButton: {
    marginTop: 30,
    marginBottom: 30,
    marginHorizontal: 20,
    backgroundColor: '#EBF3FF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
