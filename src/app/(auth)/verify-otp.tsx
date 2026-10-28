import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEvent,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, errMsg } from "@/api/client";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/store/auth";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

const BRAND_PURPLE = "#6D28D9";
const BRAND_RED_TEXT = "#BE123C";
const PLACEHOLDER = "#9A8BAF";

export default function VerifyOtpScreen() {
  const toast = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setSession = useAuth((s) => s.setSession);

  // Retrieve parameters passed during registration/login (e.g., target email/phone)
  const { target = "your account", purpose = "registration" } =
    useLocalSearchParams<{ target?: string; purpose?: string }>();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const [errorText, setErrorText] = useState("");

  const inputRefs = useRef<Array<React.ComponentRef<typeof TextInput> | null>>(
    [],
  );
  const shake = useRef(new Animated.Value(0)).current;
  const inFlight = useRef(false);

  // Cooldown Timer Logic for Resend OTP
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

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

  // Submit OTP Code
  const handleVerify = useCallback(
    async (codeToSubmit?: string) => {
      const fullCode = codeToSubmit ?? otp.join("");
      if (fullCode.length < OTP_LENGTH || inFlight.current) {
        if (fullCode.length < OTP_LENGTH) {
          setErrorText("Please enter the complete 6-digit code.");
          runShake();
        }
        return;
      }

      setErrorText("");
      inFlight.current = true;
      setLoading(true);
      Keyboard.dismiss();

      try {
        const { data } = await api.post("/auth/verify-otp", {
          otp: fullCode,
          target,
          purpose,
        });

        toast.show("Verification successful!", "success");

        // If backend issues a session immediately upon verification
        if (data?.user && data?.accessToken) {
          await setSession(data.user, data.accessToken, data.refreshToken);
        } else {
          router.replace("/(auth)/login");
        }
      } catch (error) {
        const message = errMsg(error);
        setErrorText(message);
        toast.show(message, "error");
        runShake();
      } finally {
        inFlight.current = false;
        setLoading(false);
      }
    },
    [otp, target, purpose, runShake, setSession, toast, router],
  );

  // Resend OTP Code
  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    setErrorText("");

    try {
      await api.post("/auth/resend-otp", { target, purpose });
      toast.show("New verification code sent!", "success");
      setCooldown(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (error) {
      toast.show(errMsg(error), "error");
    } finally {
      setResending(false);
    }
  };

  // Handle Text Change (including multi-digit Paste)
  const handleChangeText = (text: string, index: number) => {
    setErrorText("");
    const cleaned = text.replace(/[^0-9]/g, "");

    // Handle Pasted Full Code
    if (cleaned.length >= OTP_LENGTH) {
      const pastedDigits = cleaned.slice(0, OTP_LENGTH).split("");
      setOtp(pastedDigits);
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      handleVerify(pastedDigits.join(""));
      return;
    }

    // Handle Single Digit Entry
    const newOtp = [...otp];
    newOtp[index] = cleaned.slice(-1);
    setOtp(newOtp);

    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when last box is filled
    if (index === OTP_LENGTH - 1 && cleaned) {
      const code = newOtp.join("");
      if (code.length === OTP_LENGTH) {
        handleVerify(code);
      }
    }
  };

  // Handle Backspace Key Navigation
  const handleKeyPress = (e: TextInputKeyPressEvent, index: number) => {
  if (e.nativeEvent.key === "Backspace") {
    if (!otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  }
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
            <Text style={styles.brandName} accessibilityRole="header">
              Adugbo
            </Text>
            <Text style={styles.brandCaption}>Your community, closer.</Text>
          </View>

          {/* Main Card */}
          <Animated.View
            style={[styles.card, { transform: [{ translateX: shake }] }]}
          >
            <Text style={styles.heading}>Verify your account</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit verification code sent to{" "}
              <Text style={styles.targetText}>{target}</Text>.
            </Text>

            {/* OTP Input Grid */}
            <View style={styles.otpRow}>
              {Array.from({ length: OTP_LENGTH }).map((_, index) => {
                const isFocused = focusedIndex === index;
                const hasValue = !!otp[index];

                return (
                  <View
                    key={index}
                    style={[
                      styles.otpBox,
                      isFocused && styles.otpBoxFocused,
                      hasValue && styles.otpBoxFilled,
                      !!errorText && styles.otpBoxError,
                    ]}
                  >
                    <TextInput
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      style={styles.otpInput}
                      value={otp[index]}
                      onChangeText={(text) => handleChangeText(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() =>
                        setFocusedIndex((prev) =>
                          prev === index ? null : prev,
                        )
                      }
                      keyboardType="number-pad"
                      maxLength={OTP_LENGTH} // Allows pasting full string
                      selectTextOnFocus
                      editable={!loading}
                      accessibilityLabel={`Digit ${index + 1} of ${OTP_LENGTH}`}
                    />
                  </View>
                );
              })}
            </View>

            {!!errorText && (
              <Text style={styles.errorText} accessibilityLiveRegion="polite">
                {errorText}
              </Text>
            )}

            {/* Submit Button */}
            <Pressable
              onPress={() => handleVerify()}
              disabled={loading || otp.join("").length < OTP_LENGTH}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && !loading && styles.buttonPressed,
                (loading || otp.join("").length < OTP_LENGTH) &&
                  styles.buttonDisabled,
              ]}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitText}>Verify & Continue</Text>
              )}
            </Pressable>

            {/* Resend Code Section */}
            <View style={styles.resendRow}>
              <Text style={styles.resendLabel}>Didn’t receive code?</Text>

              {cooldown > 0 ? (
                <Text style={styles.timerText}>
                  Resend in <Text style={styles.timerBold}>{cooldown}s</Text>
                </Text>
              ) : (
                <Pressable
                  onPress={handleResend}
                  disabled={resending}
                  hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                >
                  <Text style={styles.resendLink}>
                    {resending ? "Sending..." : "Resend code"}
                  </Text>
                </Pressable>
              )}
            </View>
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
    marginBottom: 24,
  },
  targetText: {
    color: "#1E1033",
    fontWeight: "700",
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  otpBox: {
    flex: 1,
    height: 54,
    borderWidth: 1,
    borderColor: "#D6C4EE",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  otpBoxFocused: {
    borderColor: BRAND_PURPLE,
    borderWidth: 2,
  },
  otpBoxFilled: {
    backgroundColor: "#F9F5FF",
    borderColor: "#C4A6F5",
  },
  otpBoxError: {
    borderColor: "#B91C1C",
  },
  otpInput: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E1033",
    textAlign: "center",
    width: "100%",
    height: "100%",
  },
  errorText: {
    color: BRAND_RED_TEXT,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
    textAlign: "center",
    fontWeight: "600",
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
    opacity: 0.6,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 6,
  },
  resendLabel: {
    color: "#6E617E",
    fontSize: 14,
  },
  resendLink: {
    color: BRAND_RED_TEXT,
    fontSize: 14,
    fontWeight: "700",
  },
  timerText: {
    color: PLACEHOLDER,
    fontSize: 14,
  },
  timerBold: {
    fontWeight: "700",
    color: "#47365C",
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
