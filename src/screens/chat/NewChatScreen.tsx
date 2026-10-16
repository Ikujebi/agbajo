import React, { useState } from 'react';
import { FlatList, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useMemberships } from '../../hooks';
import { useNav } from '../../navigation/types';
import { Card, Chip, Empty, Input, Muted, Row, Screen } from '../../components/ui';

type Person = { id: string; fullName: string; unit?: string | null; role?: string };

export default function NewChatScreen() {
  const nav = useNav();
  const [q, setQ] = useState('');
  const orgs = (useMemberships().data ?? []).filter((m) => m.status === 'APPROVED');
  const [orgId, setOrgId] = useState<string | null>(null);
  const selected = orgId ?? orgs[0]?.organizationId;
  const searching = q.trim().length >= 3;

  const search = useQuery<Person[]>({
    queryKey: ['user-search', q], enabled: searching,
    queryFn: async () => (await api.get('/users/search', { params: { q: q.trim() } })).data,
  });
  const dir = useQuery<Person[]>({
    queryKey: ['directory', selected], enabled: !searching && !!selected,
    queryFn: async () => (await api.get(`/users/directory/${selected}`)).data,
  });

  const people = (searching ? search.data : dir.data) ?? [];

  return (
    <Screen scroll={false}>
      <Input placeholder="Search anyone by name or phone number" value={q} onChangeText={setQ} />
      {!searching && orgs.length > 0 && (
        <Row style={{ marginBottom: 12 }}>
          {orgs.map((m) => <Chip key={m.id} label={m.organization.name} selected={selected === m.organizationId} onPress={() => setOrgId(m.organizationId)} />)}
        </Row>
      )}
      <FlatList
        data={people} keyExtractor={(p) => p.id}
        ListEmptyComponent={<Empty text={searching ? 'No one found.' : 'Type at least 3 letters to search, or pick a community above.'} />}
        renderItem={({ item }) => (
          <Card onPress={() => nav.replace('Chat', { recipientId: item.id, name: item.fullName })}>
            <Text style={{ fontWeight: '700', fontSize: 16 }}>{item.fullName}</Text>
            {(item.unit || item.role) && <Muted>{[item.unit, item.role?.replace('_', ' ')].filter(Boolean).join(' · ')}</Muted>}
          </Card>
        )}
      />
    </Screen>
  );
}
