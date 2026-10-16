import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { api, errMsg } from '../../api/client';
import { fmtDate } from '../../hooks';
import { Button, Card, Input, Muted, Row, Screen } from '../../components/ui';
import { colors } from '../../theme';
import type { RootParams } from '../../navigation/types';

type Result = { ok: boolean; title: string; lines: string[] };

export default function GateScreen() {
  const { orgId } = useRoute<RouteProp<RootParams, 'Gate'>>().params;
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [perm, requestPerm] = useCameraPermissions();

  const log = useQuery<any[]>({ queryKey: ['gatelog', orgId], queryFn: async () => (await api.get(`/visitors/log/${orgId}`)).data });

  const verify = async (c: string) => {
    setLoading(true);
    try {
      const { data } = await api.post('/visitors/verify', { organizationId: orgId, code: c });
      setResult({
        ok: true, title: `✅ ALLOW — ${data.visitorName}`,
        lines: [`Visiting: ${data.host.fullName}`, data.purpose ? `Purpose: ${data.purpose}` : '', `Entries used: ${data.pass.entriesUsed}/${data.pass.maxEntries}`].filter(Boolean),
      });
      setCode('');
      log.refetch();
    } catch (e) {
      setResult({ ok: false, title: '⛔ DENY', lines: [errMsg(e)] });
    } finally {
      setLoading(false);
    }
  };

  const exit = async () => {
    try {
      const { data } = await api.post('/visitors/exit', { organizationId: orgId, code });
      setResult({ ok: true, title: `👋 Exit logged — ${data.visitorName}`, lines: [] });
      setCode('');
      log.refetch();
    } catch (e) { Alert.alert('Error', errMsg(e)); }
  };

  const startScan = async () => {
    if (!perm?.granted) { const r = await requestPerm(); if (!r.granted) return; }
    setResult(null);
    setScanning(true);
  };

  return (
    <Screen>
      {scanning ? (
        <View style={{ marginBottom: 12 }}>
          <CameraView
            style={{ height: 280, borderRadius: 14, overflow: 'hidden' }}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => { setScanning(false); setCode(data); verify(data); }}
          />
          <View style={{ height: 8 }} />
          <Button title="Cancel scan" variant="outline" onPress={() => setScanning(false)} />
        </View>
      ) : (
        <Button title="📷 Scan QR code" onPress={startScan} />
      )}
      <View style={{ height: 12 }} />
      <Input label="Or type the code" value={code} onChangeText={(t) => setCode(t.toUpperCase())} autoCapitalize="characters" autoCorrect={false} maxLength={8} />
      <Row>
        <Button title="Verify entry" onPress={() => verify(code)} loading={loading} disabled={code.length < 4} />
        <Button title="Log exit" variant="outline" onPress={exit} disabled={code.length < 4} />
      </Row>

      {result && (
        <Card style={{ marginTop: 16, borderColor: result.ok ? colors.success : colors.danger, borderWidth: 2 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: result.ok ? colors.success : colors.danger }}>{result.title}</Text>
          {result.lines.map((l, i) => <Text key={i} style={{ marginTop: 4 }}>{l}</Text>)}
        </Card>
      )}

      <Text style={{ fontWeight: '700', marginTop: 20, marginBottom: 8 }}>Recent gate activity</Text>
      {(log.data ?? []).slice(0, 15).map((l) => (
        <Muted key={l.id} style={{ marginBottom: 4 }}>
          {l.action === 'ENTRY' ? '⬇️ In' : '⬆️ Out'} · {l.pass.visitorName} → {l.pass.host.fullName} · {fmtDate(l.createdAt)}
        </Muted>
      ))}
    </Screen>
  );
}
