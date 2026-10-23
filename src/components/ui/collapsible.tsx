
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

type CollapsibleProps = {
  title: string;
  children: React.ReactNode;
};

export function Collapsible({ title, children }: CollapsibleProps) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable
        onPress={() => setOpen((previous) => !previous)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text>{open ? '− ' : '+ '}{title}</Text>
      </Pressable>

      {open && <View>{children}</View>}
    </View>
  );
}
