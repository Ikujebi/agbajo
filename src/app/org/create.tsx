import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { api, errMsg } from '@/api/client';
import { qk } from '@/hooks/queries';
import { useToast } from '@/components/Toast';
import { Button, Chip, Input, Muted, Row, Screen } from '@/components/ui';
import { isEmail } from '@/lib/validators';
import { titleCase } from '@/lib/format';
import type { OrgType } from '@/api/types';

const TYPES: OrgType[] = ['ESTATE', 'SHOP', 'CHURCH', 'MOSQUE', 'ARTISAN', 'COMMUNITY_GROUP'];

export default function CreateOrgScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [type, setType] = useState<OrgType>('ESTATE');
  const [f, setF] = useState({ name: '', description: '', address: '', city: '', state: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const emailBad = f.email.trim() !== '' && !isEmail(f.email);
  const valid = f.name.trim().length >= 2 && !emailBad;

  const submit = async () => {
    if (!valid || loading) return;
    setLoading(true);
    try {
      const body: Record<string, string> = { type };
      (Object.entries(f) as [string, string][]).forEach(([k, v]) => { if (v.trim()) body[k] = v.trim(); });
      await api.post('/organizations', body);
      await qc.invalidateQueries({ queryKey: qk.mine });
      toast.show(`${f.name.trim()} registered`, 'success');
      router.back();
    } catch (e) {
      toast.show(errMsg(e), 'error');
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Muted style={{ marginBottom: 8 }}>You will become the owner and can approve members.</Muted>
      <Row style={{ marginBottom: 12 }}>
        {TYPES.map((t) => <Chip key={t} label={titleCase(t)} selected={type === t} onPress={() => setType(t)} />)}
      </Row>
      <Input label="Name" value={f.name} onChangeText={set('name')} />
      <Input label="Description" value={f.description} onChangeText={set('description')} multiline />
      <Input label="Address" value={f.address} onChangeText={set('address')} />
      <Input label="City" value={f.city} onChangeText={set('city')} />
      <Input label="State" value={f.state} onChangeText={set('state')} />
      <Input label="Phone" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
      <Input label="Email" value={f.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" error={emailBad ? 'That email does not look right' : ''} />
      <Button title="Register" onPress={submit} loading={loading} disabled={!valid} />
    </Screen>
  );
}
