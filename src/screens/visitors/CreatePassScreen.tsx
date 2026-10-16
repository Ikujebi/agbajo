import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { api, errMsg } from '../../api/client';
import { useMemberships } from '../../hooks';
import { useNav } from '../../navigation/types';
import { Button, Chip, Input, Muted, Row, Screen } from '../../components/ui';
import { Text } from 'react-native';

const DURATIONS = [
  { label: '2 hours', h: 2 }, { label: '12 hours', h: 12 }, { label: '24 hours', h: 24 }, { label: '7 days', h: 168 },
];

export default function CreatePassScreen() {
  const nav = useNav();
  const qc = useQueryClient();
  const estates = (useMemberships().data ?? []).filter(
    (m) => m.organization.type === 'ESTATE' && m.status === 'APPROVED' && ['RESIDENT', 'ORG_ADMIN'].includes(m.role),
  );
  const [orgId, setOrgId] = useState<string | null>(null);
  const [visitorName, setName] = useState('');
  const [visitorPhone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [hours, setHours] = useState(12);
  const [maxEntries, setMax] = useState(1);
  const [loading, setLoading] = useState(false);
  const selected = orgId ?? estates[0]?.organizationId;

  if (!estates.length) {
    return <Screen><Muted>You need to be an approved resident of an estate to create visitor passes. Join your estate from the Home tab.</Muted></Screen>;
  }

  const submit = async () => {
    setLoading(true);
    try {
      const now = Date.now();
      const { data } = await api.post('/visitors', {
        organizationId: selected, visitorName, visitorPhone: visitorPhone || undefined, purpose: purpose || undefined,
        validFrom: new Date(now).toISOString(), validUntil: new Date(now + hours * 3600_000).toISOString(), maxEntries,
      });
      qc.invalidateQueries({ queryKey: ['passes'] });
      nav.replace('PassDetail', { pass: data });
    } catch (e) {
      Alert.alert('Could not create pass', errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      {estates.length > 1 && (
        <>
          <Text style={{ fontWeight: '600', marginBottom: 6 }}>Estate</Text>
          <Row style={{ marginBottom: 12 }}>
            {estates.map((m) => <Chip key={m.id} label={m.organization.name} selected={selected === m.organizationId} onPress={() => setOrgId(m.organizationId)} />)}
          </Row>
        </>
      )}
      <Input label="Visitor name" value={visitorName} onChangeText={setName} />
      <Input label="Visitor phone (optional)" value={visitorPhone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Input label="Purpose (optional)" value={purpose} onChangeText={setPurpose} />
      <Text style={{ fontWeight: '600', marginBottom: 6 }}>Valid for</Text>
      <Row style={{ marginBottom: 12 }}>
        {DURATIONS.map((d) => <Chip key={d.h} label={d.label} selected={hours === d.h} onPress={() => setHours(d.h)} />)}
      </Row>
      <Text style={{ fontWeight: '600', marginBottom: 6 }}>Number of entries</Text>
      <Row style={{ marginBottom: 16 }}>
        {[1, 2, 5, 10].map((n) => <Chip key={n} label={String(n)} selected={maxEntries === n} onPress={() => setMax(n)} />)}
      </Row>
      <Button title="Generate code" onPress={submit} loading={loading} disabled={visitorName.trim().length < 2} />
    </Screen>
  );
}
