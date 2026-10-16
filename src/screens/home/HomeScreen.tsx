import React, { useCallback } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useMemberships } from '../../hooks';
import { useAuth } from '../../store/auth';
import { useNav } from '../../navigation/types';
import { Badge, Button, Card, Empty, Muted, Row, Screen, Title } from '../../components/ui';
import { colors } from '../../theme';
import type { Membership } from '../../api/types';

const statusColor = { APPROVED: colors.success, PENDING: colors.warn, REJECTED: colors.danger, SUSPENDED: colors.danger } as const;

function Actions({ m }: { m: Membership }) {
  const nav = useNav();
  const o = m.organization;
  if (m.status !== 'APPROVED') {
    return <Muted>{m.status === 'PENDING' ? 'Waiting for admin approval' : `Membership ${m.status.toLowerCase()}`}</Muted>;
  }
  const isAdmin = m.role === 'ORG_ADMIN';
  return (
    <Row style={{ marginTop: 8 }}>
      {isAdmin && o.type !== 'SHOP' && <Button small variant="outline" title="Members" onPress={() => nav.navigate('Members', { orgId: o.id, name: o.name })} />}
      {isAdmin && o.type !== 'SHOP' && <Button small variant="outline" title="Email members" onPress={() => nav.navigate('Broadcast', { orgId: o.id, name: o.name })} />}
      {o.type === 'SHOP' && (isAdmin || m.role === 'STAFF') && <Button small title="Manage shop" onPress={() => nav.navigate('ManageShop', { orgId: o.id, name: o.name })} />}
      {o.type === 'ESTATE' && (isAdmin || m.role === 'SECURITY') && <Button small title="Open gate" onPress={() => nav.navigate('Gate', { orgId: o.id, name: o.name })} />}
    </Row>
  );
}

export default function HomeScreen() {
  const nav = useNav();
  const user = useAuth((s) => s.user);
  const { data, refetch, isLoading } = useMemberships();
  useFocusEffect(useCallback(() => { refetch(); }, []));

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', marginBottom: 4 }}>
        <Title>Hi, {user?.fullName.split(' ')[0]} 👋</Title>
        <Button small variant="outline" title="🔔" onPress={() => nav.navigate('Notifications')} />
      </Row>
      <Row style={{ marginBottom: 16 }}>
        <Button small title="Join estate / church / mosque" onPress={() => nav.navigate('FindOrg')} />
        <Button small variant="outline" title="Register one" onPress={() => nav.navigate('CreateOrg')} />
      </Row>

      <Text style={{ fontWeight: '700', marginBottom: 8, color: colors.text }}>My communities</Text>
      {isLoading ? <Muted>Loading…</Muted> : null}
      {data?.length === 0 && <Empty text="You haven't joined or registered anything yet." />}
      {data?.map((m) => (
        <Card key={m.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', fontSize: 16 }}>{m.organization.name}</Text>
              <Muted>{m.organization.type} · {m.role.replace('_', ' ')}{m.unit ? ` · ${m.unit}` : ''}</Muted>
            </View>
            <Badge text={m.status} color={statusColor[m.status]} />
          </View>
          <Actions m={m} />
        </Card>
      ))}
    </Screen>
  );
}
