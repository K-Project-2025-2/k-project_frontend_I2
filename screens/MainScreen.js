import React, { useState, useEffect } from 'react';
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

const GIHEUNG_MON_FRI = [
  '08:00~08:50 (11회 운행)',
  '10:30', '10:50', '11:00', '11:10', '11:20', '11:30',
  '12:50', '13:10', '13:40', '14:00', '14:20', '17:00',
  '17:20',
];
const GIGONG_MON_FRI = [
  '08:10~09:00 (11회 운행)',
  '10:40', '11:00', '11:10', '11:20', '11:30', '11:50',
  '13:00', '13:20', '13:50', '14:10', '14:30', '17:20',
  '17:50',
];
const STARBUCKS_MON_FRI = ['08:20', '08:30', '08:40', '08:50'];
const SIGONG_MON_FRI = ['08:30', '08:40', '08:50', '09:00'];

const GIHEUNG_TUE_THU = [
  '07:50~08:50 (20회 운행)',
  '10:30', '10:40', '10:50', '11:00', '11:10', '11:20', '11:30',
  '13:00', '13:10', '13:20', '13:30', '13:40', '13:50', '14:00',
  '14:10', '14:20', '14:30', '14:40', '14:50', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:20',
];
const GIGONG_TUE_THU = [
  '08:00~09:05 (20회 운행)',
  '10:40', '10:50', '11:00', '11:10', '11:20', '11:30', '11:50',
  '13:10', '13:20', '13:30', '13:40', '13:50', '14:00', '14:10',
  '14:20', '14:30', '14:40', '14:50', '15:00', '15:10', '15:40',
  '16:10', '16:40', '17:10', '17:30',
];
const STARBUCKS_TUE_THU = ['08:00', '08:10', '08:20', '08:30', '08:40', '08:50'];
const SIGONG_TUE_THU = ['08:10', '08:20', '08:30', '08:40', '08:50', '09:00'];


const FORWARD_STATIONS_GIHEUNG = ['기흥역', '강남대역', '샬롬관', '본관', '이공관'];
const REVERSE_STATIONS_GIHEUNG = ['이공관', '본관', '인문사회관', '스타벅스앞', '기흥역'];
const FORWARD_STATIONS_STARBUCKS = ['스타벅스앞', '샬롬관', '본관', '이공관'];
const REVERSE_STATIONS_STARBUCKS = ['이공관', '본관', '인문사회관', '스타벅스앞'];



const getNextBusTimes = (schedule, count = 2) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  if (!schedule) {
    return [];
  }
  const upcomingTimes = schedule.filter((time) => {
    if (time.includes('~')) return false;
    const [hour, minute] = time.split(':').map(Number);
    if (hour > currentHour) return true;
    if (hour === currentHour && minute >= currentMinute) return true;
    return false;
  });
  return upcomingTimes.slice(0, count);
};



const ScheduleDetail = ({ title, times, info }) => (
  <View style={styles.scheduleItem}>
    <Text style={styles.scheduleTitle}>{title}</Text>
    {info && <Text style={styles.scheduleInfo}>{info}</Text>}
    <View style={styles.timeContainer}>
      {times.length > 0 ? (
        times.map((time, index) => (
          <Text key={index} style={styles.timeText}>{time}</Text>
        ))
      ) : (
        <Text style={styles.scheduleInfo}>운행 정보 없음</Text>
      )}
    </View>
  </View>
);


const CombinedRealTimeCard = ({ navigation, onRefresh }) => {
  const [activeRoute, setActiveRoute] = useState('Giheung');


  const [isGiheungForward, setIsGiheungForward] = useState(true);
  const [isStarbucksForward, setIsStarbucksForward] = useState(true);

  const isGiheungActive = activeRoute === 'Giheung';

  const currentIsForward = isGiheungActive ? isGiheungForward : isStarbucksForward;
  const handleToggleDirection = isGiheungActive
    ? () => setIsGiheungForward(p => !p)
    : () => setIsStarbucksForward(p => !p);

  const currentTitle = isGiheungActive
    ? (isGiheungForward ? '기흥역 ➡️ 이공관' : '이공관 ➡️ 기흥역')
    : (isStarbucksForward ? '스타벅스 ➡️ 이공관' : '이공관 ➡️ 스타벅스');

  const currentStations = isGiheungActive
    ? (isGiheungForward ? FORWARD_STATIONS_GIHEUNG : REVERSE_STATIONS_GIHEUNG)
    : (isStarbucksForward ? FORWARD_STATIONS_STARBUCKS : REVERSE_STATIONS_STARBUCKS);


  const goToBusRoute = () => {
    if (navigation && navigation.navigate) {
      navigation.navigate('BusRoute', {
        routeName: activeRoute,
        isForward: currentIsForward,
      });
    } else {
      console.log('버스 노선 스크린으로 이동 (navigation prop 없음)');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            isGiheungActive && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveRoute('Giheung')}>
          <Text
            style={[
              styles.segmentText,
              isGiheungActive && styles.segmentTextActive,
            ]}>
            기흥역 노선
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            !isGiheungActive && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveRoute('Starbucks')}>
          <Text
            style={[
              styles.segmentText,
              !isGiheungActive && styles.segmentTextActive,
            ]}>
            스타벅스 노선
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={goToBusRoute}>
        <View style={styles.headerContainer}>
          <Text style={styles.routeInfo}>{currentTitle}</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={handleToggleDirection}>
              <Text style={styles.toggleButtonText}>🔄</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Text style={styles.refreshText}>새로고침</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>

        <View style={styles.stationContainer}>
          {currentStations.map((station, i) => (
            <TouchableOpacity key={i} style={styles.stationButton}>
              <Text style={styles.stationText}>{station}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </View>
  );
};


const MainScreen = ({ navigation }) => {
  const [nextGiheungTimes, setNextGiheungTimes] = useState([]);
  const [nextGigongTimes, setNextGigongTimes] = useState([]);
  const [nextStarbucksTimes, setNextStarbucksTimes] = useState([]);
  const [nextSigongTimes, setNextSigongTimes] = useState([]);
  const [giheungInfo, setGiheungInfo] = useState('');
  const [gigongInfo, setGigongInfo] = useState('');

  const updateSchedules = () => {
    const today = new Date().getDay();
    let giheungSchedule, gigongSchedule, starbucksSchedule, sigongSchedule;
    let giheungDesc, gigongDesc;

    if (today === 1 || today === 5) {
      giheungSchedule = GIHEUNG_MON_FRI;
      gigongSchedule = GIGONG_MON_FRI;
      starbucksSchedule = STARBUCKS_MON_FRI;
      sigongSchedule = SIGONG_MON_FRI;
      giheungDesc = '08:00~08:50 (11회 운행)';
      gigongDesc = '08:10~09:00 (11회 운행)';

    } else if (today >= 2 && today <= 4) {
      giheungSchedule = GIHEUNG_TUE_THU;
      gigongSchedule = GIGONG_TUE_THU;
      starbucksSchedule = STARBUCKS_TUE_THU;
      sigongSchedule = SIGONG_TUE_THU;
      giheungDesc = '07:50~08:50 (20회 운행)';
      gigongDesc = '08:00~09:05 (20회 운행)';

    } else {
      giheungSchedule = []; gigongSchedule = []; starbucksSchedule = []; sigongSchedule = [];
      giheungDesc = '운행 정보 없음';
      gigongDesc = '운행 정보 없음';
    }

    setNextGiheungTimes(getNextBusTimes(giheungSchedule));
    setNextGigongTimes(getNextBusTimes(gigongSchedule));
    setNextStarbucksTimes(getNextBusTimes(starbucksSchedule));
    setNextSigongTimes(getNextBusTimes(sigongSchedule));
    setGiheungInfo(giheungDesc);
    setGigongInfo(gigongDesc);
  };

  useEffect(() => {
    updateSchedules();
    const interval = setInterval(updateSchedules, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    updateSchedules();
  };

  const goToMyPage = () => {
    navigation.jumpTo('MyPage');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />


      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerButtonText}>KangnamBUS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={goToMyPage}>
          <Text style={styles.headerButtonText}>프로필</Text>
        </TouchableOpacity>
      </View>


      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>달구지 시간표</Text>
            <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
          </View>

          <View style={styles.routeTitleContainer}>
            <Text style={styles.routeTitleText}>기흥역 ↔️ 강남대학교</Text>
            <Text style={styles.routeTitleText}>       스타벅스 ↔️ 강남대학교</Text>
          </View>

          <View style={styles.horizontalContainer}>
            <View style={styles.cardHalf}>
              <ScheduleDetail title="기흥역 출발" times={nextGiheungTimes} info={giheungInfo} />
              <ScheduleDetail title="이공관 출발" times={nextGigongTimes} info={gigongInfo} />
            </View>

            <View style={styles.cardHalf}>
              <ScheduleDetail title="스타벅스 출발" times={nextStarbucksTimes} info={null} />
              <ScheduleDetail title="이공관 출발" times={nextSigongTimes} info={null} />
            </View>
          </View>
        </View>

        {/* --- 2. 통합 실시간 버스 카드 --- */}
        <CombinedRealTimeCard
          navigation={navigation}
          onRefresh={handleRefresh}
        />

      </ScrollView>
    </View>
  );
};


//스타일시트
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: (StatusBar.currentHeight || 0) + 10,
    paddingBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
  routeTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 1,
  },
  routeTitleText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  horizontalContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  cardHalf: {
    flex: 1,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  scheduleItem: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginBottom: 10,
    minHeight: 100,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 8,
  },
  scheduleInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  timeText: {
    fontSize: 13,
    color: '#333',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },

  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    borderRadius: 7,
  },
  segmentText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  segmentTextActive: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  routeInfo: {
    fontSize: 17,
    color: '#333',
    fontWeight: 'bold',
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 18,
    color: '#333',
  },
  refreshButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshText: {
    fontSize: 14,
    color: '#333',
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
    width: '75%', // (임시)
    backgroundColor: '#4A90E2',
    borderRadius: 4,
  },
  stationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 5,
  },
  stationButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    borderRadius: 16,
  },
  stationText: {
    fontSize: 10,
    color: '#555',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default MainScreen;