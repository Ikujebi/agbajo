export const fmtDate = (iso: string | Date) =>
  new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const fmtTime = (iso: string | Date) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

/** Prisma serialises Decimal as a string ("9500.00"); accept either. */
export const naira = (v: string | number | null | undefined) =>
  `₦${Number(v ?? 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;

export const titleCase = (s: string) =>
  s
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
