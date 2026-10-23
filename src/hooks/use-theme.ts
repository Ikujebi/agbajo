import { useColorScheme } from 'react-native';

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    colorScheme: colorScheme ?? 'light',
    isDark,
    background: isDark ? '#151718' : '#FFFFFF',
    text: isDark ? '#ECEDEE' : '#11181C',
  };
}