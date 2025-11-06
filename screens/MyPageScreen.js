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
  '이용지수 온도',
  '분실물 신고',
  '보증금',
  '고객센터 문의',
];

const MyPageScreen = ({ navigation }) => {

  const handleCopyAccount = () => {
    Alert.alert('복사 완료', '계좌번호가 클립보드에 복사되었습니다.');
  };

  const handleMenuItemPress = (item) => {
    Alert.alert('페이지 이동', `${item} 화면으로 이동합니다.`);

  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* 1. 프로필 섹션 */}
        <View style={styles.profileSection}>
          <View style={styles.avatar} />
          <Text style={styles.nameText}>???</Text>
        </View>

        {/* 2. 계좌 섹션 */}
        <View style={styles.accountSection}>
          <View>
            <Text style={styles.accountText}>계좌번호</Text>
            <Text style={styles.bankText}>??은행</Text>
            <Text style={styles.accountNumberText}>145234511245</Text>
          </View>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopyAccount}
          >
            <Text style={styles.copyButtonText}>복사</Text>
          </TouchableOpacity>
        </View>

        {/* 3. 메뉴 리스트 */}
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

//스타일시트
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
    marginTop:3,
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

export default MyPageScreen;