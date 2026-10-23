import React, { useCallback } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errMsg } from '../../api/client';
import { useNav } from '../../navigation/types';
import { Button, Card, Empty, Muted, Row, Screen } from '../../components/ui';
import { colors } from '../../theme';
import type { ConversationItem } from '../../api/types';

export default function ChatListScreen() {
  const nav = useNav();
  const qc = useQueryClient();
  const convos = useQuery<ConversationItem[]>({ queryKey: ['convos'], queryFn: async () => (await api.get('/chat/conversations')).data });
  const reqs = useQuery<ConversationItem[]>({ queryKey: ['requests'], queryFn: async () => (await api.get('/chat/requests')).data });
  useFocusEffect(useCallback(() => { convos.refetch(); reqs.refetch(); }, []));

  const respond = useMutation({
    mutationFn: (v: { id: string; accept: boolean }) => api.post(`/chat/conversations/${v.id}/${v.accept ? 'accept' : 'decline'}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['convos'] }); qc.invalidateQueries({ queryKey: ['requests'] }); },
    onError: (e) => Alert.alert('Error', errMsg(e)),
  });

  const requestIds = new Set((reqs.data ?? []).map((r) => r.id));
  const list = (convos.data ?? []).filter((c) => !requestIds.has(c.id));

  return (
    <Screen scroll={false}>
      <Button title="+ New chat" onPress={() => nav.navigate('NewChat')} />
      <View style={{ height: 12 }} />
      <FlatList
        data={list} 
        keyExtractor={(c) => c.id}
        onRefresh={() => { convos.refetch(); reqs.refetch(); }} 
        refreshing={convos.isRefetching}
        ListHeaderComponent={
          (reqs.data?.length ?? 0) > 0 ? (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontWeight: '700', fontSize: 15, marginBottom: 8, color: colors.text }}>
                Message requests
              </Text>
              {reqs.data!.map((r) => (
                <Card key={r.id} onPress={() => nav.navigate('Chat', { recipientId: r.other.id, name: r.other.fullName, conversationId: r.id })}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>{r.other.fullName}</Text>
                  <Muted>{r.lastMessage?.body}</Muted>
                  <Row style={{ marginTop: 8 }}>
                    <Button small title="Accept" onPress={() => respond.mutate({ id: r.id, accept: true })} />
                    <Button small variant="danger" title="Decline" onPress={() => respond.mutate({ id: r.id, accept: false })} />
                  </Row>
                </Card>
              ))}
              <Text style={{ fontWeight: '700', fontSize: 15, marginVertical: 8, color: colors.text }}>
                Chats
              </Text>
            </View>
          ) : undefined
        }
        ListEmptyComponent={<Empty text="No chats yet. Start one with a neighbor or your estate admin." />}
        renderItem={({ item }) => (
          <Card onPress={() => nav.navigate('Chat', { recipientId: item.other.id, name: item.other.fullName, conversationId: item.id })}>
            <Text style={{ fontWeight: '700', fontSize: 16, color: colors.text }}>{item.other.fullName}</Text>
            <Muted>
              {item.status === 'REQUESTED' ? '⏳ Waiting for them to accept · ' : ''}
              {item.lastMessage?.body ?? ''}
            </Muted>
          </Card>
        )}
      />
    </Screen>
  );
}