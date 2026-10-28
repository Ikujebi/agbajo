import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, errMsg } from '@/api/client';
import type { Member, MembershipRole, MembershipStatus } from '@/api/types';
import { useToast } from '@/components/Toast';
import { Badge, Button, Card, Chip, Empty, ErrorState, Loading, Muted, Row, Screen } from '@/components/ui';
import { useMemberships, useOrgMembers } from '@/hooks/queries';
import { useAuth } from '@/store/auth';
import { ASSIGNABLE_ROLES, needsConfirm } from '@/lib/permissions';
import { titleCase } from '@/lib/format';
import { colors, radius } from '@/lib/theme';

export default function MembersScreen() {
  const { orgId } = useLocalSearchParams<{ orgId: string }>();
  const meUser = useAuth((s) => s.user)!;
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState<'PENDING' | 'APPROVED'>('PENDING');

  const orgType = useMemberships().data?.find((m) => m.organizationId === orgId)?.organization.type ?? 'OTHER';
  const roles = ASSIGNABLE_ROLES[orgType];
  const { data, isLoading, isError, error, refetch, isRefetching } = useOrgMembers(orgId, tab);

  const update = useMutation({
    mutationFn: (v: { id: string; status: MembershipStatus; role?: MembershipRole }) =>
      api.patch(`/organizations/${orgId}/members/${v.id}`, { status: v.status, ...(v.role && { role: v.role }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', orgId] }),
    onError: (e) => toast.show(errMsg(e), 'error'),
  });
  const busyId = update.isPending ? update.variables?.id : undefined;

  const changeRole = (m: Member, role: MembershipRole) => {
    if (role === m.role) return;
    const go = () => update.mutate({ id: m.id, status: 'APPROVED', role });
    if (needsConfirm(role)) {
      Alert.alert(
        `Make ${titleCase(role)}?`,
        `${m.user.fullName} will get ${titleCase(role)} permissions.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: go },
        ]
      );
    } else go();
  };

  const suspend = (m: Member) =>
    Alert.alert(
      'Suspend member?',
      `${m.user.fullName} will lose access until you approve them again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Suspend', style: 'destructive', onPress: () => update.mutate({ id: m.id, status: 'SUSPENDED' }) },
      ]
    );

  return (
    <Screen scroll={false}>
      {/* Tab Selectors */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, tab === 'PENDING' && styles.tabActive]}
          onPress={() => setTab('PENDING')}
        >
          <Text style={[styles.tabText, tab === 'PENDING' && styles.tabTextActive]}>
            Pending Requests
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'APPROVED' && styles.tabActive]}
          onPress={() => setTab('APPROVED')}
        >
          <Text style={[styles.tabText, tab === 'APPROVED' && styles.tabTextActive]}>
            Active Members
          </Text>
        </Pressable>
      </View>

      {isError ? <ErrorState message={errMsg(error)} onRetry={refetch} /> : null}

      <FlatList
        data={data ?? []}
        keyExtractor={(m) => m.id}
        refreshing={isRefetching}
        onRefresh={refetch}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <Loading />
          ) : isError ? (
            <></>
          ) : (
            <Empty
              text={
                tab === 'PENDING'
                  ? 'No pending requests at the moment.'
                  : 'No approved members in this community yet.'
              }
            />
          )
        }
        renderItem={({ item: m }) => {
          const locked = m.user.id === meUser.id || m.role === 'OWNER';

          return (
            <View style={styles.memberCard}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{m.user.fullName.charAt(0)}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{m.user.fullName}</Text>
                  <Muted style={styles.memberSub}>
                    {m.user.phone ?? 'No phone'} {m.unit ? `· ${m.unit}` : ''}
                  </Muted>
                  
                  <View style={styles.badgeRow}>
                    <Badge text={titleCase(m.role)} />
                    {m.user.id === meUser.id && <Badge text="You" />}
                  </View>
                </View>
              </View>

              {!locked && tab === 'PENDING' && (
                <View style={styles.actionRow}>
                  <Button
                    small
                    variant="danger"
                    title="Reject"
                    disabled={busyId === m.id}
                    onPress={() => update.mutate({ id: m.id, status: 'REJECTED' })}
                  />
                  <Button
                    small
                    title="Approve"
                    loading={busyId === m.id}
                    onPress={() => update.mutate({ id: m.id, status: 'APPROVED' })}
                  />
                </View>
              )}

              {!locked && tab === 'APPROVED' && (
                <View style={styles.managementSection}>
                  <Muted style={styles.sectionLabel}>Assign Role</Muted>
                  <View style={styles.chipRow}>
                    {roles.map((r) => (
                      <Chip
                        key={r}
                        label={titleCase(r)}
                        selected={m.role === r}
                        onPress={() => changeRole(m, r)}
                      />
                    ))}
                  </View>
                  <View style={styles.suspendRow}>
                    <Button
                      small
                      variant="danger"
                      title="Suspend Member"
                      loading={busyId === m.id}
                      onPress={() => suspend(m)}
                    />
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  memberCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.text,
  },
  memberSub: {
    fontSize: 13,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  managementSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suspendRow: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
});