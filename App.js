 import { View, Text } from 'react-native';
 import { NavigationContainer } from '@react-navigation/native';
 import { createStackNavigator } from '@react-navigation/stack';
 import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

 import SplashScreen from './screens/SplashScreen';
 import LoginScreen from './screens/LoginScreen';
 import RegisterScreen from './screens/RegisterScreen';
 import MainScreen from './screens/MainScreen';
 import MyPageScreen from './screens/MyPageScreen';
 import BusRouteScreen from './screens/BusRouteScreen';


 function TaxiScreen() {
   return (
     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
       <Text>택시 스크린 (임시)</Text>
     </View>
   );
 }

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
           name="BusRoute"
           component={BusRouteScreen}
           options={{
             headerShown: true,
             title: '버스 노선 정보',
           }}
         />
       </Stack.Navigator>
     </NavigationContainer>
   );
 }