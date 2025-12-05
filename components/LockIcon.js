import React from 'react';
import { View, StyleSheet } from 'react-native';

const LockIcon = ({ size = 16 }) => {
  // Bootstrap Icons bi-lock 스타일의 자물쇠 아이콘
  // bi-lock은 닫힌 자물쇠 모양 - 고리가 본체를 감싸고 있음
  const bodyWidth = size * 0.65;
  const bodyHeight = size * 0.5;
  const shackleWidth = size * 0.9;
  const shackleHeight = size * 0.6;
  const keyholeSize = size * 0.16;
  const shackleThickness = size * 0.08;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* 자물쇠 본체 (사각형) - 아래쪽 */}
      <View 
        style={[
          styles.lockBody, 
          { 
            width: bodyWidth, 
            height: bodyHeight,
            borderRadius: size * 0.1,
            top: size * 0.35,
            left: (size - bodyWidth) / 2,
          }
        ]} 
      />
      {/* 자물쇠 고리 (U자형) - 본체를 감싸는 형태 */}
      <View 
        style={[
          styles.lockShackle, 
          { 
            width: shackleWidth, 
            height: shackleHeight,
            borderTopLeftRadius: shackleHeight / 2,
            borderTopRightRadius: shackleHeight / 2,
            borderWidth: shackleThickness,
            top: size * 0.05,
            left: (size - shackleWidth) / 2,
          }
        ]} 
      />
      {/* 키홀 (원형) - 본체 중앙 */}
      <View 
        style={[
          styles.keyhole,
          {
            width: keyholeSize,
            height: keyholeSize,
            borderRadius: keyholeSize / 2,
            top: size * 0.4,
            left: (size - keyholeSize) / 2,
          }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBody: {
    backgroundColor: '#333', // Bootstrap Icons bi-lock 스타일 - 어두운 회색
    position: 'absolute',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  lockShackle: {
    borderColor: '#333', // Bootstrap Icons bi-lock 스타일 - 어두운 회색
    borderBottomWidth: 0, // 하단 테두리 제거 (U자형)
    position: 'absolute',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  keyhole: {
    backgroundColor: '#333', // Bootstrap Icons bi-lock 스타일 - 어두운 회색
    position: 'absolute',
    zIndex: 2,
  },
});

export default LockIcon;

