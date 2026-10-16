import React, { useState } from 'react';
import { Alert } from 'react-native';
import { api, errMsg } from '../../api/client';
import { useAuth } from '../../store/auth';
import { Button, Input, Screen } from '../../components/ui';

export default function RegisterScreen() {
  const setSession = useAuth((s) => s.setSession);
  const [f, setF] = useState({ fullName: '', phone: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setLoading(true);
    try {
      const body = { ...f, email: f.email.trim() || undefined };
      const { data } = await api.post('/auth/register', body);
      await setSession(data.user, data.accessToken, data.refreshToken);
    } catch (e) {
      Alert.alert('Could not register', errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Input label="Full name" value={f.fullName} onChangeText={set('fullName')} />
      <Input label="Phone (e.g. 08012345678)" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
      <Input label="Email (optional)" value={f.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
      <Input label="Password (min 8 characters)" value={f.password} onChangeText={set('password')} secureTextEntry />
      <Button title="Create account" onPress={submit} loading={loading} disabled={!f.fullName || !f.phone || f.password.length < 8} />
    </Screen>
  );
}
