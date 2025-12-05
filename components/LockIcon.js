import React from 'react';
import { Image, StyleSheet } from 'react-native';

const LockIcon = ({ size = 12 }) => {
  return (
    <Image
      source={require('../assets/images/lock123.png')}
      style={[styles.lockImage, { width: size, height: size }]}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  lockImage: {
    tintColor: undefined, // 원본 색상 유지
  },
});

export default LockIcon;

