import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '@/lib/theme';
import { useAuth } from '@/store/auth';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 20) + 12,
          paddingBottom: 32,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Account Profile</Text>
      <Text style={styles.subtitle}>
        Manage household details & preferences.
      </Text>

      {/* User Info Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.fullName ?? 'Resident User'}</Text>
        <Text style={styles.userSub}>
          {user?.phone ?? 'No phone number'} · {user?.email ?? 'No email'}
        </Text>
        <View style={styles.householdBadge}>
          <Text style={styles.householdText}>Adugbo Verified Resident</Text>
        </View>
      </View>

      {/* Settings Options Group */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>SETTINGS</Text>
        <View style={styles.menuCard}>
          <Pressable style={styles.menuItem}>
            <Text style={styles.menuText}>🏠 Household Members</Text>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.menuItem}>
            <Text style={styles.menuText}>🔔 Emergency Contacts & Alerts</Text>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.menuItem}>
            <Text style={styles.menuText}>🔒 Security & Privacy</Text>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>
        </View>
      </View>

      {/* Logout Action Button */}
      <Pressable style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  userSub: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
  householdBadge: {
    marginTop: 12,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  householdText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  menuArrow: {
    fontSize: 20,
    color: colors.muted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  logoutBtn: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.danger,
  },
});