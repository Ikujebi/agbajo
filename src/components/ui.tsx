import React from 'react';
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput,
  type TextInputProps, type TextStyle, View, type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, radius } from '@/lib/theme';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function Screen({ children, scroll = true, style, refreshing, onRefresh }: ScreenProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['left', 'right', 'bottom']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[s.pad, style]}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, s.pad, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'danger' | 'ghost';
  small?: boolean;
  style?: ViewStyle;
};

export function Button({ title, onPress, loading, disabled, variant = 'primary', small, style }: ButtonProps) {
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : 'transparent';
  const fg = variant === 'outline' || variant === 'ghost' ? colors.primary : '#fff';
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      disabled={off}
      style={({ pressed }) => [
        s.btn,
        small && s.btnSmall,
        { backgroundColor: bg, borderColor: variant === 'outline' ? colors.primary : variant === 'ghost' ? 'transparent' : bg },
        { opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontWeight: '600', fontSize: small ? 13 : 15 }}>{title}</Text>}
    </Pressable>
  );
}

export function Input({ label, error, ...props }: TextInputProps & { label?: string; error?: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        accessibilityLabel={label ?? props.placeholder}
        {...props}
        style={[s.input, props.multiline && { height: 90, textAlignVertical: 'top' }, error ? { borderColor: colors.danger } : null, props.style]}
      />
      {error ? <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}

export function Card({ children, onPress, style }: { children: React.ReactNode; onPress?: () => void; style?: ViewStyle }) {
  if (!onPress) return <View style={[s.card, style]}>{children}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.card, style, pressed && { opacity: 0.85 }]}>
      {children}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[s.chip, selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
    >
      <Text style={{ color: selected ? '#fff' : colors.text, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ text, color = colors.muted }: { text: string; color?: string }) {
  return (
    <View style={{ backgroundColor: color + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm, alignSelf: 'flex-start' }}>
      <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{text}</Text>
    </View>
  );
}

export const Title = ({ children }: { children: React.ReactNode }) => <Text style={s.title}>{children}</Text>;
export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text style={{ fontWeight: '700', fontSize: 15, color: colors.text, marginTop: 8, marginBottom: 8 }}>{children}</Text>
);
export const Muted = ({ children, style }: { children: React.ReactNode; style?: TextStyle }) => (
  <Text style={[{ color: colors.muted, fontSize: 13 }, style]}>{children}</Text>
);
export const Empty = ({ text }: { text: string }) => (
  <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 32, paddingHorizontal: 16 }}>{text}</Text>
);
export const Row = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }, style]}>{children}</View>
);

export function Loading({ text = 'Loading…' }: { text?: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
      <ActivityIndicator color={colors.primary} />
      <Muted>{text}</Muted>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 32, gap: 12, paddingHorizontal: 16 }}>
      <Text style={{ color: colors.danger, textAlign: 'center' }}>{message}</Text>
      {onRetry ? <Button small variant="outline" title="Try again" onPress={onRetry} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 32 },
  btn: { borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, minHeight: 46 },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, minHeight: 36 },
  label: { fontSize: 13, color: colors.muted, marginBottom: 4, fontWeight: '500' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: colors.text },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 12 },
});
