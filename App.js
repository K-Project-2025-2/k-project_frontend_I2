import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { enableScreens } from 'react-native-screens';
import TaxiScreen from './screen/TaxiScreen';
import ChatScreen from './screen/ChatScreen';

// react-native-screens 초기화
enableScreens();

// Stack Navigator 생성
const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Taxi"
        screenOptions={{
          headerShown: false, // 모든 화면에서 헤더 숨김 (각 화면에서 자체 헤더 사용)
        }}
      >
        {/* 택시 화면 (TaxiScreen) */}
        <Stack.Screen 
          name="Taxi" 
          component={TaxiScreen} 
        />
        {/* 채팅방 화면 (ChatScreen) */}
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;


