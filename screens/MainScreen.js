import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const MainScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('home');

  const handleRefresh = () => {
    // 새로고침 로직
    console.log('새로고침');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerButtonText}>KangnamBUS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerButtonText}>프로필</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 달구지 시간표 카드 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>달구지 시간표</Text>
            <Text style={styles.dateText}>2025.01.15월</Text>
          </View>
          
          <View style={styles.routeSection}>
            <Text style={styles.routeText}>강남대학교 → 기흥역(4번출구)</Text>
            <Text style={styles.routeText}>강남대학교 → 스타벅스 앞</Text>
          </View>

          <View style={styles.scheduleSection}>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleTitle}>기흥역 출발</Text>
              <Text style={styles.scheduleInfo}>8:00~8:50 11회 운행</Text>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>10:30</Text>
                <Text style={styles.timeText}>10:50</Text>
                <Text style={styles.timeText}>11:00</Text>
                <Text style={styles.timeText}>11:10</Text>
              </View>
            </View>

            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleTitle}>이공관 출발</Text>
              <Text style={styles.scheduleInfo}>운행 정보 없음</Text>
            </View>
          </View>
        </View>

        {/* 실시간 버스 추적 카드 */}
        <View style={styles.card}>
          <Text style={styles.routeInfo}>기흥역 → 이공관</Text>
          <View style={styles.busInfo}>
            <Text style={styles.busTime}>10:40 달구지</Text>
            <View style={styles.refreshSection}>
              <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                <Text style={styles.refreshText}>새로고침</Text>
              </TouchableOpacity>
              <Text style={styles.nextBus}>10:30달구지</Text>
            </View>
          </View>
          
          {/* 진행률 바 */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
          </View>

          {/* 정거장 버튼들 */}
          <View style={styles.stationContainer}>
            <TouchableOpacity style={styles.stationButton}>
              <Text style={styles.stationText}>기흥역</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stationButton}>
              <Text style={styles.stationText}>강남대역</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stationButton}>
              <Text style={styles.stationText}>샬롬관</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stationButton}>
              <Text style={styles.stationText}>교육관</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stationButton}>
              <Text style={styles.stationText}>이공관</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 정거장 정보 카드들 */}
        <View style={styles.stationInfoContainer}>
          <View style={styles.stationCard}>
            <Text style={styles.stationCardTitle}>상갈</Text>
            <Text style={styles.stationCardMain}>기흥</Text>
            <Text style={styles.stationCardInfo}>인천행 6:40</Text>
            <Text style={styles.stationCardInfo}>로도착</Text>
          </View>
          
          <View style={styles.stationCard}>
            <Text style={styles.stationCardTitle}>신갈</Text>
            <Text style={styles.stationCardMain}>기흥</Text>
            <Text style={styles.stationCardInfo}>왕십리행 1:10</Text>
            <Text style={styles.stationCardInfo}>왕십리행 5:25</Text>
          </View>
        </View>
      </ScrollView>

      {/* 하단 네비게이션 */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navButton, selectedTab === 'home' && styles.navButtonActive]}
          onPress={() => setSelectedTab('home')}
        >
          <Text style={[styles.navButtonText, selectedTab === 'home' && styles.navButtonTextActive]}>
            홈
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, selectedTab === 'taxi' && styles.navButtonActive]}
          onPress={() => setSelectedTab('taxi')}
        >
          <Text style={[styles.navButtonText, selectedTab === 'taxi' && styles.navButtonTextActive]}>
            택시
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, selectedTab === 'mypage' && styles.navButtonActive]}
          onPress={() => setSelectedTab('mypage')}
        >
          <Text style={[styles.navButtonText, selectedTab === 'mypage' && styles.navButtonTextActive]}>
            마이페이지
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  headerButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  routeSection: {
    marginBottom: 20,
  },
  routeText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  scheduleSection: {
    gap: 15,
  },
  scheduleItem: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 8,
  },
  scheduleInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  timeText: {
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  routeInfo: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  busInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  busTime: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  refreshSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  refreshText: {
    fontSize: 14,
    color: '#333',
  },
  nextBus: {
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '75%',
    backgroundColor: '#4A90E2',
    borderRadius: 4,
  },
  stationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stationButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  stationText: {
    fontSize: 14,
    color: '#4A90E2',
  },
  stationInfoContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  stationCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stationCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 8,
  },
  stationCardMain: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 8,
  },
  stationCardInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 10,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  navButtonActive: {
    backgroundColor: '#4A90E2',
  },
  navButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  navButtonTextActive: {
    color: 'white',
  },
});

export default MainScreen;
