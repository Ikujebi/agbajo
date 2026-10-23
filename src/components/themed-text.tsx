import React from 'react';
import {
  Text,
  useColorScheme,
  type TextProps,
  type TextStyle,
} from 'react-native';

type TextType =
  | 'default'
  | 'title'
  | 'subtitle'
  | 'small'
  | 'smallBold'
  | 'code'
  | 'link'
  | 'linkPrimary';

type ThemedTextProps = TextProps & {
  type?: TextType;
  themeColor?: string;
};

export function ThemedText({
  type = 'default',
  themeColor,
  style,
  ...props
}: ThemedTextProps) {
  const isDark = useColorScheme() === 'dark';

  const typeStyles: Record<TextType, TextStyle> = {
    default: { fontSize: 16 },
    title: { fontSize: 32, fontWeight: 'bold' },
    subtitle: { fontSize: 20, fontWeight: 'bold' },
    small: { fontSize: 12 },
    smallBold: { fontSize: 12, fontWeight: 'bold' },
    code: {
      fontFamily: 'monospace',
      fontSize: 14,
      backgroundColor: isDark ? '#333' : '#eee',
    },
    link: { color: isDark ? '#9BA1FF' : '#384BFF' },
    linkPrimary: { color: isDark ? '#9BA1FF' : '#384BFF' },
  };

  return (
    <Text
      {...props}
      style={[
        { color: themeColor ?? (isDark ? '#ECEDEE' : '#11181C') },
        typeStyles[type],
        style,
      ]}
    />
  );
}