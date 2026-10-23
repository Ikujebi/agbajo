import React from 'react';
import { Alert, Linking, Pressable } from 'react-native';

type ExternalLinkProps = {
  href: string;
  children: React.ReactNode;
  asChild?: boolean;
};

export function ExternalLink({
  href,
  children,
}: ExternalLinkProps) {
  const openLink = async () => {
    try {
      await Linking.openURL(href);
    } catch {
      Alert.alert('Unable to open link', href);
    }
  };

  return <Pressable onPress={openLink}>{children}</Pressable>;
}