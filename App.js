import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ResetPasswordScreen from './screen/ResetPasswordScreen';

import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import MainScreen from './screens/MainScreen';
import MyPageScreen from './screens/MyPageScreen';
import BusRouteScreen from './screens/BusRouteScreen';
import LostItemScreen from './screens/LostItemScreen';
import AccountRegisterScreen from './screens/AccountRegisterScreen';
import ProfileScreen from './screens/ProfileScreen';
import NotificationSettingScreen from './screens/NotificationSettingScreen';
import DepositScreen from './screens/DepositScreen';
import CustomerSupportScreen from './screens/CustomerSupportScreen';
import TaxiScreen from './screen/TaxiScreen';
import ChatScreen from './screen/ChatScreen';
import ReportScreen from './screen/ReportScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'black',
        tabBarLabelStyle: {
          fontSize: 15,
          paddingBottom: 10,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={MainScreen}
        options={{
          title: '홈',
          headerShown: false,
          tabBarIcon: () => null,
        }}
      />

      <Tab.Screen
        name="Taxi"
        component={TaxiScreen}
        options={{
          title: '택시',
          headerShown: false,
          tabBarIcon: () => null,
        }}
      />

      <Tab.Screen
        name="MyPage"
        component={MyPageScreen}
        options={{
          title: 'MY',
          tabBarIcon: () => null,
        }}
        initialParams={{email:'', password:''}}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen 
          name="ResetPassword" 
          component={ResetPasswordScreen}
          options={{
            headerShown: true,
            title: '비밀번호 재설정',
          }}
        />
        {/* 기타 화면들 */}
        <Stack.Screen
          name="BusRoute"
          component={BusRouteScreen}
          options={{
            headerShown: true,
            title: '버스 노선 정보',
          }}
        />

        <Stack.Screen
          name="AccountRegister"
          component={AccountRegisterScreen}
          options={{
            headerShown: true,
            title: '계좌 등록',
          }}
        />

        <Stack.Screen
          name="LostItem"
          component={LostItemScreen}
          options={{
            headerShown: true,
            title: '분실물 신고',
          }}
        />

        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            headerShown: true,
            title: '프로필',
          }}
        />

        <Stack.Screen
          name="NotificationSetting"
          component={NotificationSettingScreen}
          options={{
            headerShown: true,
            title: '알림설정',
          }}
        />

        <Stack.Screen
          name="Deposit"
          component={DepositScreen}
          options={{
            headerShown: true,
            title: '보증금',
          }}
        />

        <Stack.Screen
         name="CustomerSupport"
         component={CustomerSupportScreen}
         options={{
           headerShown: true,
           title: '고객센터 문의',
         }}
       />

        {/* 택시 관련 화면 */}
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen} 
        />
        <Stack.Screen 
          name="Report" 
          component={ReportScreen} 
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
