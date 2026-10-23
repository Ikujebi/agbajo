import React, { useState } from 'react';
import { Alert, FlatList, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, errMsg } from '@/api/client';
import { useMemberships, useOrgMembers } from '@/hooks/queries';
import { useAuth } from '@/store/auth';
import { useToast } from '@/components/Toast';
import { Badge, Button, Card, Chip, Empty, ErrorState, Loading, Muted, Row, Screen } from '@/components/ui';
import { ASSIGNABLE_ROLES, needsConfirm } from '@/lib/permissions';
import { titleCase } from '@/lib/format';
import type { Member, MembershipRole, MembershipStatus } from '@/api/types';

export default function MembersScreen() {
  const { orgId } = useLocalSearchParams<{ orgId: string }>();
  const me = useAuth((s) => s.user)!;
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
      Alert.alert(`Make ${titleCase(role)}?`, `${m.user.fullName} will get ${titleCase(role)} permissions.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', onPress: go }]);
    } else go();
  };

  const suspend = (m: Member) =>
    Alert.alert('Suspend member?', `${m.user.fullName} will lose access until you approve them again.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Suspend', style: 'destructive', onPress: () => update.mutate({ id: m.id, status: 'SUSPENDED' }) },
    ]);

  return (
    <Screen scroll={false}>
      <Row style={{ marginBottom: 12 }}>
        <Chip label="Pending requests" selected={tab === 'PENDING'} onPress={() => setTab('PENDING')} />
        <Chip label="Members" selected={tab === 'APPROVED'} onPress={() => setTab('APPROVED')} />
      </Row>
      {isError ? <ErrorState message={errMsg(error)} onRetry={refetch} /> : null}
      <FlatList
        data={data ?? []}
        keyExtractor={(m) => m.id}
        refreshing={isRefetching}
        onRefresh={refetch}
ListEmptyComponent={
  isLoading ? (
    <Loading />
  ) : isError ? (
    <></>
  ) : (
    <Empty
      text={
        tab === 'PENDING'
          ? 'No pending requests.'
          : 'No members yet.'
      }
    />
  )
}        renderItem={({ item: m }) => {
          const locked = m.user.id === me.id || m.role === 'OWNER';
          return (
            <Card>
              <Text style={{ fontWeight: '700', fontSize: 16 }}>{m.user.fullName}</Text>
              <Muted>{m.user.phone}{m.unit ? ` · ${m.unit}` : ''}</Muted>
              <Row style={{ marginVertical: 6 }}>
                <Badge text={titleCase(m.role)} />
                {m.user.id === me.id && <Badge text="You" />}
              </Row>
              {!locked && tab === 'PENDING' && (
                <Row>
                  <Button small title="Approve" loading={busyId === m.id} onPress={() => update.mutate({ id: m.id, status: 'APPROVED' })} />
                  <Button small variant="danger" title="Reject" disabled={busyId === m.id} onPress={() => update.mutate({ id: m.id, status: 'REJECTED' })} />
                </Row>
              )}
              {!locked && tab === 'APPROVED' && (
                <>
                  <Muted style={{ marginTop: 4, marginBottom: 6 }}>Role</Muted>
                  <Row>
                    {roles.map((r) => <Chip key={r} label={titleCase(r)} selected={m.role === r} onPress={() => changeRole(m, r)} />)}
                  </Row>
                  <Row style={{ marginTop: 10 }}>
                    <Button small variant="danger" title="Suspend" loading={busyId === m.id} onPress={() => suspend(m)} />
                  </Row>
                </>
              )}
            </Card>
          );
        }}
      />
    </Screen>
  );
}
