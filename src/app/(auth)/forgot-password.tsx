import { Link, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, errMsg } from "@/api/client";
import { useToast } from "@/components/Toast";
import { isEmail, isNgPhone } from "@/lib/validators";

const BRAND_PURPLE = "#6D28D9";
const BRAND_RED_TEXT = "#BE123C";
const PLACEHOLDER = "#9A8BAF";

const normalizeIdentifier = (raw: string) => {
  const trimmed = raw.trim();
  if (trimmed.includes("@")) return trimmed;
  return trimmed.replace(/[\s\-().]/g, "");
};

export default function ForgotPasswordScreen() {
  const toast = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const inFlight = useRef(false);
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

  const identifierError = touched
    ? !identifier.trim()
      ? "Enter your email address or phone number."
      : !isValidIdentifier
      ? "Enter a valid email or Nigerian phone number."
      : ""
    : "";

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

    setTouched(true);

    if (!isValidIdentifier) {
      runShake();
      return;
    }

    inFlight.current = true;
    setLoading(true);
    Keyboard.dismiss();

    try {
      await api.post("/auth/forgot-password", {
        identifier: normalized,
      });

      if (mounted.current) {
        setSentSuccess(true);
      }
      toast.show("Reset instructions sent to your account.", "success");
    } catch (error) {
      const message = errMsg(error);
      toast.show(message, "error");
      runShake();
    } finally {
      inFlight.current = false;
      if (mounted.current) setLoading(false);
    }
  }, [isValidIdentifier, normalized, runShake, toast]);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
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
          Platform.OS === "ios" ? "interactive" : "on-drag"
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Brand Header */}
          <View style={styles.brand}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../../assets/images/logo-purple.png")}
                style={styles.logo}
                resizeMode="cover"
                accessible
                accessibilityRole="image"
                accessibilityLabel="Adugbo logo"
              />
            </View>
            <Text
              style={styles.brandName}
              accessibilityRole="header"
              maxFontSizeMultiplier={1.2}
            >
              Adugbo
            </Text>
            <Text style={styles.brandCaption}>Your community, closer.</Text>
          </View>

          {/* Main Card */}
          <Animated.View
            style={[
              styles.card,
              { transform: [{ translateX: shake }] },
            ]}
          >
            {sentSuccess ? (
              <View style={styles.successState}>
                <View style={styles.successBadge}>
                  <Text style={styles.successBadgeIcon}>✓</Text>
                </View>

                <Text style={styles.heading}>Check your inbox</Text>
                <Text style={styles.subtitle}>
                  We sent reset instructions for{" "}
                  <Text style={styles.highlightText}>{identifier}</Text>. Check
                  your email or messages to continue.
                </Text>

                <Pressable
                  onPress={() => router.push("/(auth)/login")}
                  style={({ pressed }) => [
                    styles.submitButton,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={styles.submitText}>Return to Sign In</Text>
                </Pressable>

                <Pressable
                  onPress={() => setSentSuccess(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.resendWrap}
                >
                  <Text style={styles.resendText}>Didn’t receive it? Try again</Text>
                </Pressable>
              </View>
            ) : (
              <View>
                <Text style={styles.heading}>Reset password</Text>
                <Text style={styles.subtitle}>
                  Enter your email or phone number and we’ll send you a link to reset your password.
                </Text>

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Email address or phone number</Text>

                  <View
                    style={[
                      styles.inputWrapper,
                      focused && styles.inputFocused,
                      !!identifierError && styles.inputError,
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="name@example.com or 08012345678"
                      placeholderTextColor={PLACEHOLDER}
                      value={identifier}
                      onChangeText={setIdentifier}
                      onFocus={() => setFocused(true)}
                      onBlur={() => {
                        setFocused(false);
                        if (identifier.length > 0) setTouched(true);
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      spellCheck={false}
                      keyboardType="email-address"
                      autoComplete="username"
                      editable={!loading}
                      returnKeyType="go"
                      onSubmitEditing={submit}
                      accessibilityLabel="Email address or phone number"
                    />
                  </View>

                  {!!identifierError && (
                    <Text style={styles.errorText}>{identifierError}</Text>
                  )}
                </View>

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
                    <Text style={styles.submitText}>Send reset instructions</Text>
                  )}
                </Pressable>

                <View style={styles.loginRow}>
                  <Text style={styles.loginPrompt}>Remembered your password?</Text>
                  <Link href="/(auth)/login" asChild>
                    <Pressable
                      accessibilityRole="link"
                      hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                    >
                      <Text style={styles.loginLink}> Back to sign in</Text>
                    </Pressable>
                  </Link>
                </View>
              </View>
            )}
          </Animated.View>

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
    backgroundColor: "#FAF7FF",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  container: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  brand: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoContainer: {
    width: 76,
    height: 76,
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: BRAND_PURPLE,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  brandName: {
    color: BRAND_PURPLE,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  brandCaption: {
    marginTop: 4,
    color: "#6E617E",
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#EBE0FA",
    shadowColor: BRAND_PURPLE,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heading: {
    color: "#1E1033",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  subtitle: {
    color: "#6E617E",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 20,
  },
  fieldContainer: {
    gap: 6,
    marginBottom: 16,
  },
  label: {
    color: "#47365C",
    fontSize: 13,
    fontWeight: "700",
  },
  inputWrapper: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D6C4EE",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
  },
  inputFocused: {
    borderColor: BRAND_PURPLE,
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: "#B91C1C",
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    color: "#1E1033",
    fontSize: 15,
    paddingVertical: 0,
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
    borderRadius: 14,
    backgroundColor: BRAND_PURPLE,
    alignItems: "center",
    justifyContent: "center",
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
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 20,
    gap: 4,
  },
  loginPrompt: {
    color: "#6E617E",
    fontSize: 14,
  },
  loginLink: {
    color: BRAND_RED_TEXT,
    fontSize: 14,
    fontWeight: "700",
  },
  successState: {
    alignItems: "center",
    textAlign: "center",
  },
  successBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F2EAFD",
    borderWidth: 1,
    borderColor: "#E2D0FC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successBadgeIcon: {
    fontSize: 24,
    color: BRAND_PURPLE,
    fontWeight: "800",
  },
  highlightText: {
    color: "#1E1033",
    fontWeight: "700",
  },
  resendWrap: {
    marginTop: 16,
  },
  resendText: {
    color: BRAND_RED_TEXT,
    fontSize: 13,
    fontWeight: "700",
  },
  footer: {
    marginTop: 24,
    textAlign: "center",
    color: "#7E718E",
    fontSize: 11,
    letterSpacing: 0.8,
    lineHeight: 16,
  },
});