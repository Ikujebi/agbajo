import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { api, errMsg } from '../../api/client';
import { Button, Chip, Input, Muted, Row, Screen } from '../../components/ui';
import { useNav } from '../../navigation/types';
import type { OrgType } from '../../api/types';

const TYPES: OrgType[] = ['ESTATE', 'SHOP', 'CHURCH', 'MOSQUE'];

export default function CreateOrgScreen() {
  const nav = useNav();
  const qc = useQueryClient();
  const [type, setType] = useState<OrgType>('ESTATE');
  const [f, setF] = useState({ name: '', description: '', address: '', city: '', state: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setLoading(true);
    try {
      const body: any = { type };
      Object.entries(f).forEach(([k, v]) => { if (v.trim()) body[k] = v.trim(); });
      await api.post('/organizations', body);
      await qc.invalidateQueries({ queryKey: ['mine'] });
      nav.goBack();
    } catch (e) {
      Alert.alert('Could not register', errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Muted style={{ marginBottom: 8 }}>You will become the admin.</Muted>
      <Row style={{ marginBottom: 12 }}>
        {TYPES.map((t) => <Chip key={t} label={t[0] + t.slice(1).toLowerCase()} selected={type === t} onPress={() => setType(t)} />)}
      </Row>
      <Input label="Name" value={f.name} onChangeText={set('name')} />
      <Input label="Description" value={f.description} onChangeText={set('description')} multiline />
      <Input label="Address" value={f.address} onChangeText={set('address')} />
      <Input label="City" value={f.city} onChangeText={set('city')} />
      <Input label="State" value={f.state} onChangeText={set('state')} />
      <Input label="Phone" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
      <Input label="Email" value={f.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
      <Button title="Register" onPress={submit} loading={loading} disabled={f.name.trim().length < 2} />
    </Screen>
  );
}
