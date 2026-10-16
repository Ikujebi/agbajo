import React, { useState } from 'react';
import { Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { api, errMsg } from '../../api/client';
import { Button, Input, Muted, Screen } from '../../components/ui';
import { useNav } from '../../navigation/types';
import type { RootParams } from '../../navigation/types';

export default function BroadcastScreen() {
  const { orgId, name } = useRoute<RouteProp<RootParams, 'Broadcast'>>().params;
  const nav = useNav();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(`/organizations/${orgId}/broadcast-email`, { subject, body });
      Alert.alert('Sent', `Delivered to ${data.sent} of ${data.recipients} members with an email address.`, [{ text: 'OK', onPress: () => nav.goBack() }]);
    } catch (e) {
      Alert.alert('Could not send', errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Muted style={{ marginBottom: 12 }}>Goes to every approved member of {name} who has an email on file.</Muted>
      <Input label="Subject" value={subject} onChangeText={setSubject} />
      <Input label="Message" value={body} onChangeText={setBody} multiline style={{ height: 160 }} />
      <Button title="Send email" onPress={send} loading={loading} disabled={subject.trim().length < 2 || body.trim().length < 2} />
    </Screen>
  );
}
