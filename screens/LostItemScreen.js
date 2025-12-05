import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { reportLostAndFound } from '../services/taxiApi';

const LostItemScreen = ({ navigation }) => {
  const [itemName, setItemName] = useState('');
  const [details, setDetails] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "사진 선택을 위해 갤러리 접근 권한이 필요합니다.");
      return;
    }


    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!itemName || !details) {
      Alert.alert('입력 오류', '모든 항목을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await reportLostAndFound({
        location: itemName, // 분실물 이름을 location으로 사용
        description: details,
      });
      
      Alert.alert('신고 완료', '분실물이 성공적으로 신고되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('신고 실패', error.message || '분실물 신고에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <Text style={styles.title}>분실물 신고</Text>

      <Text style={styles.label}>분실물 이름</Text>
      <TextInput
        style={styles.input}
        placeholder="예: 지갑, 에어팟"
        value={itemName}
        onChangeText={setItemName}
      />

      <Text style={styles.label}>상세 설명</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="습득 장소나 특징을 적어주세요"
        value={details}
        onChangeText={setDetails}
        multiline
      />

      <Text style={styles.label}>사진 첨부</Text>
      {/* 👇 여기가 변경된 부분: 버튼과 이미지를 하나로 합침 */}
      <TouchableOpacity style={styles.photoZone} onPress={handlePickImage}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.previewImage} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={styles.placeholderText}>터치하여 사진 등록</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.submitButtonText}>신고하기</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default LostItemScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },

  photoZone: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 25,
    backgroundColor: '#FAFAFA',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 40,
    marginBottom: 10,
    color: '#AAA',
  },
  placeholderText: {
    fontSize: 14,
    color: '#888',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});