import React from 'react';
import { FlatList, Text } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';
import { fmtDate } from '../../hooks';
import { Card, Empty, Muted, Screen } from '../../components/ui';
import type { Notif } from '../../api/types';

export default function NotificationsScreen() {
  const qc = useQueryClient();
  const { data } = useQuery<Notif[]>({ queryKey: ['notifs'], queryFn: async () => (await api.get('/users/notifications')).data });
  useFocusEffect(React.useCallback(() => () => { api.post('/users/notifications/read-all').then(() => qc.invalidateQueries({ queryKey: ['notifs'] })); }, []));
  return (
    <Screen scroll={false}>
      <FlatList
        data={data ?? []} keyExtractor={(n) => n.id}
        ListEmptyComponent={<Empty text="No notifications yet." />}
        renderItem={({ item }) => (
          <Card style={item.readAt ? undefined : { borderColor: '#0F766E' }}>
            <Text style={{ fontWeight: '700' }}>{item.title}</Text>
            <Text>{item.body}</Text>
            <Muted>{fmtDate(item.createdAt)}</Muted>
          </Card>
        )}
      />
    </Screen>
  );
}
