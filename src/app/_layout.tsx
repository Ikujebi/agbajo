import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@/api/queryClient';
import { ToastProvider } from '@/components/Toast';
import { useAuth } from '@/store/auth';
import { colors } from '@/lib/theme';

/** Sends signed-out users to login and signed-in users away from it. */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, ready, hydrate } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!ready) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) router.replace('/login');
    else if (user && inAuth) router.replace('/');
  }, [user, ready, segments, router]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <StatusBar style="dark" />
            <AuthGate>
              <Stack screenOptions={{ headerTintColor: colors.primary, headerBackButtonDisplayMode: 'minimal', contentStyle: { backgroundColor: colors.bg } }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
                <Stack.Screen name="org/find" options={{ title: 'Join a community' }} />
                <Stack.Screen name="org/create" options={{ title: 'Register a community' }} />
                <Stack.Screen name="members/[orgId]" options={{ title: 'Members' }} />
                <Stack.Screen name="broadcast/[orgId]" options={{ title: 'Email members' }} />
                <Stack.Screen name="pass/create" options={{ title: 'New visitor pass' }} />
                <Stack.Screen name="pass/[id]" options={{ title: 'Visitor pass' }} />
                <Stack.Screen name="gate/[orgId]" options={{ title: 'Gate' }} />
                <Stack.Screen name="shop/manage/[orgId]" options={{ title: 'Manage shop' }} />
              </Stack>
            </AuthGate>
          </ToastProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
