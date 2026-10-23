import type { Membership, MembershipRole, OrgType } from '@/api/types';

/**
 * The ONLY place that compares role strings. Screens call these helpers,
 * so adding a role to the backend enum means editing this file and nothing else.
 */
export const ADMIN_ROLES: MembershipRole[] = ['OWNER', 'CHAIRMAN', 'SUPER_ADMIN', 'ADMIN'];

export const isAdminRole = (role: MembershipRole) => ADMIN_ROLES.includes(role);

const approved = (m: Membership) => m.status === 'APPROVED';
const has = (m: Membership, roles: MembershipRole[]) => roles.includes(m.role);

export const canManageMembers = (m: Membership) => approved(m) && isAdminRole(m.role);
export const canBroadcast = canManageMembers;

export const canOpenGate = (m: Membership) =>
  approved(m) && m.organization.type === 'ESTATE' && (isAdminRole(m.role) || has(m, ['SECURITY', 'MANAGER']));

export const canCreatePass = (m: Membership) =>
  approved(m) && m.organization.type === 'ESTATE' && (isAdminRole(m.role) || has(m, ['RESIDENT']));

export const canManageShop = (m: Membership) =>
  approved(m) &&
  m.organization.type === 'SHOP' &&
  (isAdminRole(m.role) || has(m, ['MANAGER', 'STAFF', 'ATTENDANT', 'ACCOUNTANT']));

/** Roles an admin may hand out, per organisation type. */
export const ASSIGNABLE_ROLES: Record<OrgType, MembershipRole[]> = {
  ESTATE: ['RESIDENT', 'SECURITY', 'MANAGER', 'ACCOUNTANT', 'ADMIN'],
  SHOP: ['STAFF', 'ATTENDANT', 'MANAGER', 'ACCOUNTANT', 'RIDER', 'ADMIN'],
  CHURCH: ['MEMBER', 'MODERATOR', 'ACCOUNTANT', 'ADMIN'],
  MOSQUE: ['MEMBER', 'MODERATOR', 'ACCOUNTANT', 'ADMIN'],
  ARTISAN: ['STAFF', 'MANAGER', 'ADMIN'],
  COMPANY: ['STAFF', 'MANAGER', 'ACCOUNTANT', 'ADMIN'],
  COMMUNITY_GROUP: ['MEMBER', 'MODERATOR', 'ACCOUNTANT', 'ADMIN'],
  OTHER: ['MEMBER', 'MODERATOR', 'ADMIN'],
};

/** Roles that hand out wide powers and deserve a confirmation prompt. */
export const needsConfirm = (role: MembershipRole) => isAdminRole(role) || role === 'SECURITY';
