import { useQuery } from '@tanstack/react-query';
import { api } from './api/client';
import type { Membership } from './api/types';

export const useMemberships = () =>
  useQuery<Membership[]>({ queryKey: ['mine'], queryFn: async () => (await api.get('/organizations/mine')).data });

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
