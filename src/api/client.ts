import axios from 'axios';
import { useAuth } from '../store/auth';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
export const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 15000 });

api.interceptors.request.use((cfg) => {
  const t = useAuth.getState().accessToken;
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

let refreshing: Promise<string | null> | null = null;

async function refreshTokens(): Promise<string | null> {
  const { refreshToken, setTokens, logout } = useAuth.getState();
  try {
    const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
    await setTokens(data.accessToken, data.refreshToken);
    return data.accessToken as string;
  } catch {
    await logout();
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const orig = err.config;
    const isAuthCall = orig?.url?.includes('/auth/');
    if (err.response?.status === 401 && !orig._retry && !isAuthCall && useAuth.getState().refreshToken) {
      orig._retry = true;
      if (!refreshing) refreshing = refreshTokens().finally(() => { refreshing = null; });
      const token = await refreshing;
      if (token) {
        orig.headers.Authorization = `Bearer ${token}`;
        return api(orig);
      }
    }
    return Promise.reject(err);
  },
);

export const errMsg = (e: any): string => {
  const m = e?.response?.data?.message;
  if (Array.isArray(m)) return m.join('\n');
  return m ?? e?.message ?? 'Something went wrong';
};
