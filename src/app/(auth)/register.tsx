import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { api, errMsg } from '@/api/client';
import { useToast } from '@/components/Toast';
import { isEmail, isNgPhone } from '@/lib/validators';
import { useAuth } from '@/store/auth';

type RegisterFields = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FieldName = keyof RegisterFields;

const BRAND_PURPLE = '#6D28D9';
const BRAND_RED_TEXT = '#BE123C';
const PLACEHOLDER = '#9A8BAF';

export default function RegisterScreen() {
  const toast = useToast();
  const setSession = useAuth((state) => state.setSession);

  const [form, setForm] = useState<RegisterFields>({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [touched, setTouched] = useState<
    Partial<Record<FieldName, boolean>>
  >({});
  const [focused, setFocused] = useState<FieldName | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateField = (field: FieldName, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const markTouched = (field: FieldName) => {
    setTouched((previous) => ({ ...previous, [field]: true }));
  };

  const errors: Record<FieldName, string> = {
    fullName:
      form.fullName.trim().length < 2
        ? 'Enter your full name'
        : '',

    phone: !isNgPhone(form.phone)
      ? 'Enter a valid Nigerian phone number'
      : '',

    email:
      form.email.trim() && !isEmail(form.email.trim())
        ? 'Enter a valid email address'
        : '',

    password:
      form.password.length < 8
        ? 'Password must contain at least 8 characters'
        : '',

    confirmPassword:
      !form.confirmPassword
        ? 'Confirm your password'
        : form.password !== form.confirmPassword
          ? 'Passwords do not match'
          : '',
  };

  const isValid = Object.values(errors).every((error) => !error);

  const visibleError = (field: FieldName) =>
    touched[field] ? errors[field] : '';

  const submit = async () => {
    setTouched({
      fullName: true,
      phone: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (!isValid || loading) return;

    setLoading(true);

    try {
      const body = {
        fullName: form.fullName.trim(),
        phone: form.phone.replace(/\s+/g, ''),
        email: form.email.trim() || undefined,
        password: form.password,
      };

      const { data } = await api.post('/auth/register', body);

      await setSession(
        data.user,
        data.accessToken,
        data.refreshToken,
      );
    } catch (error) {
      toast.show(errMsg(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (
    field: FieldName,
    label: string,
    placeholder: string,
    options?: {
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
      secureTextEntry?: boolean;
      textContentType?:
        | 'name'
        | 'telephoneNumber'
        | 'emailAddress'
        | 'newPassword';
      optional?: boolean;
      passwordToggle?: boolean;
      toggleValue?: boolean;
      onToggle?: () => void;
    },
  ) => (
    <View style={styles.fieldContainer} key={field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {options?.optional && (
          <Text style={styles.optional}>Optional</Text>
        )}
      </View>

      <View
        style={[
          styles.inputWrapper,
          focused === field && styles.inputFocused,
          !!visibleError(field) && styles.inputError,
        ]}
      >
        <TextInput
          style={styles.input}
          value={form[field]}
          onChangeText={(value) => updateField(field, value)}
          onFocus={() => setFocused(field)}
          onBlur={() => {
            setFocused((f) => (f === field ? null : f));
            markTouched(field);
          }}
          placeholder={placeholder}
          placeholderTextColor={PLACEHOLDER}
          keyboardType={options?.keyboardType ?? 'default'}
          autoCapitalize={options?.autoCapitalize ?? 'sentences'}
          autoCorrect={false}
          spellCheck={false}
          secureTextEntry={
            options?.passwordToggle
              ? !options.toggleValue
              : options?.secureTextEntry
          }
          textContentType={options?.textContentType}
          editable={!loading}
          accessibilityLabel={label}
        />

        {options?.passwordToggle && (
          <Pressable
            onPress={options.onToggle}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.toggleButton}
            accessibilityRole="button"
            accessibilityLabel={
              options.toggleValue ? 'Hide password' : 'Show password'
            }
          >
            <Text style={styles.toggleText}>
              {options.toggleValue ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        )}
      </View>

      {!!visibleError(field) && (
        <Text style={styles.errorText}>{visibleError(field)}</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Brand Header with Flush Rounded Logo */}
          <View style={styles.brand}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/images/logo-purple.png')}
                style={styles.logo}
                resizeMode="cover"
                accessible
                accessibilityRole="image"
                accessibilityLabel="Adugbo logo"
              />
            </View>
            <Text style={styles.brandName}>Adugbo</Text>
            <Text style={styles.brandCaption}>
              Your community, closer.
            </Text>
          </View>

          {/* Main Card Container */}
          <View style={styles.card}>
            <Text style={styles.heading}>Create your account</Text>
            <Text style={styles.subtitle}>
              Join Adugbo to connect with your community.
            </Text>

            <View style={styles.form}>
              {renderField(
                'fullName',
                'Full name',
                'Enter your full name',
                { textContentType: 'name', autoCapitalize: 'words' },
              )}

              {renderField(
                'phone',
                'Phone number',
                'e.g. 08012345678',
                {
                  keyboardType: 'phone-pad',
                  textContentType: 'telephoneNumber',
                },
              )}

              {renderField(
                'email',
                'Email address',
                'you@example.com',
                {
                  keyboardType: 'email-address',
                  autoCapitalize: 'none',
                  textContentType: 'emailAddress',
                  optional: true,
                },
              )}

              {renderField(
                'password',
                'Password',
                'At least 8 characters',
                {
                  textContentType: 'newPassword',
                  passwordToggle: true,
                  toggleValue: showPassword,
                  onToggle: () => setShowPassword((value) => !value),
                },
              )}

              {renderField(
                'confirmPassword',
                'Confirm password',
                'Enter your password again',
                {
                  textContentType: 'newPassword',
                  passwordToggle: true,
                  toggleValue: showConfirmPassword,
                  onToggle: () =>
                    setShowConfirmPassword((value) => !value),
                },
              )}

              <Pressable
                onPress={submit}
                disabled={loading}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && !loading && styles.buttonPressed,
                  loading && styles.buttonDisabled,
                ]}
                accessibilityRole="button"
                accessibilityState={{ busy: loading, disabled: loading }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitText}>Create account</Text>
                )}
              </Pressable>

              <View style={styles.loginRow}>
                <Text style={styles.loginPrompt}>
                  Already have an account?
                </Text>
                <Link href="/(auth)/login" asChild>
                  <Pressable
                    accessibilityRole="link"
                    hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                  >
                    <Text style={styles.loginLink}> Sign in</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>

          <Text style={styles.footer}>
            ESTATES · WORSHIP · LOCAL SHOPS · COMMUNITY
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF7FF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  brand: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 76,
    height: 76,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: BRAND_PURPLE,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    color: BRAND_PURPLE,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  brandCaption: {
    marginTop: 4,
    color: '#6E617E',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EBE0FA',
    shadowColor: BRAND_PURPLE,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heading: {
    color: '#1E1033',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: '#6E617E',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 20,
  },
  form: {
    gap: 16,
  },
  fieldContainer: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: '#47365C',
    fontSize: 13,
    fontWeight: '700',
  },
  optional: {
    color: '#9A8BAF',
    fontSize: 12,
  },
  inputWrapper: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D6C4EE',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
  },
  inputFocused: {
    borderColor: BRAND_PURPLE,
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: '#B91C1C',
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    color: '#1E1033',
    fontSize: 15,
    paddingVertical: 0,
  },
  toggleButton: {
    justifyContent: 'center',
    paddingLeft: 8,
    paddingVertical: 4,
  },
  toggleText: {
    color: BRAND_PURPLE,
    fontSize: 13,
    fontWeight: '700',
  },
  errorText: {
    color: BRAND_RED_TEXT,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
    marginLeft: 2,
  },
  submitButton: {
    height: 54,
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: BRAND_PURPLE,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  buttonDisabled: {
    opacity: 0.85,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 20,
    gap: 4,
  },
  loginPrompt: {
    color: '#6E617E',
    fontSize: 14,
  },
  loginLink: {
    color: BRAND_RED_TEXT,
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    marginTop: 24,
    textAlign: 'center',
    color: '#7E718E',
    fontSize: 11,
    letterSpacing: 0.8,
    lineHeight: 16,
  },
});