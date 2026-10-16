import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { api, errMsg } from '../../api/client';
import { useAuth } from '../../store/auth';
import { queryClient } from '../../queryClient';
import { Button, Card, Muted, Screen, Title } from '../../components/ui';
import { colors } from '../../theme';
import type { ChatPrivacy } from '../../api/types';

const OPTIONS: { value: ChatPrivacy; title: string; desc: string }[] = [
  { value: 'EVERYONE', title: 'Everyone', desc: 'Anyone on the app can message me.' },
  { value: 'MY_ORGS_ONLY', title: 'My communities only', desc: 'Only people in my estate / church / mosque.' },
  { value: 'REQUEST_ONLY', title: 'By request', desc: 'Anyone can ask, but I must accept before they can chat. If I message first, they can reply.' },
  { value: 'ADMINS_ONLY', title: 'Admins only', desc: 'Only my estate or community admins can start a chat with me.' },
];

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuth();
  if (!user) return null;

  const choose = async (chatPrivacy: ChatPrivacy) => {
    try {
      await api.patch('/chat/privacy', { chatPrivacy });
      await setUser({ ...user, chatPrivacy });
    } catch (e) { Alert.alert('Error', errMsg(e)); }
  };

  return (
    <Screen>
      <Title>{user.fullName}</Title>
      <Muted style={{ marginBottom: 16 }}>{user.phone}{user.email ? ` · ${user.email}` : ''}</Muted>

      <Text style={{ fontWeight: '700', marginBottom: 8 }}>Who can message me?</Text>
      {OPTIONS.map((o) => {
        const on = user.chatPrivacy === o.value;
        return (
          <Pressable key={o.value} onPress={() => choose(o.value)}>
            <Card style={{ borderColor: on ? colors.primary : colors.border, borderWidth: on ? 2 : 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700' }}>{o.title}</Text>
                {on && <Text style={{ color: colors.primary }}>✓</Text>}
              </View>
              <Muted>{o.desc}</Muted>
            </Card>
          </Pressable>
        );
      })}
      <View style={{ height: 12 }} />
      <Button
        title="Log out" variant="outline"
        onPress={async () => {
          const rt = useAuth.getState().refreshToken;
          try { if (rt) await api.post('/auth/logout', { refreshToken: rt }); } catch {}
          queryClient.clear();
          await logout();
        }}
      />
    </Screen>
  );
}
