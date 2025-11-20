import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';

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

  const bank = route?.params?.bank || "";
  const accountNumber = route?.params?.accountNumber || "";

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.profileSection}>
          <View style={styles.avatar} />
          <Text style={styles.nameText}>강승재</Text>
        </View>

        <View style={styles.accountSection}>
          <View>
            <Text style={styles.accountText}>계좌번호</Text>
            <Text style={styles.bankText}>{bank}</Text>
            <Text style={styles.accountNumberText}>{accountNumber}</Text>
          </View>

          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => handleCopyAccount(accountNumber)}
          >
            <Text style={styles.copyButtonText}>복사</Text>
          </TouchableOpacity>
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
    backgroundColor: '#D9D9D9',
    marginBottom: 12,
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
});
