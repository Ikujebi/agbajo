import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { io, Socket } from 'socket.io-client';
import { API_URL, api, errMsg } from '../../api/client';
import { useAuth } from '../../store/auth';
import { colors } from '../../theme';
import { useNav } from '../../navigation/types';
import type { RootParams } from '../../navigation/types';
import type { Message } from '../../api/types';

export default function ChatScreen() {
  const { recipientId, name, conversationId } = useRoute<RouteProp<RootParams, 'Chat'>>().params;
  const nav = useNav();
  const me = useAuth((s) => s.user)!;
  const [convoId, setConvoId] = useState<string | undefined>(conversationId);
  const [messages, setMessages] = useState<Message[]>([]); // newest first (inverted list)
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const socketRef = useRef<Socket | null>(null);

  const addMessage = (m: Message) => setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [m, ...prev]));

  useEffect(() => { nav.setOptions({ headerShown: true, title: name }); }, [name]);

  // find an existing conversation with this person
  useEffect(() => {
    if (convoId) return;
    api.get('/chat/conversations').then((r) => {
      const c = r.data.find((x: any) => x.other.id === recipientId);
      if (c) setConvoId(c.id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!convoId) return;
    api.get(`/chat/conversations/${convoId}/messages`).then((r) => setMessages(r.data)).catch((e) => setError(errMsg(e)));
  }, [convoId]);

  useEffect(() => {
    const socket = io(`${API_URL}/chat`, { auth: { token: useAuth.getState().accessToken }, transports: ['websocket'] });
    socketRef.current = socket;
    socket.on('message:new', ({ message, conversation }: { message: Message; conversation: { id: string; userAId: string; userBId: string } }) => {
      if (![conversation.userAId, conversation.userBId].includes(recipientId)) return; // another chat
      setConvoId(conversation.id);
      addMessage(message);
    });
    return () => { socket.disconnect(); };
  }, []);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText(''); setError('');
    try {
      const socket = socketRef.current;
      if (socket?.connected) {
        const ack: any = await socket.timeout(8000).emitWithAck('message:send', { recipientId, text: body });
        if (!ack.ok) { setError(ack.error); setText(body); return; }
        setConvoId(ack.conversation.id);
        addMessage(ack.message);
      } else {
        const { data } = await api.post('/chat/send', { recipientId, text: body });
        setConvoId(data.conversation.id);
        addMessage(data.message);
      }
    } catch (e) {
      setError(errMsg(e)); setText(body);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          inverted data={messages} keyExtractor={(m) => m.id} contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => {
            const mine = item.senderId === me.id;
            return (
              <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%', marginBottom: 6, backgroundColor: mine ? colors.primary : '#fff', borderRadius: 16, padding: 10, borderWidth: mine ? 0 : 1, borderColor: colors.border }}>
                <Text style={{ color: mine ? '#fff' : colors.text }}>{item.body}</Text>
                <Text style={{ color: mine ? '#ffffffaa' : colors.muted, fontSize: 10, marginTop: 2, alignSelf: 'flex-end' }}>
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            );
          }}
        />
        {error ? <Text style={{ color: colors.danger, paddingHorizontal: 12, paddingBottom: 4 }}>{error}</Text> : null}
        <View style={{ flexDirection: 'row', padding: 8, gap: 8, alignItems: 'flex-end' }}>
          <TextInput
            value={text} onChangeText={setText} placeholder="Message" placeholderTextColor={colors.muted} multiline
            style={{ flex: 1, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 120 }}
          />
          <Pressable onPress={send} style={{ backgroundColor: colors.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
