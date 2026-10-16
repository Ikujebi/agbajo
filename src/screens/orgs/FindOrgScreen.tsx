import React, { useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errMsg } from '../../api/client';
import { Badge, Button, Card, Chip, Empty, Input, Muted, Row, Screen } from '../../components/ui';
import type { Membership, Org, OrgType } from '../../api/types';
import { useMemberships } from '../../hooks';

const TYPES: OrgType[] = ['ESTATE', 'CHURCH', 'MOSQUE'];

export default function FindOrgScreen() {
  const qc = useQueryClient();
  const [type, setType] = useState<OrgType>('ESTATE');
  const [q, setQ] = useState('');
  const [unit, setUnit] = useState('');
  const mine = useMemberships().data ?? [];

  const { data, isLoading } = useQuery<Org[]>({
    queryKey: ['orgs', type, q],
    queryFn: async () => (await api.get('/organizations', { params: { type, q: q || undefined } })).data,
  });

  const join = useMutation({
    mutationFn: (orgId: string) => api.post(`/organizations/${orgId}/join`, { unit: type === 'ESTATE' ? unit || undefined : undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mine'] }); Alert.alert('Request sent', 'The admin will review your request.'); },
    onError: (e) => Alert.alert('Could not join', errMsg(e)),
  });

  const status = (id: string) => mine.find((m: Membership) => m.organizationId === id)?.status;

  return (
    <Screen scroll={false}>
      <Row style={{ marginBottom: 12 }}>
        {TYPES.map((t) => <Chip key={t} label={t[0] + t.slice(1).toLowerCase()} selected={type === t} onPress={() => setType(t)} />)}
      </Row>
      <Input placeholder="Search by name" value={q} onChangeText={setQ} />
      {type === 'ESTATE' && <Input placeholder="Your house / flat number (e.g. Block B, Flat 4)" value={unit} onChangeText={setUnit} />}
      <FlatList
        data={data ?? []} keyExtractor={(o) => o.id}
        ListEmptyComponent={isLoading ? <Muted>Searching…</Muted> : <Empty text="Nothing found. Ask your admin to register it." />}
        renderItem={({ item }) => {
          const st = status(item.id);
          return (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ fontWeight: '700', fontSize: 16 }}>{item.name}</Text>
                  <Muted>{[item.address, item.city, item.state].filter(Boolean).join(', ')}</Muted>
                </View>
                {st ? <Badge text={st} /> : <Button small title="Join" onPress={() => join.mutate(item.id)} loading={join.isPending && join.variables === item.id} />}
              </View>
            </Card>
          );
        }}
      />
    </Screen>
  );
}
