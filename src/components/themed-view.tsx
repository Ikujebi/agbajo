import React from 'react';
import {
  View,
  useColorScheme,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

type ViewType = 'default' | 'background' | 'backgroundElement';

type ThemedViewProps = ViewProps & {
  type?: ViewType;
};

export function ThemedView({
  type = 'default',
  style,
  ...props
}: ThemedViewProps) {
  const isDark = useColorScheme() === 'dark';

  const typeStyles: Record<ViewType, ViewStyle> = {
    default: {},
    background: {
      backgroundColor: isDark ? '#151718' : '#fff',
    },
    backgroundElement: {
      backgroundColor: isDark ? '#222426' : '#f2f2f2',
    },
  };

  return <View {...props} style={[typeStyles[type], style]} />;
}