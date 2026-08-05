import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ActivateAccountScreen from '../screens/ActivateAccountScreen';
import HomeScreen from '../screens/HomeScreen';
import RulesAboutScreen from '../screens/RulesAboutScreen';
import AboutScreen from '../screens/AboutScreen';
import WaitingScreen from '../screens/WaitingScreen';
import MatchSuccessScreen from '../screens/MatchSuccessScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import ReportUserScreen from '../screens/ReportUserScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import LogoutConfirmScreen from '../screens/LogoutConfirmScreen';
import ChatHistoryScreen from '../screens/ChatHistoryScreen';
import ChatRoomDetailScreen from '../screens/ChatRoomDetailScreen';
import MyReportsScreen from '../screens/MyReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DeleteAccountScreen from '../screens/DeleteAccountScreen';
import AdminReportListScreen from '../screens/AdminReportListScreen';
import AdminReportDetailScreen from '../screens/AdminReportDetailScreen';

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
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Waiting" component={WaitingScreen} />
        <Stack.Screen name="MatchSuccess" component={MatchSuccessScreen} />
        <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
        <Stack.Screen name="ReportUser" component={ReportUserScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="LogoutConfirm" component={LogoutConfirmScreen} />
        <Stack.Screen name="ChatHistory" component={ChatHistoryScreen} />
        <Stack.Screen name="ChatRoomDetail" component={ChatRoomDetailScreen} />
        <Stack.Screen name="MyReports" component={MyReportsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
        <Stack.Screen name="AdminReportList" component={AdminReportListScreen} />
        <Stack.Screen name="AdminReportDetail" component={AdminReportDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
