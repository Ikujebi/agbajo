import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';

export function Screen({ children, scroll = true, style }: { children: React.ReactNode; scroll?: boolean; style?: ViewStyle }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['left', 'right', 'bottom']}>
      {scroll ? (
        <ScrollView contentContainerStyle={[s.pad, style]} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      ) : (
        <View style={[{ flex: 1 }, s.pad, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Button({ title, onPress, loading, disabled, variant = 'primary', small }: {
  title: string; onPress: () => void; loading?: boolean; disabled?: boolean; variant?: 'primary' | 'outline' | 'danger'; small?: boolean;
}) {
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : 'transparent';
  const fg = variant === 'outline' ? colors.primary : '#fff';
  return (
    <Pressable
      onPress={onPress} disabled={disabled || loading}
      style={[s.btn, small && s.btnSmall, { backgroundColor: bg, borderColor: variant === 'outline' ? colors.primary : bg, opacity: disabled ? 0.5 : 1 }]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontWeight: '600', fontSize: small ? 13 : 15 }}>{title}</Text>}
    </Pressable>
  );
}

export function Input({ label, ...props }: TextInputProps & { label?: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TextInput placeholderTextColor={colors.muted} {...props} style={[s.input, props.multiline && { height: 90, textAlignVertical: 'top' }, props.style]} />
    </View>
  );
}

export function Card({ children, onPress, style }: { children: React.ReactNode; onPress?: () => void; style?: ViewStyle }) {
  const C: any = onPress ? Pressable : View;
  return <C onPress={onPress} style={[s.card, style]}>{children}</C>;
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
      <Text style={{ color: selected ? '#fff' : colors.text, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ text, color = colors.muted }: { text: string; color?: string }) {
  return (
    <View style={{ backgroundColor: color + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' }}>
      <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{text}</Text>
    </View>
  );
}

export const Title = ({ children }: { children: React.ReactNode }) => <Text style={s.title}>{children}</Text>;
export const Muted = ({ children, style }: { children: React.ReactNode; style?: any }) => <Text style={[{ color: colors.muted, fontSize: 13 }, style]}>{children}</Text>;
export const Empty = ({ text }: { text: string }) => <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 32 }}>{text}</Text>;
export const Row = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }, style]}>{children}</View>
);

const s = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 32 },
  btn: { borderRadius: 12, paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  label: { fontSize: 13, color: colors.muted, marginBottom: 4, fontWeight: '500' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: colors.text },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 12 },
});
