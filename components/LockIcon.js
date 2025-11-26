import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

const LockIcon = ({ size = 16 }) => {
  // 이미지 파일 경로 (이미지 파일이 없을 경우를 대비해 try-catch 사용)
  let lockImage = null;
  try {
    lockImage = require('../assets/images/lock.png');
  } catch (e) {
    // 이미지 파일이 없으면 View로 그린 자물쇠 표시
    console.warn('자물쇠 이미지 파일을 찾을 수 없습니다. assets/images/lock.png 파일을 추가하세요.');
  }

  // 이미지 파일이 있으면 Image 컴포넌트 사용
  if (lockImage) {
    return (
      <View style={[styles.imageContainer, { width: size, height: size }]}>
        <Image
          source={lockImage}
          style={styles.lockIcon}
          resizeMode="contain"
        />
      </View>
    );
  }

  // 이미지 파일이 없으면 View로 자물쇠 그리기
  const bodyWidth = size * 0.7;
  const bodyHeight = size * 0.55;
  const shackleWidth = size * 0.85;
  const shackleHeight = size * 0.65;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* 자물쇠 본체 (파란색) - 아래쪽 */}
      <View 
        style={[
          styles.lockBody, 
          { 
            width: bodyWidth, 
            height: bodyHeight,
            borderRadius: 3,
            bottom: size * 0.05,
          }
        ]} 
      />
      {/* 자물쇠 고리 (회색) - 닫힌 상태: 본체를 감싸고 있음 */}
      <View 
        style={[
          styles.lockShackle, 
          { 
            width: shackleWidth, 
            height: shackleHeight,
            borderTopLeftRadius: shackleHeight / 2,
            borderTopRightRadius: shackleHeight / 2,
            top: 0,
            bottom: bodyHeight * 0.4, // 본체 위로 내려와서 감싸는 형태
          }
        ]} 
      />
      {/* 키홀 (검은색 원) */}
      <View 
        style={[
          styles.keyhole,
          {
            width: size * 0.15,
            height: size * 0.15,
            top: bodyHeight * 0.3,
          }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'visible', // 고리 안쪽이 보이도록 visible로 변경
  },
  lockIcon: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    tintColor: undefined, // 이미지 색상 그대로 유지
    // 이미지가 깨지지 않도록 contain 모드 사용
  },
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBody: {
    backgroundColor: '#4A90E2', // 파란색
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#2E5C8A',
  },
  lockShackle: {
    borderWidth: 3,
    borderColor: '#666666', // 회색 (더 진하게)
    borderBottomWidth: 3, // 하단 테두리도 표시 (닫힌 상태)
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -1 }], // 중앙 정렬
    // 고리가 본체를 감싸고 있는 형태
    zIndex: 1,
  },
  keyhole: {
    backgroundColor: '#000000',
    borderRadius: 50,
    position: 'absolute',
    zIndex: 2,
  },
});

export default LockIcon;

