import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errMsg } from '../../api/client';
import { Button, Card, Input, Muted, Row, Screen } from '../../components/ui';
import { colors } from '../../theme';
import type { RootParams } from '../../navigation/types';
import type { Product } from '../../api/types';

export default function ManageShopScreen() {
  const { orgId } = useRoute<RouteProp<RootParams, 'ManageShop'>>().params;
  const qc = useQueryClient();
  const [f, setF] = useState({ name: '', price: '', quantity: '', unit: '' });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['shop-products', orgId] }); qc.invalidateQueries({ queryKey: ['products'] }); };

  const { data } = useQuery<Product[]>({
    queryKey: ['shop-products', orgId],
    queryFn: async () => (await api.get('/products', { params: { orgId } })).data,
  });

  const add = useMutation({
    mutationFn: () => api.post(`/shops/${orgId}/products`, {
      name: f.name.trim(), price: Number(f.price), quantity: parseInt(f.quantity || '0', 10), unit: f.unit.trim() || undefined,
    }),
    onSuccess: () => { setF({ name: '', price: '', quantity: '', unit: '' }); refresh(); },
    onError: (e) => Alert.alert('Could not add product', errMsg(e)),
  });

  const stock = useMutation({
    mutationFn: (v: { id: string; delta: number }) => api.post(`/products/${v.id}/stock`, { delta: v.delta, reason: v.delta > 0 ? 'Restock' : 'Sale / removal' }),
    onSuccess: refresh,
    onError: (e) => Alert.alert('Error', errMsg(e)),
  });

  const valid = f.name.trim().length >= 2 && f.price !== '' && !isNaN(Number(f.price));

  return (
    <Screen>
      <Card>
        <Text style={{ fontWeight: '700', marginBottom: 8 }}>Add product</Text>
        <Input placeholder="Name" value={f.name} onChangeText={(v) => setF({ ...f, name: v })} />
        <Row>
          <View style={{ flex: 1 }}><Input placeholder="Price (₦)" value={f.price} onChangeText={(v) => setF({ ...f, price: v })} keyboardType="decimal-pad" /></View>
          <View style={{ flex: 1 }}><Input placeholder="Qty" value={f.quantity} onChangeText={(v) => setF({ ...f, quantity: v })} keyboardType="number-pad" /></View>
        </Row>
        <Input placeholder="Unit (e.g. bag, bottle) – optional" value={f.unit} onChangeText={(v) => setF({ ...f, unit: v })} />
        <Button title="Add to shop" onPress={() => add.mutate()} loading={add.isPending} disabled={!valid} />
      </Card>

      <Text style={{ fontWeight: '700', marginVertical: 8 }}>Stock</Text>
      {data?.length === 0 && <Muted>No products yet.</Muted>}
      {data?.map((p) => (
        <Card key={p.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '700' }}>{p.name}</Text>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>₦{Number(p.price).toLocaleString()}</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', marginVertical: 6 }}>{p.quantity} <Muted>{p.unit ?? 'in stock'}</Muted></Text>
          <Row>
            <Button small variant="outline" title="−1" onPress={() => stock.mutate({ id: p.id, delta: -1 })} disabled={p.quantity < 1} />
            <Button small variant="outline" title="+1" onPress={() => stock.mutate({ id: p.id, delta: 1 })} />
            <Button small variant="outline" title="+10" onPress={() => stock.mutate({ id: p.id, delta: 10 })} />
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
