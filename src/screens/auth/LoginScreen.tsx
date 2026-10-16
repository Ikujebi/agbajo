import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, errMsg } from '../../api/client';
import { useAuth } from '../../store/auth';
import { Button, Input, Muted } from '../../components/ui';
import { useNav } from '../../navigation/types';
import { colors } from '../../theme';

export default function LoginScreen() {
  const nav = useNav();
  const setSession = useAuth((s) => s.setSession);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { identifier, password });
      await setSession(data.user, data.accessToken, data.refreshToken);
    } catch (e) {
      Alert.alert('Login failed', errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 30, fontWeight: '800', color: colors.primary }}>Neighborhood</Text>
      <Muted style={{ marginBottom: 24 }}>Your estate, church, mosque and local shops in one app.</Muted>
      <Input label="Phone or email" value={identifier} onChangeText={setIdentifier} autoCapitalize="none" keyboardType="email-address" />
      <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Log in" onPress={submit} loading={loading} disabled={!identifier || !password} />
      <View style={{ height: 12 }} />
      <Button title="Create an account" variant="outline" onPress={() => nav.navigate('Register')} />
    </SafeAreaView>
  );
}
