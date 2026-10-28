import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { api, errMsg } from '@/api/client';
import type { OrgType } from '@/api/types';
import { useToast } from '@/components/Toast';
import { qk } from '@/hooks/queries';
import { titleCase } from '@/lib/format';
import { colors, radius } from '@/lib/theme';
import { isEmail } from '@/lib/validators';

const TYPES: OrgType[] = [
  'ESTATE',
  'SHOP',
  'CHURCH',
  'MOSQUE',
  'ARTISAN',
  'COMMUNITY_GROUP',
];

export default function CreateOrgScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<OrgType>('ESTATE');
  const [f, setF] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof f) => (v: string) =>
    setF((p) => ({ ...p, [k]: v }));

  const emailBad = f.email.trim() !== '' && !isEmail(f.email);
  const valid = f.name.trim().length >= 2 && !emailBad;

  const submit = async () => {
    if (!valid || loading) return;
    setLoading(true);
    try {
      const body: Record<string, string> = { type };
      (Object.entries(f) as [string, string][]).forEach(([k, v]) => {
        if (v.trim()) body[k] = v.trim();
      });
      await api.post('/organizations', body);
      await qc.invalidateQueries({ queryKey: qk.mine });
      toast.show(`${f.name.trim()} registered!`, 'success');
      router.back();
    } catch (e) {
      toast.show(errMsg(e), 'error');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom, 20) + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Register Community</Text>
          <Text style={styles.subtitle}>
            You will become the administrator and manage member approvals.
          </Text>
        </View>

        {/* Type Selector */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Organization Type *</Text>
          <View style={styles.chipRow}>
            {TYPES.map((t) => {
              const isSelected = type === t;
              return (
                <Pressable
                  key={t}
                  style={[
                    styles.chip,
                    isSelected && styles.chipSelected,
                  ]}
                  onPress={() => setType(t)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}
                  >
                    {titleCase(t)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Community / Organization Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Royal Palm Estate"
              placeholderTextColor={colors.muted}
              value={f.name}
              onChangeText={set('name')}
              editable={!loading}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Brief overview of your estate or group..."
              placeholderTextColor={colors.muted}
              value={f.description}
              onChangeText={set('description')}
              multiline
              numberOfLines={3}
              editable={!loading}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Street Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 12 Commercial Avenue"
              placeholderTextColor={colors.muted}
              value={f.address}
              onChangeText={set('address')}
              editable={!loading}
            />
          </View>

          <View style={styles.rowTwoCol}>
            <View style={[styles.fieldContainer, styles.flex1]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="Lekki"
                placeholderTextColor={colors.muted}
                value={f.city}
                onChangeText={set('city')}
                editable={!loading}
              />
            </View>

            <View style={[styles.fieldContainer, styles.flex1]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="Lagos"
                placeholderTextColor={colors.muted}
                value={f.state}
                onChangeText={set('state')}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Official Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="08012345678"
              placeholderTextColor={colors.muted}
              value={f.phone}
              onChangeText={set('phone')}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Official Email Address</Text>
            <TextInput
              style={[styles.input, emailBad && styles.inputError]}
              placeholder="admin@estate.com"
              placeholderTextColor={colors.muted}
              value={f.email}
              onChangeText={set('email')}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
            {emailBad && (
              <Text style={styles.errorText}>Please enter a valid email address</Text>
            )}
          </View>

          {/* Submit Button */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && !loading && valid && styles.btnPressed,
              (!valid || loading) && styles.btnDisabled,
            ]}
            onPress={submit}
            disabled={!valid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>Complete Registration</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    marginTop: 4,
  },
  form: {
    gap: 16,
  },
  fieldContainer: {
    gap: 6,
  },
  rowTwoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 15,
  },
  multilineInput: {
    height: 84,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 2,
  },
  primaryBtn: {
    height: 52,
    marginTop: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  btnPressed: {
    opacity: 0.9,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});