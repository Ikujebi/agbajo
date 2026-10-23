import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api, errMsg } from '@/api/client';
import { useToast } from '@/components/Toast';
import { Button, Input, Muted, Screen } from '@/components/ui';

export default function BroadcastScreen() {
  const { orgId } = useLocalSearchParams<{ orgId: string }>();
  const router = useRouter();
  const toast = useToast();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/organizations/${orgId}/broadcast-email`, { subject: subject.trim(), body: body.trim() });
      toast.show(`Delivered to ${data.sent} of ${data.recipients} members with an email`, 'success');
      router.back();
    } catch (e) {
      toast.show(errMsg(e), 'error');
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Muted style={{ marginBottom: 12 }}>Goes to every approved member who has an email on file.</Muted>
      <Input label="Subject" value={subject} onChangeText={setSubject} />
      <Input label="Message" value={body} onChangeText={setBody} multiline style={{ height: 160 }} />
      <Button title="Send email" onPress={send} loading={loading} disabled={subject.trim().length < 2 || body.trim().length < 2} />
    </Screen>
  );
}
