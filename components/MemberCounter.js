import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * 인원 카운터 컴포넌트
 * @param {number} currentCount - 현재 인원수
 * @param {number} maxMembers - 최대 인원수 (기본값: 4)
 * @param {number} size - 아이콘 크기 (기본값: 20)
 */
const MemberCounter = ({ currentCount = 0, maxMembers = 4, size = 20 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: maxMembers }, (_, index) => {
        const isFilled = index < currentCount;
        const isLast = index === maxMembers - 1;
        return (
          <View
            key={index}
            style={[
              styles.iconContainer,
              { 
                width: size, 
                height: size, 
                marginRight: isLast ? 0 : 4,
              },
              isFilled && styles.iconFilled,
            ]}
          >
            {/* 사람 아이콘 - 머리 (원) */}
            <View
              style={[
                styles.head,
                {
                  width: size * 0.4,
                  height: size * 0.4,
                  borderRadius: size * 0.2,
                  borderWidth: isFilled ? 0 : 2,
                  backgroundColor: isFilled ? '#007bff' : 'transparent',
                  borderColor: '#007bff',
                },
              ]}
            />
            {/* 사람 아이콘 - 몸통 (U자형) */}
            <View
              style={[
                styles.body,
                {
                  width: size * 0.6,
                  height: size * 0.5,
                  borderWidth: 2,
                  borderColor: '#007bff',
                  backgroundColor: isFilled ? '#007bff' : 'transparent',
                  borderTopLeftRadius: size * 0.3,
                  borderTopRightRadius: size * 0.3,
                  borderBottomWidth: 0,
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconFilled: {
    // 채워진 아이콘 스타일
  },
  head: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
  },
  body: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
  },
});

export default MemberCounter;

