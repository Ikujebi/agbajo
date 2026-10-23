import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, errMsg } from '@/api/client';
import { useAuth } from '@/store/auth';
import { useToast } from '@/components/Toast';
import { isEmail, isNgPhone } from '@/lib/validators';
import { colors } from '@/theme';

type Field = 'identifier' | 'password';

/**
 * Emails are only trimmed. Phone numbers also lose spaces, dashes and
 * brackets so "0801 234 5678" and "(0801) 234-5678" both pass validation
 * and reach the API in one consistent shape.
 */
const normalizeIdentifier = (raw: string) => {
  const trimmed = raw.trim();
  if (trimmed.includes('@')) return trimmed;
  return trimmed.replace(/[\s\-().]/g, '');
};

export default function LoginScreen() {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const setSession = useAuth((s) => s.setSession);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<Field | null>(null);
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    identifier: false,
    password: false,
  });
  const [formError, setFormError] = useState('');

  const passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const inFlight = useRef(false); // guards against double taps / double Enter
  const mounted = useRef(true);
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const normalized = normalizeIdentifier(identifier);
  const isValidIdentifier = isEmail(normalized) || isNgPhone(normalized);

  // Only nag after the user has interacted, and never on an untouched field.
  const identifierError = useMemo(() => {
    if (!touched.identifier) return '';
    if (!identifier.trim()) return 'Enter your email address or phone number.';
    if (!isValidIdentifier) {
      return 'That doesn’t look like a valid email or Nigerian phone number.';
    }
    return '';
  }, [touched.identifier, identifier, isValidIdentifier]);

  const passwordError =
    touched.password && !password ? 'Enter your password.' : '';

  const runShake = useCallback(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return;
      shake.setValue(0);
      Animated.sequence(
        [10, -10, 6, -6, 0].map((toValue) =>
          Animated.timing(shake, {
            toValue,
            duration: 60,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ),
      ).start();
    });
  }, [shake]);

  const submit = useCallback(async () => {
    if (inFlight.current) return;

    setTouched({ identifier: true, password: true });
    setFormError('');

    if (!isValidIdentifier) {
      runShake();
      return;
    }
    if (!password) {
      passwordRef.current?.focus();
      runShake();
      return;
    }

    inFlight.current = true;
    setLoading(true);
    Keyboard.dismiss();

    try {
      const { data } = await api.post('/auth/login', {
        identifier: normalized,
        password,
      });
      await setSession(data.user, data.accessToken, data.refreshToken);
      // On success the auth guard navigates away; nothing else to do here.
    } catch (error) {
      const message = errMsg(error);
      if (mounted.current) setFormError(message);
      toast.show(message, 'error');
      runShake();
    } finally {
      inFlight.current = false;
      if (mounted.current) setLoading(false);
    }
  }, [isValidIdentifier, normalized, password, runShake, setSession, toast]);

  const markTouched = (field: Field) =>
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16) + 16,
            paddingBottom: Math.max(insets.bottom, 16) + 16,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Brand header */}
          <View style={styles.brand}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
                accessible
                accessibilityRole="image"
                accessibilityLabel="Agbajo logo"
              />
            </View>

            <Text
              style={styles.brandName}
              accessibilityRole="header"
              maxFontSizeMultiplier={1.2}
            >
              Agbajo
            </Text>

            <Text style={styles.tagline} maxFontSizeMultiplier={1.3}>
              Your estate, church, mosque and local shops in one app.
            </Text>
          </View>

          {/* Form card */}
          <Animated.View
            style={[styles.card, { transform: [{ translateX: shake }] }]}
          >
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue to your account.
            </Text>

            {/* Form-level error (wrong credentials, network, etc.) */}
            {!!formError && (
              <View
                style={styles.formError}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            )}

            {/* Email / phone */}
            <View style={styles.field}>
              <Text style={styles.label} nativeID="identifier-label">
                Email address or phone number
              </Text>

              <TextInput
                style={[
                  styles.input,
                  focused === 'identifier' && styles.inputFocused,
                  !!identifierError && styles.inputError,
                ]}
                placeholder="name@example.com or 08012345678"
                placeholderTextColor={PLACEHOLDER}
                value={identifier}
                onChangeText={(text) => {
                  setIdentifier(text);
                  if (formError) setFormError('');
                }}
                onFocus={() => setFocused('identifier')}
                onBlur={() => {
                  setFocused((f) => (f === 'identifier' ? null : f));
                  if (identifier.length > 0) markTouched('identifier');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                keyboardType="email-address"
                autoComplete="username"
                textContentType="username"
                importantForAutofill="yes"
                editable={!loading}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => passwordRef.current?.focus()}
                accessibilityLabel="Email address or phone number"
                accessibilityHint={identifierError || undefined}
                testID="login-identifier"
              />

              {!!identifierError && (
                <Text
                  style={styles.errorText}
                  accessibilityLiveRegion="polite"
                >
                  {identifierError}
                </Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>

                <Link href="/(auth)/forgot-password" asChild>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel="Forgot password"
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 8 }}
                    disabled={loading}
                    style={({ pressed }) => [
                      styles.forgotWrap,
                      pressed && styles.pressedText,
                    ]}
                  >
                    <Text style={styles.forgotPassword}>Forgot password?</Text>
                  </Pressable>
                </Link>
              </View>

              <View
                style={[
                  styles.passwordContainer,
                  focused === 'password' && styles.inputFocused,
                  !!passwordError && styles.inputError,
                ]}
              >
                <TextInput
                  ref={passwordRef}
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor={PLACEHOLDER}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (formError) setFormError('');
                  }}
                  onFocus={() => setFocused('password')}
                  onBlur={() => {
                    setFocused((f) => (f === 'password' ? null : f));
                    if (password.length > 0) markTouched('password');
                  }}
                  secureTextEntry={!showPassword}
                  autoComplete="current-password"
                  textContentType="password"
                  importantForAutofill="yes"
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  editable={!loading}
                  returnKeyType="go"
                  onSubmitEditing={submit}
                  accessibilityLabel="Password"
                  testID="login-password"
                />

                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={12}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                  style={styles.showWrap}
                >
                  <Text style={styles.showPassword}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </Pressable>
              </View>

              {!!passwordError && (
                <Text
                  style={styles.errorText}
                  accessibilityLiveRegion="polite"
                >
                  {passwordError}
                </Text>
              )}
            </View>

            {/* Submit */}
            <Pressable
              onPress={submit}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={loading ? 'Signing in' : 'Sign in'}
              accessibilityState={{ disabled: loading, busy: loading }}
              android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && !loading && styles.submitButtonPressed,
                loading && styles.submitButtonLoading,
              ]}
              testID="login-submit"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Sign in</Text>
              )}
            </Pressable>

            {/* Register */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don’t have an account?</Text>

              <Link href="/(auth)/register" asChild>
                <Pressable
                  accessibilityRole="link"
                  disabled={loading}
                  hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                  style={({ pressed }) => pressed && styles.pressedText}
                >
                  <Text style={styles.registerLink}>Create account</Text>
                </Pressable>
              </Link>
            </View>
          </Animated.View>

          <Text style={styles.footer}>
            A simpler way to stay connected to your community.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const BRAND_GREEN = colors?.primary ?? '#1A4D2E';
// Orange text on white is ~2.9:1, which fails WCAG AA for small text.
// Darker orange for text; keep the brighter one for non-text accents.
const BRAND_ORANGE_TEXT = '#C2570C';
const PLACEHOLDER = '#94A3B8';
const ERROR = '#DC2626';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  brand: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoContainer: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: BRAND_GREEN,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  logo: {
    width: 68,
    height: 68,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: BRAND_GREEN,
  },
  tagline: {
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 310,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: BRAND_GREEN,
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
    marginTop: 4,
    marginBottom: 24,
  },
  formError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  formErrorText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#B91C1C',
    fontWeight: '600',
  },
  field: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  forgotWrap: {
    minHeight: 24,
    justifyContent: 'center',
  },
  forgotPassword: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND_ORANGE_TEXT,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16, // 16+ prevents iOS zoom and reads comfortably
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  inputFocused: {
    borderColor: BRAND_GREEN,
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: ERROR,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#B91C1C',
    marginTop: 6,
  },
  passwordContainer: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingLeft: 15,
    paddingRight: 14,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    minHeight: 50,
    fontSize: 16,
    color: '#0F172A',
  },
  showWrap: {
    minHeight: 44,
    justifyContent: 'center',
    paddingLeft: 10,
  },
  showPassword: {
    color: BRAND_GREEN,
    fontWeight: '700',
    fontSize: 14,
  },
  submitButton: {
    height: 54,
    backgroundColor: BRAND_GREEN,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    overflow: 'hidden',
  },
  submitButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  submitButtonLoading: {
    opacity: 0.8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  registerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    gap: 5,
  },
  registerText: {
    color: '#475569',
    fontSize: 14,
  },
  registerLink: {
    color: BRAND_ORANGE_TEXT,
    fontSize: 14,
    fontWeight: '700',
  },
  pressedText: {
    opacity: 0.6,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 19,
    color: '#64748B',
    marginTop: 24,
  },
});
