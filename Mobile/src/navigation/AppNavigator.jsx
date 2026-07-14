import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ActivateAccountScreen from '../screens/ActivateAccountScreen';
import HomeScreen from '../screens/HomeScreen';
import RulesAboutScreen from '../screens/RulesAboutScreen';
import WaitingScreen from '../screens/WaitingScreen';
import MatchSuccessScreen from '../screens/MatchSuccessScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import ReportUserScreen from '../screens/ReportUserScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminReportListScreen from '../screens/AdminReportListScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ActivateAccount" component={ActivateAccountScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="RulesAbout" component={RulesAboutScreen} />
        <Stack.Screen name="Waiting" component={WaitingScreen} />
        <Stack.Screen name="MatchSuccess" component={MatchSuccessScreen} />
        <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
        <Stack.Screen name="ReportUser" component={ReportUserScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="AdminReportList" component={AdminReportListScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
