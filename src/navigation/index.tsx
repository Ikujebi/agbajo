import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../store/auth';
import { colors } from '../theme';
import type { RootParams } from './types';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/home/HomeScreen';
import NotificationsScreen from '../screens/home/NotificationsScreen';
import FindOrgScreen from '../screens/orgs/FindOrgScreen';
import CreateOrgScreen from '../screens/orgs/CreateOrgScreen';
import MembersScreen from '../screens/orgs/MembersScreen';
import BroadcastScreen from '../screens/orgs/BroadcastScreen';
import VisitorsScreen from '../screens/visitors/VisitorsScreen';
import CreatePassScreen from '../screens/visitors/CreatePassScreen';
import PassDetailScreen from '../screens/visitors/PassDetailScreen';
import GateScreen from '../screens/visitors/GateScreen';
import ShopsScreen from '../screens/shops/ShopsScreen';
import ManageShopScreen from '../screens/shops/ManageShopScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import NewChatScreen from '../screens/chat/NewChatScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator<RootParams>();
const Tab = createBottomTabNavigator();

const icon = (e: string) => ({ focused }: { focused: boolean }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{e}</Text>;

function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: colors.primary, headerTitleStyle: { fontWeight: '700' } }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: icon('🏘️') }} />
      <Tab.Screen name="Visitors" component={VisitorsScreen} options={{ tabBarIcon: icon('🎟️') }} />
      <Tab.Screen name="Shops" component={ShopsScreen} options={{ tabBarIcon: icon('🛒') }} />
      <Tab.Screen name="Chat" component={ChatListScreen} options={{ tabBarIcon: icon('💬') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: icon('👤') }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, ready } = useAuth();
  if (!ready) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;
  }
  return (
    <Stack.Navigator>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create account' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="FindOrg" component={FindOrgScreen} options={{ title: 'Join a community' }} />
          <Stack.Screen name="CreateOrg" component={CreateOrgScreen} options={{ title: 'Register' }} />
          <Stack.Screen name="Members" component={MembersScreen} options={({ route }) => ({ title: route.params.name })} />
          <Stack.Screen name="Broadcast" component={BroadcastScreen} options={{ title: 'Email members' }} />
          <Stack.Screen name="CreatePass" component={CreatePassScreen} options={{ title: 'New visitor pass' }} />
          <Stack.Screen name="PassDetail" component={PassDetailScreen} options={{ title: 'Visitor pass' }} />
          <Stack.Screen name="Gate" component={GateScreen} options={({ route }) => ({ title: `Gate · ${route.params.name}` })} />
          <Stack.Screen name="ManageShop" component={ManageShopScreen} options={({ route }) => ({ title: route.params.name })} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="NewChat" component={NewChatScreen} options={{ title: 'New chat' }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
