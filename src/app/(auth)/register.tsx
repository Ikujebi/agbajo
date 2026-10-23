
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
import { Link } from 'expo-router';

import { api, errMsg } from '@/api/client';
import { useAuth } from '@/store/auth';
import { useToast } from '@/components/Toast';
import { isEmail, isNgPhone } from '@/lib/validators';

type RegisterFields = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FieldName = keyof RegisterFields;

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
          visibleError(field) ? styles.inputError : null,
        ]}
      >
        <TextInput
          style={styles.input}
          value={form[field]}
          onChangeText={(value) => updateField(field, value)}
          onBlur={() => markTouched(field)}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={options?.keyboardType ?? 'default'}
          autoCapitalize={options?.autoCapitalize ?? 'sentences'}
          autoCorrect={false}
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
          <View style={styles.brand}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brandName}>Agbajo</Text>
            <Text style={styles.brandCaption}>
              Your community. Connected.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.heading}>Create your account</Text>
            <Text style={styles.subtitle}>
              Join Agbajo to get started.
            </Text>

            <View style={styles.form}>
              {renderField(
                'fullName',
                'Full name',
                'Enter your full name',
                { textContentType: 'name' },
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
                  pressed && !loading ? styles.buttonPressed : null,
                  loading ? styles.buttonDisabled : null,
                ]}
                accessibilityRole="button"
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitText}>Create account</Text>
                )}
              </Pressable>

              <View style={styles.loginRow}>
                <Text style={styles.loginPrompt}>
                  Already have an account?
                </Text>
                <Link href="/(auth)/login" asChild>
                  <Pressable accessibilityRole="link">
                    <Text style={styles.loginLink}> Sign in</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>

          <Text style={styles.footer}>
            Secure registration for your Agbajo account
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F6FC',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  brand: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 76,
    height: 76,
    marginBottom: 8,
  },
  brandName: {
    color: '#1746A2',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  brandCaption: {
    marginTop: 5,
    color: '#64748B',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E7ECF4',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 22,
    elevation: 4,
  },
  heading: {
    color: '#172554',
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 24,
  },
  form: {
    gap: 17,
  },
  fieldContainer: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  optional: {
    color: '#94A3B8',
    fontSize: 12,
  },
  inputWrapper: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE3EF',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    color: '#172554',
    fontSize: 14,
    paddingVertical: 12,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingLeft: 10,
  },
  toggleText: {
    color: '#1746A2',
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    lineHeight: 17,
  },
  submitButton: {
    minHeight: 52,
    marginTop: 6,
    borderRadius: 12,
    backgroundColor: '#1746A2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 3,
  },
  loginPrompt: {
    color: '#64748B',
    fontSize: 13,
  },
  loginLink: {
    color: '#1746A2',
    fontSize: 13,
    fontWeight: '800',
  },
  footer: {
    marginTop: 22,
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 12,
  },
});
