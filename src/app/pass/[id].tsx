
import React, { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, errMsg } from '@/api/client';
import { useToast } from '@/components/Toast';
import { colors, radius } from '@/lib/theme';

type VisitorPass = {
  id?: string;
  code?: string;
  guestName?: string;
  phone?: string | null;
  vehicleNumber?: string | null;
  purpose?: string;
  status?: string;
  expiresAt?: string | null;
  createdAt?: string;
};

export default function VisitorPassDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const params = useLocalSearchParams<{ id: string }>();

  const passId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [pass, setPass] = useState<VisitorPass | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadPass = useCallback(async (refresh = false) => {
    if (!passId) {
      setError('No visitor pass ID was provided.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const { data } = await api.get(
        `/passes/${encodeURIComponent(passId)}`,
      );

      const result = data?.pass ?? data?.data ?? data;

      if (!result || typeof result !== 'object') {
        throw new Error('The server returned an invalid pass response.');
      }

      setPass(result as VisitorPass);
    } catch (err) {
      const message = errMsg(err);
      setError(message || 'Unable to load this visitor pass.');
      if (refresh) {
        toast.show(
          message || 'Unable to refresh visitor pass.',
          'error',
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [passId, toast]);

  useEffect(() => {
    void loadPass();
  }, [loadPass]);

  const formatDate = (value?: string | null) => {
    if (!value) return 'Not provided';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString();
  };

  const displayValue = (value?: string | null) =>
    value?.trim() || 'Not provided';

  if (loading) {
    return (
      <View
        style={[
          styles.screen,
          styles.centered,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading visitor pass...</Text>
      </View>
    );
  }

  if (error || !pass) {
    return (
      <View
        style={[
          styles.screen,
          styles.centered,
          { padding: 24, paddingTop: insets.top + 24 },
        ]}
      >
        <View style={styles.errorIcon}>
          <Text style={styles.errorIconText}>!</Text>
        </View>

        <Text style={styles.title}>Pass unavailable</Text>
        <Text style={styles.subtitle}>
          {error || 'This visitor pass could not be found.'}
        </Text>

        <Pressable
          onPress={() => void loadPass()}
          style={styles.primaryButton}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Try again</Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={styles.secondaryButton}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 24,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>‹  Back</Text>
        </Pressable>

        <Text style={styles.eyebrow}>VISITOR ACCESS</Text>
        <Text style={styles.title}>Pass details</Text>
        <Text style={styles.subtitle}>
          Review the visitor information and entry code recorded by your
          community.
        </Text>

        <View style={styles.codeCard}>
          <View style={styles.codeIcon}>
            <Text style={styles.codeIconText}>✓</Text>
          </View>

          <Text style={styles.codeLabel}>VISITOR PASS CODE</Text>
          <Text style={styles.codeText}>
            {displayValue(pass.code)}
          </Text>

          <View style={styles.statusPill}>
            <Text style={styles.statusText}>
              {displayValue(pass.status || 'Status unavailable').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Visitor information</Text>

          <DetailRow label="Full name" value={pass.guestName} />
          <DetailRow label="Phone number" value={pass.phone} />
          <DetailRow label="Vehicle plate" value={pass.vehicleNumber} />
          <DetailRow label="Visit purpose" value={pass.purpose} />
          <DetailRow
            label="Valid until"
            value={formatDate(pass.expiresAt)}
          />
          <DetailRow
            label="Created on"
            value={formatDate(pass.createdAt)}
          />
        </View>

        <Pressable
          onPress={() => void loadPass(true)}
          disabled={refreshing}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
            refreshing && styles.buttonDisabled,
          ]}
          accessibilityRole="button"
        >
          {refreshing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>
              Refresh pass
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={styles.secondaryButton}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>
            Done
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>
        {value?.trim() || 'Not provided'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  container: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 14,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingRight: 16,
    marginBottom: 20,
  },
  backText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  eyebrow: {
    color: '#BE123C',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  codeCard: {
    backgroundColor: '#F2EAFD',
    borderColor: '#E2D0FC',
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: 24,
    alignItems: 'center',
    marginBottom: 18,
  },
  codeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6D28D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  codeIconText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
  },
  codeLabel: {
    color: '#6D28D9',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  codeText: {
    color: '#24133D',
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 10,
    marginBottom: 16,
    textAlign: 'center',
  },
  statusPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  statusText: {
    color: '#6D28D9',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  detailsCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  detailRow: {
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  detailValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: '#6D28D9',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  errorIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  errorIconText: {
    color: '#BE123C',
    fontSize: 28,
    fontWeight: '800',
  },
});
