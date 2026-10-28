import React from 'react';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ColorValue, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: styles.label,
        tabBarStyle: [
          styles.tabBar,
          {
            height: Platform.OS === 'ios' ? 88 : 68 + insets.bottom,
            paddingBottom: Platform.OS === 'ios' ? 28 : Math.max(insets.bottom, 10),
            paddingTop: 10,
          },
        ],
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

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 2,
  },
});