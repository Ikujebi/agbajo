import React, { useCallback } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useMemberships } from '../../hooks';
import { useAuth } from '../../store/auth';
import { useNav } from '../../navigation/types';
import { Badge, Button, Card, Empty, Muted, Row, Screen, Title } from '../../components/ui';
import { colors } from '../../theme';
import type { Membership, MembershipRole, MembershipStatus } from '../../api/types';

// Safe status badge color mapping
const statusColor: Record<MembershipStatus, string> = {
  APPROVED: colors.success,
  PENDING: colors.accent ?? colors.muted,
  REJECTED: colors.danger,
  SUSPENDED: colors.danger,
};

const ADMIN_ROLES: MembershipRole[] = [
  'OWNER',
  'CHAIRMAN',
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGER',
];

function Actions({ m }: { m: Membership }) {
  const nav = useNav();
  const o = m.organization;

  if (m.status !== 'APPROVED') {
    return (
      <Muted style={{ marginTop: 8 }}>
        {m.status === 'PENDING' ? 'Waiting for admin approval' : `Membership ${m.status.toLowerCase()}`}
      </Muted>
    );
  }

  const isAdmin = ADMIN_ROLES.includes(m.role);

  return (
    <Row style={{ marginTop: 8, flexWrap: 'wrap', gap: 6 }}>
      {isAdmin && o.type !== 'SHOP' && (
        <Button
          small
          variant="outline"
          title="Members"
          onPress={() => nav.navigate('Members', { orgId: o.id, name: o.name })}
        />
      )}
      {isAdmin && o.type !== 'SHOP' && (
        <Button
          small
          variant="outline"
          title="Email members"
          onPress={() => nav.navigate('Broadcast', { orgId: o.id, name: o.name })}
        />
      )}
      {o.type === 'SHOP' && (isAdmin || m.role === 'STAFF') && (
        <Button
          small
          title="Manage shop"
          onPress={() => nav.navigate('ManageShop', { orgId: o.id, name: o.name })}
        />
      )}
      {o.type === 'ESTATE' && (isAdmin || m.role === 'SECURITY') && (
        <Button
          small
          title="Open gate"
          onPress={() => nav.navigate('Gate', { orgId: o.id, name: o.name })}
        />
      )}
    </Row>
  );
}

export default function HomeScreen() {
  const nav = useNav();
  const user = useAuth((s) => s.user);
  const { data, refetch, isLoading } = useMemberships();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'there';

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Title>Hi, {firstName} 👋</Title>
        <Button
          small
          variant="outline"
          title="🔔"
          onPress={() => nav.navigate('Notifications')}
        />
      </Row>

      <Row style={{ marginBottom: 16, gap: 8 }}>
        <Button
          small
          title="Join community"
          onPress={() => nav.navigate('FindOrg')}
        />
        <Button
          small
          variant="outline"
          title="Register one"
          onPress={() => nav.navigate('CreateOrg')}
        />
      </Row>

      <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 8, color: colors.text }}>
        My communities
      </Text>

      {isLoading ? <Muted>Loading communities…</Muted> : null}

      {!isLoading && data?.length === 0 && (
        <Empty text="You haven't joined or registered any community yet." />
      )}

      {data?.map((m) => {
        const badgeColor = statusColor[m.status] ?? colors.muted;

        return (
          <Card key={m.id} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontWeight: '700', fontSize: 16, color: colors.text }}>
                  {m.organization.name}
                </Text>
                <Muted style={{ marginTop: 2 }}>
                  {m.organization.type} · {m.role.replace(/_/g, ' ')}
                  {m.unit ? ` · ${m.unit}` : ''}
                </Muted>
              </View>
              <Badge text={m.status} color={badgeColor} />
            </View>
            <Actions m={m} />
          </Card>
        );
      })}
    </Screen>
  );
}