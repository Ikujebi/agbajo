import React, { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, errMsg } from '@/api/client';
import { useMemberships, useOrgSearch, qk } from '@/hooks/queries';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/components/Toast';
import { Badge, Button, Card, Chip, Empty, ErrorState, Input, Loading, Muted, Row, Screen } from '@/components/ui';
import { titleCase } from '@/lib/format';
import type { OrgType } from '@/api/types';

const TYPES: OrgType[] = ['ESTATE', 'CHURCH', 'MOSQUE', 'COMMUNITY_GROUP'];

export default function FindOrgScreen() {
  const qc = useQueryClient();
  const toast = useToast();
  const [type, setType] = useState<OrgType>('ESTATE');
  const [q, setQ] = useState('');
  const [unit, setUnit] = useState('');
  const dq = useDebounce(q.trim());
  const mine = useMemberships().data ?? [];
  const { data, isLoading, isError, error, refetch } = useOrgSearch(type, dq);

  const join = useMutation({
    mutationFn: (orgId: string) => api.post(`/organizations/${orgId}/join`, { unit: type === 'ESTATE' ? unit.trim() || undefined : undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.mine });
      toast.show('Request sent. An admin will review it.', 'success');
    },
    onError: (e) => toast.show(errMsg(e), 'error'),
  });

  const statusOf = (id: string) => mine.find((m) => m.organizationId === id)?.status;

  return (
    <Screen scroll={false}>
      <Row style={{ marginBottom: 12 }}>
        {TYPES.map((t) => <Chip key={t} label={titleCase(t)} selected={type === t} onPress={() => setType(t)} />)}
      </Row>
      <Input placeholder="Search by name" value={q} onChangeText={setQ} autoCorrect={false} />
      {type === 'ESTATE' && <Input placeholder="Your house / flat (e.g. Block B, Flat 4)" value={unit} onChangeText={setUnit} />}
      {isError ? <ErrorState message={errMsg(error)} onRetry={refetch} /> : null}
      <FlatList
        data={data ?? []}
        keyExtractor={(o) => o.id}
        keyboardShouldPersistTaps="handled"
ListEmptyComponent={
  isLoading ? (
    <Loading text="Searching…" />
  ) : isError ? (
    undefined
  ) : (
    <Empty text="Nothing found. Ask your admin to register it." />
  )
}        renderItem={({ item }) => {
          const st = statusOf(item.id);
          return (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ fontWeight: '700', fontSize: 16 }}>{item.name}{item.isVerified ? '  ✔︎' : ''}</Text>
                  <Muted>{[item.address, item.city, item.state].filter(Boolean).join(', ')}</Muted>
                </View>
                {st ? (
                  <Badge text={titleCase(st)} />
                ) : (
                  <Button small title="Join" onPress={() => join.mutate(item.id)} loading={join.isPending && join.variables === item.id} />
                )}
              </View>
            </Card>
          );
        }}
      />
    </Screen>
  );
}
