import type { Pass, PassStatus } from '@/api/types';
import { colors } from '@/lib/theme';

/**
 * The server only flips a pass to EXPIRED/COMPLETED when something touches it,
 * so an ACTIVE pass can already be dead. Derive what the user should see.
 */
export function effectiveStatus(p: Pass, now = Date.now()): PassStatus {
  if (p.status !== 'ACTIVE') return p.status;
  if (new Date(p.validUntil).getTime() < now) return 'EXPIRED';
  if (p.entriesUsed >= p.maxEntries) return 'COMPLETED';
  return 'ACTIVE';
}

export const passStatusColor: Record<PassStatus, string> = {
  ACTIVE: colors.success,
  COMPLETED: colors.muted,
  EXPIRED: colors.warn,
  REVOKED: colors.danger,
};
