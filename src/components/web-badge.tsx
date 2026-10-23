
import React from 'react';
import { Platform, Text } from 'react-native';

export function WebBadge() {
  if (Platform.OS !== 'web') return null;

  return (
    <Text
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#e0e7ff',
        color: '#3730a3',
        overflow: 'hidden',
        fontSize: 12,
      }}
    >
      Web
    </Text>
  );
}
