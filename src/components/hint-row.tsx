import React from 'react';
import { Text, View } from 'react-native';

type HintRowProps = {
  title?: string;
  hint?: React.ReactNode;
  text?: string;
  icon?: React.ReactNode;
};

export function HintRow({ title, hint, text, icon }: HintRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginVertical: 6,
      }}
    >
      {icon}
      <View style={{ flex: 1 }}>
        {title ? (
          <Text style={{ fontWeight: '600', marginBottom: 3 }}>
            {title}
          </Text>
        ) : null}
        {hint ?? (text ? <Text>{text}</Text> : null)}
      </View>
    </View>
  );
}