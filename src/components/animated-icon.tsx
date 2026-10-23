
import React from 'react';
import { Text } from 'react-native';

type AnimatedIconProps = {
  name: string;
  color?: string;
  size?: number;
};

export function AnimatedIcon({
  name,
  color = '#2563eb',
  size = 24,
}: AnimatedIconProps) {
  return (
    <Text style={{ color, fontSize: size }}>
      {name}
    </Text>
  );
}
