import { Link } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { useAuth } from "@/store/auth";

type Field = "identifier" | "password";

const normalizeIdentifier = (raw: string) => {
  const trimmed = raw.trim();
  if (trimmed.includes("@")) return trimmed;
  return trimmed.replace(/[\s\-().]/g, "");
};

const BRAND_PURPLE = "#6D28D9";
const BRAND_RED_TEXT = "#BE123C";
const PLACEHOLDER = "#9A8BAF";

export default function LoginScreen() {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const setSession = useAuth((s) => s.setSession);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<Field | null>(null);
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    identifier: false,
    password: false,
  });
  const [formError, setFormError] = useState("");

  const passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null);
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
  const isValidIdentifier =
    isEmail(normalized) || isNgPhone(normalized);

  const identifierError = useMemo(() => {
    if (!touched.identifier) return "";
    if (!identifier.trim()) {
      return "Enter your email address or phone number.";
    }
    if (!isValidIdentifier) {
      return "Enter a valid email or Nigerian phone number.";
    }
    return "";
  }, [touched.identifier, identifier, isValidIdentifier]);

  const passwordError =
    touched.password && !password ? "Enter your password." : "";

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
    setFormError("");

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
      const { data } = await api.post("/auth/login", {
        identifier: normalized,
        password,
      });

      await setSession(
        data.user,
        data.accessToken,
        data.refreshToken,
      );
    } catch (error) {
      const message = errMsg(error);

      if (mounted.current) setFormError(message);

      toast.show(message, "error");
      runShake();
    } finally {
      inFlight.current = false;
      if (mounted.current) setLoading(false);
    }
  }, [
    isValidIdentifier,
    normalized,
    password,
    runShake,
    setSession,
    toast,
  ]);

  const markTouched = (field: Field) => {
    setTouched((prev) =>
      prev[field] ? prev : { ...prev, [field]: true },
    );
  };

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

            <Text style={styles.tagline}>
              Your community, closer.
            </Text>
          </View>

          {/* Main Card Container */}
          <Animated.View
            style={[
              styles.card,
              { transform: [{ translateX: shake }] },
            ]}
          >
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to reconnect with your community.
            </Text>

            {!!formError && (
              <View
                style={styles.formError}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                <Text style={styles.formErrorText}>
                  {formError}
                </Text>
              </View>
            )}

            {/* Identifier Field */}
            <View style={styles.field}>
              <Text style={styles.label} nativeID="identifier-label">
                Email address or phone number
              </Text>

              <View
                style={[
                  styles.inputWrapper,
                  focused === "identifier" && styles.inputFocused,
                  !!identifierError && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  placeholder="name@example.com or 08012345678"
                  placeholderTextColor={PLACEHOLDER}
                  value={identifier}
                  onChangeText={(text) => {
                    setIdentifier(text);
                    if (formError) setFormError("");
                  }}
                  onFocus={() => setFocused("identifier")}
                  onBlur={() => {
                    setFocused((f) =>
                      f === "identifier" ? null : f,
                    );
                    if (identifier.length > 0) {
                      markTouched("identifier");
                    }
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
                  onSubmitEditing={() =>
                    passwordRef.current?.focus()
                  }
                  accessibilityLabel="Email address or phone number"
                  accessibilityHint={identifierError || undefined}
                  testID="login-identifier"
                />
              </View>

              {!!identifierError && (
                <Text
                  style={styles.errorText}
                  accessibilityLiveRegion="polite"
                >
                  {identifierError}
                </Text>
              )}
            </View>

            {/* Password Field */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>

                <Link href="/(auth)/forgot-password" asChild>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel="Forgot password"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    disabled={loading}
                    style={({ pressed }) => [
                      styles.forgotWrap,
                      pressed && styles.pressedText,
                    ]}
                  >
                    <Text style={styles.forgotPassword}>
                      Forgot password?
                    </Text>
                  </Pressable>
                </Link>
              </View>

              <View
                style={[
                  styles.inputWrapper,
                  focused === "password" && styles.inputFocused,
                  !!passwordError && styles.inputError,
                ]}
              >
                <TextInput
                  ref={passwordRef}
                  style={styles.textInput}
                  placeholder="Enter your password"
                  placeholderTextColor={PLACEHOLDER}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (formError) setFormError("");
                  }}
                  onFocus={() => setFocused("password")}
                  onBlur={() => {
                    setFocused((f) =>
                      f === "password" ? null : f,
                    );
                    if (password.length > 0) {
                      markTouched("password");
                    }
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
                  onPress={() =>
                    setShowPassword((value) => !value)
                  }
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword ? "Hide password" : "Show password"
                  }
                  style={styles.showWrap}
                >
                  <Text style={styles.showPassword}>
                    {showPassword ? "Hide" : "Show"}
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

            {/* Submit Button */}
            <Pressable
              onPress={submit}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={
                loading ? "Signing in" : "Sign in"
              }
              accessibilityState={{
                disabled: loading,
                busy: loading,
              }}
              android_ripple={{
                color: "rgba(255,255,255,0.2)",
              }}
              style={({ pressed }) => [
                styles.submitButton,
                pressed &&
                  !loading &&
                  styles.submitButtonPressed,
                loading && styles.submitButtonLoading,
              ]}
              testID="login-submit"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  Sign in
                </Text>
              )}
            </Pressable>

            {/* Register Link Row */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>
                Don’t have an account?
              </Text>

              <Link href="/(auth)/register" asChild>
                <Pressable
                  accessibilityRole="link"
                  disabled={loading}
                  hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                  style={({ pressed }) =>
                    pressed && styles.pressedText
                  }
                >
                  <Text style={styles.registerLink}>
                    Create account
                  </Text>
                </Pressable>
              </Link>
            </View>
          </Animated.View>

          {/* Footer Highlights */}
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
    overflow: "hidden", // Crucial: clips the image to the rounded borders
    marginBottom: 12,
    shadowColor: BRAND_PURPLE,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  logo: {
    width: "100%",  // Forces the image to take full width
    height: "100%", // Forces the image to take full height
  },
  brandName: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: BRAND_PURPLE,
  },
  tagline: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6E617E",
    textAlign: "center",
    marginTop: 4,
    maxWidth: 290,
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
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: "#1E1033",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6E617E",
    marginTop: 4,
    marginBottom: 20,
  },
  formError: {
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "#FECDD3",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  formErrorText: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND_RED_TEXT,
    fontWeight: "600",
  },
  field: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#47365C",
    marginBottom: 6,
  },
  forgotWrap: {
    justifyContent: "center",
  },
  forgotPassword: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND_RED_TEXT,
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
    textInput: {
    flex: 1,
    minHeight: 50,
    fontSize: 15,
    color: "#1E1033",
    paddingVertical: 0,
  },
  inputFocused: {
    borderColor: BRAND_PURPLE,
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: "#B91C1C",
  },
  errorText: {
    fontSize: 12,
    lineHeight: 16,
    color: BRAND_RED_TEXT,
    marginTop: 5,
    marginLeft: 2,
  },
  showWrap: {
    justifyContent: "center",
    paddingLeft: 8,
    paddingVertical: 4,
  },
  showPassword: {
    color: BRAND_PURPLE,
    fontWeight: "700",
    fontSize: 13,
  },
  submitButton: {
    height: 54,
    backgroundColor: BRAND_PURPLE,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: BRAND_PURPLE,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  submitButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  submitButtonLoading: {
    opacity: 0.85,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  registerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 4,
  },
  registerText: {
    color: "#6E617E",
    fontSize: 14,
  },
  registerLink: {
    color: BRAND_RED_TEXT,
    fontSize: 14,
    fontWeight: "700",
  },
  pressedText: {
    opacity: 0.5,
  },
  footer: {
    textAlign: "center",
    fontSize: 11,
    letterSpacing: 0.8,
    lineHeight: 16,
    color: "#7E718E",
    marginTop: 24,
  },
});