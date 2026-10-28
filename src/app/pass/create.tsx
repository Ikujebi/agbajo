
import { useRouter } from 'expo-router';
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

import { api, errMsg } from '@/api/client';
import { useToast } from '@/components/Toast';
import { radius } from '@/lib/theme';

type Purpose = 'guest' | 'delivery' | 'contractor' | 'other';

type CreatedPass = {
  id?: string;
  code: string;
  guestName: string;
  expiresAt: string;
};

type PassApiResponse = {
  id?: string;
  code?: string;
  passCode?: string;
  guestName?: string;
  expiresAt?: string | null;
  pass?: PassApiResponse;
  data?: PassApiResponse;
};

const PURPLE = '#6D28D9';
const PURPLE_DARK = '#4C1D95';
const PURPLE_SOFT = '#F2EAFD';
const RED = '#BE123C';
const RED_SOFT = '#FFF1F2';
const BG = '#FAF7FF';
const CARD = '#FFFFFF';
const TEXT = '#24133D';
const MUTED = '#786B8A';
const BORDER = '#E4D8F2';

const PURPOSES: { label: string; value: Purpose; icon: string }[] = [
  { label: 'Personal Guest', value: 'guest', icon: '👤' },
  { label: 'Delivery / Courier', value: 'delivery', icon: '📦' },
  { label: 'Contractor / Artisan', value: 'contractor', icon: '🛠️' },
  { label: 'Other', value: 'other', icon: '✦' },
];

function formatExpiry(value?: string | null): string {
  if (!value) return 'Not provided by server';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

export default function CreateVisitorPassScreen() {
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [purpose, setPurpose] = useState<Purpose>('guest');
  const [loading, setLoading] = useState(false);
  const [createdPass, setCreatedPass] = useState<CreatedPass | null>(null);

  const handleSubmit = async () => {
    const name = guestName.trim();

    if (!name) {
      toast.show('Please enter the visitor name.', 'error');
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      const { data } = await api.post<PassApiResponse>('/passes', {
        guestName: name,
        phone: phone.trim() || undefined,
        vehicleNumber: vehicleNumber.trim() || undefined,
        purpose,
      });

      // Support common response shapes without inventing a pass code.
      const result = data?.pass ?? data?.data ?? data;
      const code = result?.code ?? result?.passCode;

      if (!code) {
        throw new Error(
          'The server did not return a visitor pass code. Please check your passes or contact support before trying again.',
        );
      }

      const pass: CreatedPass = {
        id: result.id,
        code,
        guestName: result.guestName?.trim() || name,
        expiresAt: formatExpiry(result.expiresAt),
      };

      setCreatedPass(pass);
      toast.show('Visitor pass created successfully!', 'success');
    } catch (error) {
      toast.show(
        errMsg(error) || 'Unable to create visitor pass. Please try again.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCreatedPass(null);
    setGuestName('');
    setPhone('');
    setVehicleNumber('');
    setPurpose('guest');
  };

  if (createdPass) {
    return (
      <View
        style={[
          styles.screen,
          {
            paddingTop: Math.max(insets.top, 20) + 12,
            paddingBottom: Math.max(insets.bottom, 20) + 16,
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.successScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.successContainer}>
            <View style={styles.successBadge}>
              <Text style={styles.successBadgeIcon}>✓</Text>
            </View>

            <Text style={styles.successEyebrow}>ADUGBO VISITOR ACCESS</Text>
            <Text style={styles.successTitle}>Pass Created!</Text>

            <Text style={styles.successSubtitle}>
              Your visitor pass was created for{' '}
              <Text style={styles.boldText}>{createdPass.guestName}</Text>.
              Share the access code with your visitor.
            </Text>

            <View style={styles.codeCard}>
              <View style={styles.codeAccent} />

              <Text style={styles.codeLabel}>SECURE ACCESS CODE</Text>
              <Text selectable style={styles.codeText}>
                {createdPass.code}
              </Text>

              <View style={styles.codeDivider} />

              <Text style={styles.expiryLabel}>VALID UNTIL</Text>
              <Text style={styles.expiryText}>
                {createdPass.expiresAt}
              </Text>

              <Text style={styles.securityNote}>
                Keep this code private and share it only with your intended
                visitor.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.back()}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>Done & Return</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={resetForm}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>
                Create Another Pass
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20) + 12,
            paddingBottom: Math.max(insets.bottom, 20) + 16,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={
          Platform.OS === 'ios' ? 'interactive' : 'on-drag'
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>‹  Back</Text>
          </Pressable>

          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Text style={styles.headerIconText}>⌂</Text>
            </View>

            <Text style={styles.eyebrow}>ADUGBO COMMUNITY</Text>
            <Text style={styles.heading}>New Visitor Pass</Text>
            <Text style={styles.subtitle}>
              Welcome your guests with a secure, convenient gate entry code.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.formHeadingRow}>
              <Text style={styles.formHeading}>Visitor details</Text>
              <Text style={styles.requiredNote}>* Required</Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Visitor Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Oluwaseun Adeleke"
                placeholderTextColor={MUTED}
                value={guestName}
                onChangeText={setGuestName}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="next"
                accessibilityLabel="Visitor full name"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <Text style={styles.optionalLabel}>Optional</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 08012345678"
                placeholderTextColor={MUTED}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!loading}
                returnKeyType="next"
                accessibilityLabel="Visitor phone number"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Vehicle Plate Number</Text>
              <Text style={styles.optionalLabel}>Optional</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. ABC-123XY"
                placeholderTextColor={MUTED}
                value={vehicleNumber}
                onChangeText={(value) =>
                  setVehicleNumber(value.toUpperCase())
                }
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="done"
                accessibilityLabel="Vehicle plate number"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Purpose of Visit</Text>
              <Text style={styles.fieldHint}>
                Select the option that best describes your visitor.
              </Text>

              <View style={styles.purposeGrid}>
                {PURPOSES.map((item) => {
                  const selected = purpose === item.value;

                  return (
                    <Pressable
                      key={item.value}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={item.label}
                      disabled={loading}
                      onPress={() => setPurpose(item.value)}
                      style={({ pressed }) => [
                        styles.purposeChip,
                        selected && styles.purposeChipSelected,
                        pressed && !loading && styles.chipPressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.purposeIcon,
                          selected && styles.purposeIconSelected,
                        ]}
                      >
                        <Text style={styles.purposeIconText}>
                          {item.icon}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.purposeChipText,
                          selected && styles.purposeChipTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>

                      <View
                        style={[
                          styles.selectionIndicator,
                          selected && styles.selectionIndicatorSelected,
                        ]}
                      >
                        {selected && (
                          <Text style={styles.selectionCheck}>✓</Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.infoBox}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoIconText}>i</Text>
              </View>
              <Text style={styles.infoText}>
                Your pass must be successfully created by the server before
                you share the access code with your visitor.
              </Text>
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              accessibilityRole="button"
              accessibilityState={{ disabled: loading, busy: loading }}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && !loading && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.primaryButtonText}>
                    Creating pass...
                  </Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>
                  Generate Visitor Pass  →
                </Text>
              )}
            </Pressable>

            <Text style={styles.footerNote}>
              Secure visitor access, powered by Adugbo.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingRight: 16,
    marginBottom: 12,
  },
  backText: {
    color: PURPLE,
    fontSize: 15,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    marginBottom: 26,
  },
  headerIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: PURPLE_SOFT,
    borderWidth: 1,
    borderColor: '#E2D0FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerIconText: {
    color: PURPLE,
    fontSize: 36,
    fontWeight: '800',
  },
  eyebrow: {
    color: RED,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  heading: {
    color: TEXT,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  subtitle: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    maxWidth: 340,
    textAlign: 'center',
  },
  form: {
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
    gap: 19,
    shadowColor: PURPLE,
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  formHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  formHeading: {
    color: TEXT,
    fontSize: 17,
    fontWeight: '800',
  },
  requiredNote: {
    color: RED,
    fontSize: 11,
    fontWeight: '600',
  },
  fieldContainer: {
    gap: 7,
  },
  label: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '700',
  },
  optionalLabel: {
    color: MUTED,
    fontSize: 11,
    marginTop: -4,
  },
  fieldHint: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: -2,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    backgroundColor: '#FFFEFF',
    paddingHorizontal: 14,
    color: TEXT,
    fontSize: 15,
  },
  purposeGrid: {
    gap: 9,
    marginTop: 4,
  },
  purposeChip: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
  },
  purposeChipSelected: {
    backgroundColor: PURPLE_SOFT,
    borderColor: PURPLE,
  },
  chipPressed: {
    opacity: 0.8,
  },
  purposeIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#F6F1FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  purposeIconSelected: {
    backgroundColor: '#E4D3FC',
  },
  purposeIconText: {
    fontSize: 17,
  },
  purposeChipText: {
    flex: 1,
    color: '#5F526F',
    fontSize: 13,
    fontWeight: '600',
  },
  purposeChipTextSelected: {
    color: PURPLE_DARK,
    fontWeight: '800',
  },
  selectionIndicator: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D5C5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIndicatorSelected: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  selectionCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: RED_SOFT,
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 13,
    padding: 12,
  },
  infoIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  infoText: {
    flex: 1,
    color: '#881337',
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: PURPLE,
    shadowOpacity: 0.22,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  footerNote: {
    color: MUTED,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: -5,
  },
  successScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  successContainer: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  successBadge: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: PURPLE_SOFT,
    borderWidth: 1,
    borderColor: '#E2D0FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  successBadgeIcon: {
    fontSize: 31,
    color: PURPLE,
    fontWeight: '800',
  },
  successEyebrow: {
    color: RED,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: TEXT,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
    marginTop: 9,
    marginBottom: 24,
    lineHeight: 22,
  },
  boldText: {
    color: TEXT,
    fontWeight: '800',
  },
  codeCard: {
    width: '100%',
    backgroundColor: CARD,
    borderRadius: 23,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 22,
    overflow: 'hidden',
    shadowColor: PURPLE,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  codeAccent: {
    height: 5,
    width: '100%',
    position: 'absolute',
    top: 0,
    backgroundColor: PURPLE,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    color: PURPLE,
    marginTop: 5,
  },
  codeText: {
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: 2,
    color: TEXT,
    marginVertical: 16,
    textAlign: 'center',
  },
  codeDivider: {
    width: '100%',
    height: 1,
    backgroundColor: BORDER,
    marginBottom: 16,
  },
  expiryLabel: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  expiryText: {
    fontSize: 13,
    color: TEXT,
    marginTop: 7,
    textAlign: 'center',
    lineHeight: 19,
  },
  securityNote: {
    fontSize: 11,
    lineHeight: 17,
    color: MUTED,
    textAlign: 'center',
    marginTop: 18,
  },
  secondaryButton: {
    minHeight: 52,
    width: '100%',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 11,
  },
  secondaryButtonText: {
    color: PURPLE,
    fontSize: 15,
    fontWeight: '800',
  },
});
