import React from 'react';
import { Alert, Share, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { api, errMsg } from '../../api/client';
import { fmtDate, useMemberships } from '../../hooks';
import { useNav } from '../../navigation/types';
import { Button, Card, Muted, Screen } from '../../components/ui';
import { colors } from '../../theme';
import type { RootParams } from '../../navigation/types';
import type { Pass } from '../../api/types';

export default function PassDetailScreen() {
  const nav = useNav();
  const qc = useQueryClient();

  const route = useRoute<RouteProp<RootParams, 'PassDetail'>>();
  const pass = route.params.pass;
  const passCode = (pass as Pass & { code?: string }).code;

  const estate = useMemberships().data?.find((m) => m.organizationId === pass.organizationId)?.organization.name;

  const share = () =>
    Share.share({
      message: passCode
        ? `Hello ${pass.visitorName}, your visitor code for ${estate ?? 'the estate'} is ${passCode}. Show it to security at the gate. Valid until ${fmtDate(pass.validUntil)}.`
        : `Hello ${pass.visitorName}, your visitor pass is valid until ${fmtDate(pass.validUntil)}. Please contact your host for the visitor code.`,
    });

  const revoke = () =>
    Alert.alert('Revoke this pass?', 'The code will stop working immediately.', [
      { text: 'Cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.patch(`/visitors/${pass.id}/revoke`);
            qc.invalidateQueries({ queryKey: ['passes'] });
            nav.goBack();
          } catch (e) {
            Alert.alert('Error', errMsg(e));
          }
        },
      },
    ]);

  return (
    <Screen>
      <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>{pass.visitorName}</Text>

        {passCode ? (
          <>
            <Text
              style={{
                fontSize: 40,
                fontWeight: '800',
                letterSpacing: 6,
                color: colors.primary,
                marginVertical: 12,
              }}
            >
              {passCode}
            </Text>
            <QRCode value={passCode} size={170} />
          </>
        ) : (
          <Text>Visitor code is unavailable. Please contact your host.</Text>
        )}

        <View style={{ height: 12 }} />
        <Muted>Valid until {fmtDate(pass.validUntil)}</Muted>
        <Muted>Entries: {pass.entriesUsed}/{pass.maxEntries} · {pass.status}</Muted>
      </Card>

      {passCode ? <Button title="Share code" onPress={share} /> : null}
      <View style={{ height: 10 }} />
      {pass.status === 'ACTIVE' && <Button title="Revoke pass" variant="danger" onPress={revoke} />}
    </Screen>
  );
}