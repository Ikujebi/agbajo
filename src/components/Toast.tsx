import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/theme';

type Kind = 'success' | 'error' | 'info';
type Api = { show: (message: string, kind?: Kind) => void };

const Ctx = createContext<Api>({ show: () => {} });
export const useToast = () => useContext(Ctx);

const bg: Record<Kind, string> = { success: colors.success, error: colors.danger, info: colors.text };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string; kind: Kind } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, kind: Kind = 'info') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message, kind });
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View
          key={toast.id}
          entering={FadeInUp.duration(180)}
          exiting={FadeOutUp.duration(180)}
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, backgroundColor: bg[toast.kind], borderRadius: 12, padding: 14, zIndex: 100 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>{toast.message}</Text>
        </Animated.View>
      )}
    </Ctx.Provider>
  );
}
