import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User } from '@/api/types';

// Tokens and user live under separate keys so neither approaches SecureStore's size limits.
const TOKENS_KEY = 'auth.tokens';
const USER_KEY = 'auth.user';

type Tokens = { accessToken: string; refreshToken: string };

type State = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  ready: boolean;
  hydrate: () => Promise<void>;
  setSession: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
};

const writeTokens = (t: Tokens) => SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(t));
const writeUser = (u: User) => SecureStore.setItemAsync(USER_KEY, JSON.stringify(u));

export const useAuth = create<State>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  ready: false,

  hydrate: async () => {
    try {
      const [rawTokens, rawUser] = await Promise.all([
        SecureStore.getItemAsync(TOKENS_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);
      if (rawTokens && rawUser) {
        const tokens = JSON.parse(rawTokens) as Tokens;
        set({ user: JSON.parse(rawUser) as User, ...tokens });
      }
    } catch {
      // corrupted storage: start logged out
    }
    set({ ready: true });
  },

  setSession: async (user, accessToken, refreshToken) => {
    set({ user, accessToken, refreshToken });
    await Promise.all([writeTokens({ accessToken, refreshToken }), writeUser(user)]);
  },

  setTokens: async (accessToken, refreshToken) => {
    set({ accessToken, refreshToken });
    await writeTokens({ accessToken, refreshToken });
  },

  setUser: async (user) => {
    set({ user });
    await writeUser(user);
  },

  logout: async () => {
    set({ user: null, accessToken: null, refreshToken: null });
    await Promise.allSettled([SecureStore.deleteItemAsync(TOKENS_KEY), SecureStore.deleteItemAsync(USER_KEY)]);
  },
}));
