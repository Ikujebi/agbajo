import React, { useState } from 'react';
import { FlatList, Switch, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Badge, Card, Empty, Input, Muted, Row, Screen } from '../../components/ui';
import { colors } from '../../theme';
import type { Product } from '../../api/types';

export default function ShopsScreen() {
  const [q, setQ] = useState('');
  const [inStock, setInStock] = useState(true);
  const { data, isLoading, refetch, isRefetching } = useQuery<Product[]>({
    queryKey: ['products', q, inStock],
    queryFn: async () => (await api.get('/products', { params: { q: q || undefined, inStock: inStock ? 'true' : undefined } })).data,
  });

  return (
    <Screen scroll={false}>
      <Input placeholder="Search products…" value={q} onChangeText={setQ} />
      <Row style={{ marginBottom: 12 }}>
        <Switch value={inStock} onValueChange={setInStock} trackColor={{ true: colors.primary }} />
        <Text>Only show what's in stock</Text>
      </Row>
      <FlatList
        data={data ?? []} keyExtractor={(p) => p.id} onRefresh={refetch} refreshing={isRefetching}
        ListEmptyComponent={isLoading ? <Muted>Loading…</Muted> : <Empty text="No products found." />}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontWeight: '700', fontSize: 16 }}>{item.name}</Text>
                <Muted>{item.organization?.name}{item.organization?.city ? ` · ${item.organization.city}` : ''}</Muted>
              </View>
              <Text style={{ fontWeight: '800', fontSize: 16, color: colors.primary }}>₦{Number(item.price).toLocaleString()}</Text>
            </View>
            <View style={{ height: 6 }} />
            <Badge
              text={item.quantity > 0 ? `${item.quantity} ${item.unit ?? 'available'}` : 'Out of stock'}
              color={item.quantity > 5 ? colors.success : item.quantity > 0 ? colors.warn : colors.danger}
            />
          </Card>
        )}
      />
    </Screen>
  );
}
