
import React from 'react';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ColorValue } from 'react-native';
import { colors } from '@/lib/theme';

const icon = (ios: string, android: string) =>
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return (
      <SymbolView
        name={{ ios, android, web: android } as any}
        size={size}
        tintColor={color ?? colors.muted}
      />
    );
  };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerTitleStyle: { color: colors.text },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: icon('house.fill', 'home'),
        }}
      />

      <Tabs.Screen
        name="visitors"
        options={{
          title: 'Visitors',
          tabBarIcon: icon('person.badge.key.fill', 'badge'),
        }}
      />

      <Tabs.Screen
        name="shops"
        options={{
          title: 'Shops',
          tabBarIcon: icon('bag.fill', 'storefront'),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: icon('person.crop.circle.fill', 'person'),
        }}
      />
    </Tabs>
  );
}
