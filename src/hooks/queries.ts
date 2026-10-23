import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { GateLog, Member, Membership, MembershipStatus, Notif, Org, OrgType, Pass, Product } from '@/api/types';

/** Central query keys so invalidation never drifts from the hooks. */
export const qk = {
  mine: ['mine'] as const,
  passes: ['passes'] as const,
  notifs: ['notifs'] as const,
  gateLog: (orgId: string) => ['gatelog', orgId] as const,
  members: (orgId: string, status?: MembershipStatus) => ['members', orgId, status] as const,
  products: (q: string, inStock: boolean) => ['products', q, inStock] as const,
  orgs: (type: OrgType, q: string) => ['orgs', type, q] as const,
};

export const useMemberships = () =>
  useQuery<Membership[]>({ queryKey: qk.mine, queryFn: async () => (await api.get('/organizations/mine')).data });

export const useMyPasses = () =>
  useQuery<Pass[]>({ queryKey: qk.passes, queryFn: async () => (await api.get('/visitors/mine')).data });

export const useNotifications = () =>
  useQuery<Notif[]>({
    queryKey: qk.notifs,
    queryFn: async () => (await api.get('/users/notifications')).data,
    refetchInterval: 60_000,
  });

export const useGateLog = (orgId: string) =>
  useQuery<GateLog[]>({
    queryKey: qk.gateLog(orgId),
    queryFn: async () => (await api.get(`/visitors/log/${orgId}`)).data,
    refetchInterval: 20_000,
  });

export const useOrgMembers = (orgId: string, status: MembershipStatus) =>
  useQuery<Member[]>({
    queryKey: qk.members(orgId, status),
    queryFn: async () => (await api.get(`/organizations/${orgId}/members`, { params: { status } })).data,
  });

export const useProducts = (q: string, inStock: boolean) =>
  useQuery<Product[]>({
    queryKey: qk.products(q, inStock),
    queryFn: async () => (await api.get('/products', { params: { q: q || undefined, inStock: inStock ? 'true' : undefined } })).data,
  });

export const useOrgSearch = (type: OrgType, q: string) =>
  useQuery<Org[]>({
    queryKey: qk.orgs(type, q),
    queryFn: async () => (await api.get('/organizations', { params: { type, q: q || undefined } })).data,
  });
