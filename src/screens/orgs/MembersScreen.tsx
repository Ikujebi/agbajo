import React, { useState } from 'react';
import { Alert, FlatList, Text } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errMsg } from '../../api/client';
import { useAuth } from '../../store/auth';
import { Badge, Button, Card, Chip, Empty, Muted, Row, Screen } from '../../components/ui';
import type { RootParams } from '../../navigation/types';
import type { Member } from '../../api/types';

export default function MembersScreen() {
  const { orgId } = useRoute<RouteProp<RootParams, 'Members'>>().params;
  const me = useAuth((s) => s.user)!;
  const qc = useQueryClient();
  const [tab, setTab] = useState<'PENDING' | 'APPROVED'>('PENDING');

  const { data } = useQuery<Member[]>({
    queryKey: ['members', orgId, tab],
    queryFn: async () => (await api.get(`/organizations/${orgId}/members`, { params: { status: tab } })).data,
  });

  const update = useMutation({
    mutationFn: (v: { id: string; status: string; role?: string }) =>
      api.patch(`/organizations/${orgId}/members/${v.id}`, { status: v.status, ...(v.role && { role: v.role }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', orgId] }),
    onError: (e) => Alert.alert('Error', errMsg(e)),
  });

  return (
    <Screen scroll={false}>
      <Row style={{ marginBottom: 12 }}>
        <Chip label="Pending requests" selected={tab === 'PENDING'} onPress={() => setTab('PENDING')} />
        <Chip label="Members" selected={tab === 'APPROVED'} onPress={() => setTab('APPROVED')} />
      </Row>
      <FlatList
        data={data ?? []} keyExtractor={(m) => m.id}
        ListEmptyComponent={<Empty text={tab === 'PENDING' ? 'No pending requests.' : 'No members yet.'} />}
        renderItem={({ item: m }) => (
          <Card>
            <Text style={{ fontWeight: '700', fontSize: 16 }}>{m.user.fullName}</Text>
            <Muted>{m.user.phone}{m.unit ? ` · ${m.unit}` : ''}</Muted>
            <Row style={{ marginVertical: 6 }}><Badge text={m.role.replace('_', ' ')} /></Row>
            {m.user.id !== me.id && (
              <Row>
                {tab === 'PENDING' ? (
                  <>
                    <Button small title="Approve" onPress={() => update.mutate({ id: m.id, status: 'APPROVED' })} />
                    <Button small variant="danger" title="Reject" onPress={() => update.mutate({ id: m.id, status: 'REJECTED' })} />
                  </>
                ) : (
                  <>
                    {m.role === 'SECURITY' ? (
                      <Button small variant="outline" title="Make resident" onPress={() => update.mutate({ id: m.id, status: 'APPROVED', role: 'RESIDENT' })} />
                    ) : (
                      <Button small variant="outline" title="Make security" onPress={() => update.mutate({ id: m.id, status: 'APPROVED', role: 'SECURITY' })} />
                    )}
                    <Button small variant="outline" title="Make admin" onPress={() => Alert.alert('Make admin?', `${m.user.fullName} will have full control.`, [{ text: 'Cancel' }, { text: 'Confirm', onPress: () => update.mutate({ id: m.id, status: 'APPROVED', role: 'ORG_ADMIN' }) }])} />
                    <Button small variant="danger" title="Suspend" onPress={() => update.mutate({ id: m.id, status: 'SUSPENDED' })} />
                  </>
                )}
              </Row>
            )}
          </Card>
        )}
      />
    </Screen>
  );
}
