
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius } from '@/lib/theme';

type Shop = {
  id: string;
  name: string;
  category: string;
  rating: string;
  phone: string;
  location: string;
  isOpen: boolean;
};

const SHOPS_DATA: Shop[] = [
  {
    id: '1',
    name: 'Adugbo Mart & Groceries',
    category: 'Supermarket',
    rating: '4.9 ★',
    phone: '08012345678',
    location: 'Block C, Estate Hub',
    isOpen: true,
  },
  {
    id: '2',
    name: 'Speedy Clean Laundry',
    category: 'Dry Cleaning',
    rating: '4.7 ★',
    phone: '08098765432',
    location: 'Shop 4, Gate A Mall',
    isOpen: true,
  },
  {
    id: '3',
    name: 'PharmaPlus Estate Chemist',
    category: 'Pharmacy',
    rating: '5.0 ★',
    phone: '08033445566',
    location: 'Central Plaza',
    isOpen: false,
  },
];

export default function ShopsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const filteredShops = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return SHOPS_DATA;

    return SHOPS_DATA.filter((shop) =>
      [
        shop.name,
        shop.category,
        shop.location,
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [search]);

  const callShop = useCallback(async (phone: string) => {
    const url = `tel:${phone}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          'Unable to make a call',
          'Your device cannot open the phone dialer.',
        );
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'Unable to make a call',
        'Please try again or dial the number manually.',
      );
    }
  }, []);

  const renderShop = useCallback(
    ({ item }: { item: Shop }) => (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.shopMeta}>
            <Text style={styles.shopName}>{item.name}</Text>

            <Text style={styles.categoryText}>
              {item.category}
            </Text>

            <Text style={styles.locationText}>
              {item.location}
            </Text>
          </View>

          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.statusWrap}>
            <View
              style={[
                styles.statusDot,
                item.isOpen ? styles.dotOpen : styles.dotClosed,
              ]}
            />

            <Text
              style={[
                styles.statusLabel,
                item.isOpen ? styles.openText : styles.closedText,
              ]}
            >
              {item.isOpen ? 'Open now' : 'Closed'}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.callBtn,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => callShop(item.phone)}
            accessibilityRole="button"
            accessibilityLabel={`Call ${item.name} at ${item.phone}`}
          >
            <Text style={styles.callIcon}>☎</Text>
            <Text style={styles.callBtnText}>Call shop</Text>
          </Pressable>
        </View>
      </View>
    ),
    [callShop],
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={filteredShops}
        keyExtractor={(item) => item.id}
        renderItem={renderShop}
        contentContainerStyle={[
          styles.listContainer,
          {
            paddingTop: Math.max(insets.top, 20) + 12,
            paddingBottom: Math.max(insets.bottom, 20) + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.eyebrow}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.eyebrowText}>
                YOUR COMMUNITY MARKETPLACE
              </Text>
            </View>

            <Text style={styles.title}>Shops & Services</Text>

            <Text style={styles.subtitle}>
              Discover local vendors and essential services in your
              community.
            </Text>

            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>⌕</Text>

              <TextInput
                style={styles.searchInput}
                placeholder="Search shops, pharmacies, laundry..."
                placeholderTextColor={colors.muted}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                accessibilityLabel="Search shops and services"
                clearButtonMode="while-editing"
              />

              {search.length > 0 && (
                <Pressable
                  onPress={() => setSearch('')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Text style={styles.clearSearch}>✕</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.resultsRow}>
              <Text style={styles.resultsText}>
                {filteredShops.length}{' '}
                {filteredShops.length === 1 ? 'business' : 'businesses'}
              </Text>

              <View style={styles.verifiedLabel}>
                <Text style={styles.verifiedText}>
                  Local directory
                </Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Text style={styles.emptyIcon}>⌕</Text>
            </View>

            <Text style={styles.emptyTitle}>No shops found</Text>

            <Text style={styles.emptySubtitle}>
              Try another shop name, category, or location.
            </Text>

            <Pressable
              style={styles.resetButton}
              onPress={() => setSearch('')}
              accessibilityRole="button"
            >
              <Text style={styles.resetButtonText}>Clear search</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  header: {
    marginBottom: 20,
  },

  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 8,
  },

  eyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: colors.primary,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.7,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
    marginTop: 6,
    marginBottom: 20,
  },

  searchBox: {
    minHeight: 54,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  searchIcon: {
    fontSize: 27,
    lineHeight: 32,
    color: colors.primary,
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },

  clearSearch: {
    color: colors.muted,
    fontSize: 16,
    paddingLeft: 10,
  },

  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },

  resultsText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },

  verifiedLabel: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },

  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },

  separator: {
    height: 14,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  iconText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },

  shopMeta: {
    flex: 1,
    minWidth: 0,
  },

  shopName: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    color: colors.text,
  },

  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 3,
  },

  locationText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    marginTop: 3,
  },

  ratingBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: radius.md,
    marginLeft: 6,
  },

  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.warn,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 16,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },

  dotOpen: {
    backgroundColor: colors.success,
  },

  dotClosed: {
    backgroundColor: colors.danger,
  },

  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
  },

  openText: {
    color: colors.success,
  },

  closedText: {
    color: colors.danger,
  },

  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginBottom: 4,
  },

  callIcon: {
    color: '#FFFFFF',
    fontSize: 15,
    marginRight: 7,
  },

  callBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  buttonPressed: {
    opacity: 0.75,
  },

  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },

  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  emptyIcon: {
    fontSize: 36,
    color: colors.primary,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },

  emptySubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 6,
  },

  resetButton: {
    marginTop: 18,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
  },

  resetButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
});
