import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User } from '../api/types';

type State = {
  user: User | null; accessToken: string | null; refreshToken: string | null; ready: boolean;
  hydrate: () => Promise<void>;
  setSession: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
};

const KEY = 'session';
const persist = (s: Pick<State, 'user' | 'accessToken' | 'refreshToken'>) =>
  SecureStore.setItemAsync(KEY, JSON.stringify({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }));

export const useAuth = create<State>((set, get) => ({
  user: null, accessToken: null, refreshToken: null, ready: false,
  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      if (raw) set(JSON.parse(raw));
    } catch {}
    set({ ready: true });
  },
  setSession: async (user, accessToken, refreshToken) => { set({ user, accessToken, refreshToken }); await persist(get()); },
  setTokens: async (accessToken, refreshToken) => { set({ accessToken, refreshToken }); await persist(get()); },
  setUser: async (user) => { set({ user }); await persist(get()); },
  logout: async () => { set({ user: null, accessToken: null, refreshToken: null }); await SecureStore.deleteItemAsync(KEY); },
}));
