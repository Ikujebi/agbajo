import React, { useCallback } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { fmtDate } from '../../hooks';
import { useNav } from '../../navigation/types';
import { Badge, Button, Card, Empty, Muted, Screen } from '../../components/ui';
import { colors } from '../../theme';
import type { Pass } from '../../api/types';

const color = { ACTIVE: colors.success, COMPLETED: colors.muted, EXPIRED: colors.warn, REVOKED: colors.danger } as const;

export default function VisitorsScreen() {
  const nav = useNav();
  const { data, refetch } = useQuery<Pass[]>({ queryKey: ['passes'], queryFn: async () => (await api.get('/visitors/mine')).data });
  useFocusEffect(useCallback(() => { refetch(); }, []));

  return (
    <Screen scroll={false}>
      <Button title="+ New visitor pass" onPress={() => nav.navigate('CreatePass')} />
      <View style={{ height: 12 }} />
      <FlatList
        data={data ?? []} keyExtractor={(p) => p.id}
        ListEmptyComponent={<Empty text="No passes yet. Create one and share the code with your visitor." />}
        renderItem={({ item }) => (
          <Card onPress={() => nav.navigate('PassDetail', { pass: item })}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700', fontSize: 16 }}>{item.visitorName}</Text>
              <Badge text={item.status} color={color[item.status]} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '800', letterSpacing: 3, color: colors.primary, marginVertical: 4 }}>{item.code}</Text>
            <Muted>Until {fmtDate(item.validUntil)} · used {item.entriesUsed}/{item.maxEntries}</Muted>
          </Card>
        )}
      />
    </Screen>
  );
}
