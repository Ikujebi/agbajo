
import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';

import { useAuth } from '@/store/auth';
import { mockAdapter } from './mock';

/**
 * Set EXPO_PUBLIC_USE_MOCKS=false in .env to use your deployed backend.
 */
export const USE_MOCKS =
  process.env.EXPO_PUBLIC_USE_MOCKS === 'true';

/**
 * Base URL of the NestJS API.
 *
 * Production:
 * https://agbajoapi.onrender.com
 *
 * If your NestJS app uses app.setGlobalPrefix('api'),
 * set EXPO_PUBLIC_API_URL to:
 * https://agbajoapi.onrender.com/api
 */
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ??
  'https://agbajoapi.onrender.com'
).replace(/\/+$/, '');

const create = () =>
  axios.create({
    baseURL: API_URL,
    timeout: 30_000,
    adapter: USE_MOCKS ? mockAdapter : undefined,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

/**
 * Main API client.
 */
export const api = create();

/**
 * Separate client for token refresh requests.
 * This prevents refresh requests from triggering the
 * main client's response interceptor.
 */
const bare = create();

/**
 * Attach the current access token to outgoing requests.
 */
api.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * Prevent multiple simultaneous token refresh requests.
 */
let refreshing: Promise<string> | null = null;

async function refreshTokens(): Promise<string> {
  const { refreshToken, setTokens } = useAuth.getState();

  if (!refreshToken) {
    throw new Error('No refresh token available.');
  }

  const { data } = await bare.post<{
    accessToken: string;
    refreshToken?: string;
  }>('/auth/refresh', { refreshToken });

  const newAccessToken = data.accessToken;
  const newRefreshToken = data.refreshToken ?? refreshToken;

  if (!newAccessToken) {
    throw new Error('The server did not return an access token.');
  }

  await setTokens(newAccessToken, newRefreshToken);

  return newAccessToken;
}

/**
 * Refresh expired access tokens and retry eligible requests once.
 */
api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;

    const isAuthRoute = original?.url?.startsWith('/auth/');

    if (
      error.response?.status !== 401 ||
      !original ||
      original._retried ||
      isAuthRoute
    ) {
      return Promise.reject(error);
    }

    original._retried = true;

    try {
      refreshing ??= refreshTokens().finally(() => {
        refreshing = null;
      });

      const accessToken = await refreshing;

      original.headers.Authorization = `Bearer ${accessToken}`;

      return api(original);
    } catch {
      // Refresh failed. Clear the invalid session.
      await useAuth.getState().logout();

      return Promise.reject(error);
    }
  },
);

/**
 * Convert API and network errors into user-friendly messages.
 */
export function errMsg(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return 'The request timed out. Please try again.';
      }

      return 'Cannot reach the server. Check your internet connection and try again.';
    }

    const message = (
      error.response.data as
        | { message?: string | string[] }
        | undefined
    )?.message;

    if (Array.isArray(message)) {
      return message.join('\n');
    }

    if (typeof message === 'string' && message.length > 0) {
      return message;
    }

    return `Something went wrong (${error.response.status}).`;
  }

  return error instanceof Error
    ? error.message
    : 'Something went wrong.';
}
