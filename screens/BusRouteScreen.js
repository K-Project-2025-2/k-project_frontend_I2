import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Modal,
} from 'react-native';

const STOPS_GIHEUNG_TO_IGONGGWAN = [
  { id: '1', name: '기흥역(4번 출구)', info: '08:10~17:50', status: 'passed' },
  { id: '2', name: '강남대역', info: '08:12~17:52', status: 'passed' },
  { id: '3', name: '강남대학교(샬롬관)', info: '08:14~17:54', status: 'passed' },
  { id: '4', name: '강남대학교(본관)', info: '08:17~17:57', status: 'upcoming' },
  { id: '5', name: '강남대학교(이공관)', info: '08:00~18:00', status: 'upcoming' },
];

const STOPS_IGONGGWAN_TO_GIHEUNG = [
  { id: '5', name: '강남대학교(이공관)', info: '08:00~18:00', status: 'passed' },
  { id: '4', name: '강남대학교(본관)', info: '08:17~17:57', status: 'passed' },
  { id: '6', name: '강남대학교(인문사회관)', info: '08:19~17:59', status: 'upcoming' },
  { id: '7', name: '스타벅스앞', info: '08:22~18:02', status: 'upcoming' },
  { id: '1', name: '기흥역(4번 출구)', info: '08:10~17:50', status: 'upcoming' },
];

const ARRIVAL_DATA_GIHEUNG_TO_IGONGGWAN = {
  '1': [],
  '2': [
    { number: '', time: '곧 도착', remaining: '1번째 전', type: '혼잡' },
  ],
  '3': [
    { number: '', time: '4분 01초', remaining: '2번째 전', type: '보통' },
    { number: '', time: '14분 20초', remaining: '3번째 전', type: '여유' },
  ],
  '4': [
    { number: '', time: '10분 39초', remaining: '2번째 전', type: '여유' },
  ],
  '5': [],
};

const ARRIVAL_DATA_IGONGGWAN_TO_GIHEUNG = {
  '5': [{ number: '', time: '3분 10초', remaining: '1번째 전', type: '여유' }],
  '4': [{ number: '', time: '5분 00초', remaining: '1번째 전', type: '보통' }],
  '6': [],
  '7': [{ number: '', time: '12분 05초', remaining: '2번째 전', type: '보통' }],
  '1': [{ number: '', time: '곧 도착', remaining: '1번째 전', type: '혼잡' }], // ID '1:' -> '1'로 수정
};



const STOPS_STARBUCKS_TO_IGONGGWAN = [
  { id: '7', name: '스타벅스앞', info: '08:22~18:02', status: 'passed' },
  { id: '6', name: '강남대학교(인문사회관)', info: '08:19~17:59', status: 'passed' },
  { id: '4', name: '강남대학교(본관)', info: '08:17~17:57', status: 'upcoming' },
  { id: '5', name: '강남대학교(이공관)', info: '08:00~18:00', status: 'upcoming' },
];

const STOPS_IGONGGWAN_TO_STARBUCKS = [
  { id: '5', name: '강남대학교(이공관)', info: '08:00~18:00', status: 'passed' },
  { id: '4', name: '강남대학교(본관)', info: '08:17~17:57', status: 'passed' },
  { id: '6', name: '강남대학교(인문사회관)', info: '08:19~17:59', status: 'upcoming' },
  { id: '7', name: '스타벅스앞', info: '08:22~18:02', status: 'upcoming' },
];


const ARRIVAL_DATA_STARBUCKS_TO_IGONGGWAN = {
  '7': [{ number: '', time: '곧 도착', remaining: '1번째 전', type: '혼잡' }],
  '6': [{ number: '', time: '3분 00초', remaining: '1번째 전', type: '보통' }],
  '4': [],
  '5': [{ number: '', time: '10분 00초', remaining: '2번째 전', type: '여유' }],
};

const ARRIVAL_DATA_IGONGGWAN_TO_STARBUCKS = {
  '5': [],
  '4': [{ number: '', time: '2분 10초', remaining: '1번째 전', type: '여유' }],
  '6': [{ number: '', time: '8분 30초', remaining: '2번째 전', type: '보통' }],
  '7': [],
};


const StopItem = ({ item, onPress }) => {
  const isPassed = item.status === 'passed';
  const lineColor = isPassed ? '#4A90E2' : '#2ecc71';
  const circleColor = isPassed ? '#4A90E2' : '#2ecc71';

  return (
    <TouchableOpacity onPress={() => onPress(item)}>
      <View style={styles.stopContainer}>
        <View style={styles.timelineContainer}>
          <View style={[styles.verticalLine, { backgroundColor: lineColor }]} />
          <View style={[styles.circle, { backgroundColor: circleColor }]} />
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.stopName}>{item.name}</Text>
          <Text style={styles.stopInfo}>{item.info}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};


const BusRouteScreen = ({ route }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStop, setSelectedStop] = useState(null);


  const { routeName = 'Giheung', isForward: initialIsForward = true } = route.params || {};


  const [isForward, setIsForward] = useState(initialIsForward);


  const { currentStops, currentArrivalData, currentDirectionName, modalDirectionInfo } = useMemo(() => {

    if (routeName === 'Giheung') {
      if (isForward) {
        return {
          currentStops: STOPS_GIHEUNG_TO_IGONGGWAN,
          currentArrivalData: ARRIVAL_DATA_GIHEUNG_TO_IGONGGWAN,
          currentDirectionName: '강남대학교(이공관) 방면',
          modalDirectionInfo: '이공관 방면',
        };
      } else {
        return {
          currentStops: STOPS_IGONGGWAN_TO_GIHEUNG,
          currentArrivalData: ARRIVAL_DATA_IGONGGWAN_TO_GIHEUNG,
          currentDirectionName: '기흥역 방면',
          modalDirectionInfo: '기흥역 방면',
        };
      }
    } else {
      if (isForward) {
        return {
          currentStops: STOPS_STARBUCKS_TO_IGONGGWAN,
          currentArrivalData: ARRIVAL_DATA_STARBUCKS_TO_IGONGGWAN,
          currentDirectionName: '강남대학교(이공관) 방면',
          modalDirectionInfo: '이공관 방면',
        };
      } else {
        return {
          currentStops: STOPS_IGONGGWAN_TO_STARBUCKS,
          currentArrivalData: ARRIVAL_DATA_IGONGGWAN_TO_STARBUCKS,
          currentDirectionName: '스타벅스 방면',
          modalDirectionInfo: '스타벅스 방면',
        };
      }
    }
  }, [routeName, isForward]);


  const toggleDirection = () => {
    setIsForward((prev) => !prev);
  };


  const handleStopPress = (stop) => {
    const arrivalData = currentArrivalData[stop.id] || [];
    setSelectedStop({
      name: stop.name,
      info: modalDirectionInfo,
      id: stop.id,
      arrivals: arrivalData,
    });
    setModalVisible(true);
  };

  const renderArrivalModal = () => {
    if (!selectedStop) return null;
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalStopName}>{selectedStop.name}</Text>
              <Text style={styles.modalStopInfo}>{selectedStop.info}</Text>
            </View>
            <FlatList
              data={selectedStop.arrivals}
              keyExtractor={(item, index) => `${item.number}-${index}`}
              renderItem={({ item }) => (
                <View style={styles.arrivalItem}>
                  <View style={styles.busNumberContainer}>
                    <Text
                      style={[
                        styles.busNumber,
                        item.number.includes('A') && styles.busRed,
                      ]}
                    >
                      {item.number}
                    </Text>
                  </View>
                  <View style={styles.arrivalTimeContainer}>
                    <Text style={styles.arrivalTime}>{item.time}</Text>
                    <Text
                      style={styles.arrivalInfo}
                    >{`${item.remaining}, ${item.type}`}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    도착 예정인 버스가 없습니다.
                  </Text>
                </View>
              }
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{currentDirectionName}</Text>
        <TouchableOpacity onPress={toggleDirection} style={styles.toggleButton}>
           <Text style={styles.toggleButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={currentStops}
        renderItem={({ item }) => (
          <StopItem item={item} onPress={handleStopPress} />
        )}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
      {renderArrivalModal()}
    </SafeAreaView>
  );
};

//스타일시트
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  toggleButton: {
    padding: 5,
  },
  toggleButtonText: {
    fontSize: 24,
  },
  list: { flex: 1 },
  stopContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    minHeight: 80,
  },
  timelineContainer: {
    width: 30,
    alignItems: 'center',
    position: 'relative',
  },
  verticalLine: {
    position: 'absolute',
    width: 4,
    height: '100%',
    top: 0,
  },
  circle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 20,
    zIndex: 1,
    borderWidth: 2,
    borderColor: 'white',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 10,
    paddingVertical: 15,
  },
  stopName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  stopInfo: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalStopName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalStopInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  arrivalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  busNumberContainer: {
    width: 80,
  },
  busNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
  },
  busRed: {
    color: '#e74c3c',
  },
  arrivalTimeContainer: {
    flex: 1,
  },
  arrivalTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  arrivalInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default BusRouteScreen;