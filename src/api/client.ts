import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuth } from '@/store/auth';
import { mockAdapter } from './mock';

export const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';

/**
 * Full base URL of your NestJS API, including any global prefix, e.g.
 *   http://192.168.1.20:3000/api      (physical device on your Wi-Fi)
 *   http://10.0.2.2:3000/api          (Android emulator)
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const create = () =>
  axios.create({ baseURL: API_URL, timeout: 15_000, adapter: USE_MOCKS ? mockAdapter : undefined });

export const api = create();
/** Used for /auth/refresh so it never triggers our own interceptors. */
const bare = create();

api.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// One refresh at a time: parallel 401s all wait on the same promise.
let refreshing: Promise<string> | null = null;

async function refreshTokens(): Promise<string> {
  const { refreshToken, setTokens } = useAuth.getState();
  if (!refreshToken) throw new Error('No refresh token');
  const { data } = await bare.post('/auth/refresh', { refreshToken });
  await setTokens(data.accessToken, data.refreshToken ?? refreshToken);
  return data.accessToken as string;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isAuthRoute = original?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && original && !original._retried && !isAuthRoute) {
      original._retried = true;
      try {
        refreshing ??= refreshTokens().finally(() => {
          refreshing = null;
        });
        const token = await refreshing;
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        // Refresh token is dead: drop the session. The root layout redirects to login.
        await useAuth.getState().logout();
      }
    }
    return Promise.reject(error);
  },
);

/** Turns any thrown value into a message that is safe to show a user. */
export function errMsg(e: unknown): string {
  if (axios.isAxiosError(e)) {
    if (!e.response) {
      return e.code === 'ECONNABORTED' ? 'The request timed out. Please try again.' : 'Cannot reach the server. Check your connection.';
    }
    const m = (e.response.data as { message?: string | string[] } | undefined)?.message;
    if (Array.isArray(m)) return m.join('\n'); // NestJS class-validator format
    if (typeof m === 'string' && m) return m;
    return `Something went wrong (${e.response.status}).`;
  }
  return e instanceof Error ? e.message : 'Something went wrong.';
}
