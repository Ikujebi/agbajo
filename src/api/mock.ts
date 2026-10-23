/**
 * In-memory fake backend so every screen runs without the NestJS server.
 * Enabled with EXPO_PUBLIC_USE_MOCKS=true. State resets on app reload.
 *
 * Demo accounts (password: password123)
 *   08012345678  Chinedu Okafor  resident of Lekki Gardens, owns a shop, church member
 *   08099999999  Musa Bello      security guard at Lekki Gardens (gate screen)
 *   08077777777  Halima Yusuf    estate chairman (members screen)
 * Demo visitor code for the gate: K7M2QX
 */
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { isAdminRole } from '@/lib/permissions';
import type {
  GateLog, Member, Membership, MembershipRole, MembershipStatus, Notif, Org, OrgType, Pass, Product, User,
} from './types';

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const HOUR = 3_600_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const iso = (t: number | Date) => new Date(t).toISOString();
const ago = (ms: number) => iso(Date.now() - ms);
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode = () => Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

/* ----------------------------- seed data ----------------------------- */

type DbUser = User & { password: string };
type DbMembership = { id: string; userId: string; organizationId: string; role: MembershipRole; status: MembershipStatus; unit?: string | null; joinedAt?: string | null };
type DbPass = Pass & { code: string };
type DbLog = GateLog & { organizationId: string; securityId: string };

const baseUser = { isSuperAdmin: false, chatPrivacy: 'EVERYONE' as const, password: 'password123' };
const users: DbUser[] = [
  { ...baseUser, id: 'u-chinedu', fullName: 'Chinedu Okafor', phone: '08012345678', email: 'chinedu@example.com', phoneVerifiedAt: ago(30 * 24 * HOUR) },
  { ...baseUser, id: 'u-musa', fullName: 'Musa Bello', phone: '08099999999', email: null },
  { ...baseUser, id: 'u-halima', fullName: 'Halima Yusuf', phone: '08077777777', email: 'halima@example.com' },
  { ...baseUser, id: 'u-amaka', fullName: 'Amaka Eze', phone: '08055555555', email: null },
  { ...baseUser, id: 'u-tunde', fullName: 'Tunde Balogun', phone: '08033333333', email: null },
];

const orgs: Org[] = [
  { id: 'org-estate', type: 'ESTATE', name: 'Lekki Gardens Estate', description: 'Gated residential estate with 24/7 security.', address: 'Km 22, Lekki-Epe Expressway', city: 'Lagos', state: 'Lagos', phone: '08011110000', isVerified: true, acceptingOrders: true },
  { id: 'org-estate2', type: 'ESTATE', name: 'Ajah Heights Court', address: 'Ajah Roundabout', city: 'Lagos', state: 'Lagos', isVerified: false, acceptingOrders: true },
  { id: 'org-shop', type: 'SHOP', name: 'Mama Nkechi Provisions', description: 'Groceries and provisions, delivered within the estate.', address: 'Shop 4, Lekki Gardens Mall', city: 'Lagos', state: 'Lagos', isVerified: true, acceptingOrders: true },
  { id: 'org-shop2', type: 'SHOP', name: 'FreshMart Ajah', address: 'Ajah Market Road', city: 'Lagos', state: 'Lagos', isVerified: false, acceptingOrders: true },
  { id: 'org-church', type: 'CHURCH', name: 'Victory Chapel Lekki', address: 'Chevron Drive', city: 'Lagos', state: 'Lagos', isVerified: true, acceptingOrders: false },
  { id: 'org-mosque', type: 'MOSQUE', name: 'Lekki Central Mosque', address: 'Admiralty Way', city: 'Lagos', state: 'Lagos', isVerified: true, acceptingOrders: false },
];

const memberships: DbMembership[] = [
  { id: 'm1', userId: 'u-chinedu', organizationId: 'org-estate', role: 'RESIDENT', status: 'APPROVED', unit: 'Block B, Flat 4', joinedAt: ago(200 * 24 * HOUR) },
  { id: 'm2', userId: 'u-chinedu', organizationId: 'org-shop', role: 'OWNER', status: 'APPROVED', joinedAt: ago(90 * 24 * HOUR) },
  { id: 'm3', userId: 'u-chinedu', organizationId: 'org-church', role: 'MEMBER', status: 'APPROVED', joinedAt: ago(400 * 24 * HOUR) },
  { id: 'm4', userId: 'u-chinedu', organizationId: 'org-mosque', role: 'MEMBER', status: 'PENDING' },
  { id: 'm5', userId: 'u-musa', organizationId: 'org-estate', role: 'SECURITY', status: 'APPROVED', joinedAt: ago(300 * 24 * HOUR) },
  { id: 'm6', userId: 'u-halima', organizationId: 'org-estate', role: 'CHAIRMAN', status: 'APPROVED', joinedAt: ago(500 * 24 * HOUR) },
  { id: 'm7', userId: 'u-amaka', organizationId: 'org-estate', role: 'RESIDENT', status: 'APPROVED', unit: 'Block A, Flat 2', joinedAt: ago(60 * 24 * HOUR) },
  { id: 'm8', userId: 'u-tunde', organizationId: 'org-estate', role: 'RESIDENT', status: 'PENDING', unit: 'Block C, Flat 9' },
];

const passes: DbPass[] = [
  { id: 'p1', code: 'K7M2QX', organizationId: 'org-estate', hostId: 'u-chinedu', visitorName: 'Ngozi Adeyemi', visitorPhone: '08022223333', purpose: 'Family visit', validFrom: ago(HOUR), validUntil: iso(Date.now() + 11 * HOUR), maxEntries: 2, entriesUsed: 0, status: 'ACTIVE', createdAt: ago(HOUR) },
  { id: 'p2', code: 'R4T8WN', organizationId: 'org-estate', hostId: 'u-chinedu', visitorName: 'Dispatch rider (Jumia)', purpose: 'Package delivery', validFrom: ago(30 * HOUR), validUntil: ago(18 * HOUR), maxEntries: 1, entriesUsed: 0, status: 'EXPIRED', createdAt: ago(30 * HOUR) },
  { id: 'p3', code: 'Z9B3CD', organizationId: 'org-estate', hostId: 'u-chinedu', visitorName: 'Tolu (plumber)', purpose: 'Fix kitchen sink', validFrom: ago(52 * HOUR), validUntil: ago(28 * HOUR), maxEntries: 1, entriesUsed: 1, status: 'COMPLETED', createdAt: ago(52 * HOUR) },
];

const gateLogs: DbLog[] = [
  { id: 'g1', organizationId: 'org-estate', securityId: 'u-musa', passId: 'p3', action: 'ENTRY', visitorName: 'Tolu (plumber)', createdAt: ago(40 * HOUR) },
  { id: 'g2', organizationId: 'org-estate', securityId: 'u-musa', passId: 'p3', action: 'EXIT', visitorName: 'Tolu (plumber)', createdAt: ago(38 * HOUR) },
  { id: 'g3', organizationId: 'org-estate', securityId: 'u-musa', passId: null, action: 'DENIED', visitorName: null, notes: 'Invalid code', createdAt: ago(5 * HOUR) },
];

const product = (id: string, organizationId: string, name: string, price: string, quantity: number, unit: string, reservedQty = 0): Product => {
  const org = orgs.find((o) => o.id === organizationId)!;
  return {
    id, organizationId, name, price, quantity, reservedQty, lowStockAt: 5, unit,
    status: quantity > 0 ? 'ACTIVE' : 'OUT_OF_STOCK', isAvailable: true,
    organization: { id: org.id, name: org.name, city: org.city, acceptingOrders: org.acceptingOrders },
  };
};
const products: Product[] = [
  product('pr1', 'org-shop', 'Indomie Chicken (carton of 40)', '9500.00', 24, 'carton'),
  product('pr2', 'org-shop', 'Peak Milk Tin 400g', '3200.00', 3, 'tin', 1),
  product('pr3', 'org-shop', 'Golden Penny Semovita 5kg', '6800.00', 12, 'bag'),
  product('pr4', 'org-shop', 'Rice 50kg (Ofada)', '78000.00', 0, 'bag'),
  product('pr5', 'org-shop', 'Eggs (crate of 30)', '4500.00', 40, 'crate'),
  product('pr6', 'org-shop2', 'Garri Ijebu 5kg', '3800.00', 18, 'bag'),
  product('pr7', 'org-shop2', 'Titus Sardine 125g', '1300.00', 60, 'tin'),
  product('pr8', 'org-shop2', 'Groundnut Oil 5L', '14500.00', 6, 'bottle'),
];

const notifs: (Notif & { userId: string })[] = [
  { id: 'n1', userId: 'u-chinedu', type: 'VISITOR_PASS', title: 'Visitor pass created', body: 'Ngozi Adeyemi can now enter Lekki Gardens Estate.', createdAt: ago(HOUR) },
  { id: 'n2', userId: 'u-chinedu', type: 'GENERAL', title: 'Welcome to the neighbourhood', body: 'Your estate membership has been approved.', readAt: ago(24 * HOUR), createdAt: ago(48 * HOUR) },
  { id: 'n3', userId: 'u-chinedu', type: 'ORDER', title: 'Order delivered', body: 'Your order #NB-20931 from Mama Nkechi Provisions was delivered.', createdAt: ago(8 * HOUR) },
];

/* ------------------------------ helpers ------------------------------ */

const publicUser = ({ password: _p, ...u }: DbUser): User => u;
const orgOf = (id: string) => orgs.find((o) => o.id === id)!;
const toMembership = (m: DbMembership): Membership => ({ ...m, organization: orgOf(m.organizationId) });
const myMembership = (userId: string, orgId: string) => memberships.find((m) => m.userId === userId && m.organizationId === orgId);
const session = (u: DbUser) => ({ user: publicUser(u), accessToken: `mock.${u.id}.${uid()}`, refreshToken: `mockr.${u.id}.${uid()}` });
const stripCode = ({ code: _c, ...p }: DbPass): Pass => p;

const requireRole = (userId: string, orgId: string, test: (role: MembershipRole) => boolean) => {
  const m = myMembership(userId, orgId);
  if (!m || m.status !== 'APPROVED' || !test(m.role)) throw new HttpError(403, 'You are not allowed to do that');
  return m;
};
const gateRole = (r: MembershipRole) => isAdminRole(r) || r === 'SECURITY' || r === 'MANAGER';

const effective = (p: DbPass): DbPass => {
  if (p.status === 'ACTIVE' && new Date(p.validUntil).getTime() < Date.now()) p.status = 'EXPIRED';
  return p;
};

/* ------------------------------ routing ------------------------------ */

type Ctx = { params: Record<string, string>; query: Record<string, any>; body: any; user: DbUser | null };
type Reply = { __reply: true; status: number; data: unknown };
const reply = (data: unknown, status = 200): Reply => ({ __reply: true, status, data });
type Handler = (c: Ctx) => unknown | Promise<unknown>;

const routes: { method: string; re: RegExp; keys: string[]; handler: Handler; auth: boolean }[] = [];
function on(method: string, pattern: string, handler: Handler, auth = true) {
  const keys: string[] = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_m, k) => (keys.push(k), '([^/]+)')) + '$');
  routes.push({ method, re, keys, handler, auth });
}
const need = (c: Ctx) => {
  if (!c.user) throw new HttpError(401, 'Unauthorized');
  return c.user;
};

// ---- auth
on('POST', '/auth/login', ({ body }) => {
  const id = String(body?.identifier ?? '').trim().toLowerCase();
  const u = users.find((x) => x.phone === id || x.email?.toLowerCase() === id);
  if (!u || u.password !== body?.password) throw new HttpError(401, 'Invalid phone/email or password');
  return session(u);
}, false);

on('POST', '/auth/register', ({ body }) => {
  const phone = String(body?.phone ?? '').trim();
  const email = body?.email ? String(body.email).trim().toLowerCase() : null;
  if (String(body?.password ?? '').length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
  if (users.some((u) => u.phone === phone)) throw new HttpError(409, 'That phone number is already registered');
  if (email && users.some((u) => u.email?.toLowerCase() === email)) throw new HttpError(409, 'That email is already registered');
  const u: DbUser = { ...baseUser, id: `u-${uid()}`, fullName: String(body.fullName).trim(), phone, email, password: body.password };
  users.push(u);
  return reply(session(u), 201);
}, false);

on('POST', '/auth/refresh', ({ body }) => {
  const [kind, userId] = String(body?.refreshToken ?? '').split('.');
  const u = users.find((x) => x.id === userId);
  if (kind !== 'mockr' || !u) throw new HttpError(401, 'Session expired');
  const s = session(u);
  return { accessToken: s.accessToken, refreshToken: s.refreshToken };
}, false);

on('POST', '/auth/logout', () => ({ ok: true }), false);

// ---- organisations
on('GET', '/organizations/mine', (c) => memberships.filter((m) => m.userId === need(c).id).map(toMembership));

on('GET', '/organizations', ({ query }) => {
  const q = String(query.q ?? '').toLowerCase();
  return orgs.filter((o) => (!query.type || o.type === query.type) && (!q || o.name.toLowerCase().includes(q)));
});

on('POST', '/organizations', (c) => {
  const user = need(c);
  const b = c.body ?? {};
  if (String(b.name ?? '').trim().length < 2) throw new HttpError(400, 'Name is too short');
  const org: Org = { id: `org-${uid()}`, type: b.type as OrgType, name: b.name, description: b.description, address: b.address, city: b.city, state: b.state, phone: b.phone, email: b.email, isVerified: false, acceptingOrders: true };
  orgs.push(org);
  const m: DbMembership = { id: `m-${uid()}`, userId: user.id, organizationId: org.id, role: 'OWNER', status: 'APPROVED', joinedAt: iso(Date.now()) };
  memberships.push(m);
  return reply(org, 201);
});

on('POST', '/organizations/:id/join', (c) => {
  const user = need(c);
  const org = orgs.find((o) => o.id === c.params.id);
  if (!org) throw new HttpError(404, 'Organisation not found');
  if (myMembership(user.id, org.id)) throw new HttpError(409, 'You already have a request or membership here');
  const m: DbMembership = { id: `m-${uid()}`, userId: user.id, organizationId: org.id, role: org.type === 'ESTATE' ? 'RESIDENT' : 'MEMBER', status: 'PENDING', unit: c.body?.unit ?? null };
  memberships.push(m);
  return reply(toMembership(m), 201);
});

on('GET', '/organizations/:id/members', (c) => {
  requireRole(need(c).id, c.params.id, isAdminRole);
  return memberships
    .filter((m) => m.organizationId === c.params.id && (!c.query.status || m.status === c.query.status))
    .map((m): Member => {
      const u = users.find((x) => x.id === m.userId)!;
      return { id: m.id, role: m.role, status: m.status, unit: m.unit, user: { id: u.id, fullName: u.fullName, phone: u.phone } };
    });
});

on('PATCH', '/organizations/:id/members/:mid', (c) => {
  requireRole(need(c).id, c.params.id, isAdminRole);
  const m = memberships.find((x) => x.id === c.params.mid && x.organizationId === c.params.id);
  if (!m) throw new HttpError(404, 'Member not found');
  if (m.userId === need(c).id) throw new HttpError(400, 'You cannot change your own membership');
  if (c.body?.status) m.status = c.body.status;
  if (c.body?.role) m.role = c.body.role;
  if (m.status === 'APPROVED' && !m.joinedAt) m.joinedAt = iso(Date.now());
  return { ok: true };
});

on('POST', '/organizations/:id/broadcast-email', (c) => {
  requireRole(need(c).id, c.params.id, isAdminRole);
  const recipients = memberships.filter((m) => m.organizationId === c.params.id && m.status === 'APPROVED');
  const withEmail = recipients.filter((m) => users.find((u) => u.id === m.userId)?.email);
  return { recipients: recipients.length, sent: withEmail.length };
});

// ---- visitors
on('GET', '/visitors/mine', (c) => {
  const user = need(c);
  return passes.filter((p) => p.hostId === user.id).map(effective).map(stripCode).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
});

on('POST', '/visitors', (c) => {
  const user = need(c);
  const b = c.body ?? {};
  const m = myMembership(user.id, b.organizationId);
  if (!m || m.status !== 'APPROVED' || !(m.role === 'RESIDENT' || isAdminRole(m.role)) || orgOf(m.organizationId).type !== 'ESTATE') {
    throw new HttpError(403, 'Only approved residents can create visitor passes');
  }
  if (String(b.visitorName ?? '').trim().length < 2) throw new HttpError(400, 'Visitor name is too short');
  if (new Date(b.validUntil).getTime() <= new Date(b.validFrom).getTime()) throw new HttpError(400, 'validUntil must be after validFrom');
  const p: DbPass = {
    id: `p-${uid()}`, code: genCode(), organizationId: b.organizationId, hostId: user.id, visitorName: b.visitorName.trim(),
    visitorPhone: b.visitorPhone ?? null, purpose: b.purpose ?? null, validFrom: b.validFrom, validUntil: b.validUntil,
    maxEntries: b.maxEntries ?? 1, entriesUsed: 0, status: 'ACTIVE', createdAt: iso(Date.now()),
  };
  passes.push(p);
  return reply({ ...stripCode(p), code: p.code }, 201);
});

on('PATCH', '/visitors/:id/revoke', (c) => {
  const p = passes.find((x) => x.id === c.params.id && x.hostId === need(c).id);
  if (!p) throw new HttpError(404, 'Pass not found');
  p.status = 'REVOKED';
  p.revokedAt = iso(Date.now());
  return stripCode(p);
});

const logGate = (organizationId: string, securityId: string, action: GateLog['action'], pass: DbPass | undefined, notes?: string) => {
  const host = pass && users.find((u) => u.id === pass.hostId);
  gateLogs.unshift({
    id: `g-${uid()}`, organizationId, securityId, passId: pass?.id ?? null, action, visitorName: pass?.visitorName ?? null,
    notes: notes ?? null, createdAt: iso(Date.now()),
    pass: pass && host ? { visitorName: pass.visitorName, host: { fullName: host.fullName } } : null,
  });
};

on('POST', '/visitors/verify', (c) => {
  const user = need(c);
  const { organizationId, code } = c.body ?? {};
  requireRole(user.id, organizationId, gateRole);
  const pass = passes.find((p) => p.organizationId === organizationId && p.code === String(code ?? '').trim().toUpperCase());
  const deny = (msg: string): never => {
    logGate(organizationId, user.id, 'DENIED', pass, msg);
    throw new HttpError(400, msg);
  };
  if (!pass) return deny('Invalid code');
  effective(pass);
  if (pass.status === 'REVOKED') return deny('This pass was revoked by the host');
  if (pass.status === 'EXPIRED' || Date.now() > new Date(pass.validUntil).getTime()) return deny('This pass has expired');
  if (Date.now() < new Date(pass.validFrom).getTime()) return deny('This pass is not valid yet');
  if (pass.status === 'COMPLETED' || pass.entriesUsed >= pass.maxEntries) return deny('All entries on this pass are used');
  pass.entriesUsed += 1;
  logGate(organizationId, user.id, 'ENTRY', pass);
  const host = users.find((u) => u.id === pass.hostId)!;
  return {
    visitorName: pass.visitorName, purpose: pass.purpose, host: { id: host.id, fullName: host.fullName },
    pass: { id: pass.id, entriesUsed: pass.entriesUsed, maxEntries: pass.maxEntries, validUntil: pass.validUntil },
  };
});

on('POST', '/visitors/exit', (c) => {
  const user = need(c);
  const { organizationId, code } = c.body ?? {};
  requireRole(user.id, organizationId, gateRole);
  const pass = passes.find((p) => p.organizationId === organizationId && p.code === String(code ?? '').trim().toUpperCase());
  if (!pass) throw new HttpError(404, 'Invalid code');
  if (pass.entriesUsed < 1) throw new HttpError(400, 'This visitor has not entered yet');
  if (pass.entriesUsed >= pass.maxEntries) pass.status = 'COMPLETED';
  logGate(organizationId, user.id, 'EXIT', pass);
  return { visitorName: pass.visitorName };
});

on('GET', '/visitors/log/:orgId', (c) => {
  requireRole(need(c).id, c.params.orgId, gateRole);
  return gateLogs
    .filter((l) => l.organizationId === c.params.orgId)
    .map(({ organizationId: _o, securityId, ...l }) => ({ ...l, security: { fullName: users.find((u) => u.id === securityId)?.fullName ?? 'Security' } }));
});

// ---- products
on('GET', '/products', ({ query }) => {
  const q = String(query.q ?? '').toLowerCase();
  return products.filter(
    (p) =>
      (!query.orgId || p.organizationId === query.orgId) &&
      (!q || p.name.toLowerCase().includes(q)) &&
      (query.inStock !== 'true' || p.quantity - p.reservedQty > 0),
  );
});

// ---- notifications / profile
on('GET', '/users/notifications', (c) => notifs.filter((n) => n.userId === need(c).id).map(({ userId: _u, ...n }) => n).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
on('POST', '/users/notifications/read-all', (c) => {
  notifs.filter((n) => n.userId === need(c).id && !n.readAt).forEach((n) => (n.readAt = iso(Date.now())));
  return { ok: true };
});
on('PATCH', '/chat/privacy', (c) => {
  const u = need(c);
  u.chatPrivacy = c.body?.chatPrivacy;
  return { chatPrivacy: u.chatPrivacy };
});

/* ------------------------------ adapter ------------------------------ */

const authHeader = (config: InternalAxiosRequestConfig): string => {
  const h: any = config.headers;
  return String(h?.Authorization ?? h?.authorization ?? h?.get?.('Authorization') ?? '');
};

export const mockAdapter: AxiosAdapter = async (config) => {
  await sleep(200 + Math.random() * 250);
  const path = (config.url ?? '').split('?')[0]!;
  const method = (config.method ?? 'get').toUpperCase();

  const userId = /^Bearer mock\.([^.]+)\./.exec(authHeader(config))?.[1];
  const user = users.find((u) => u.id === userId) ?? null;

  let status = 200;
  let data: unknown;
  try {
    const route = routes.find((r) => r.method === method && r.re.test(path));
    if (!route) throw new HttpError(404, `Mock: no handler for ${method} ${path}`);
    if (route.auth && !user) throw new HttpError(401, 'Unauthorized');
    const match = route.re.exec(path)!;
    const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(match[i + 1]!)]));
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const out = await route.handler({ params, query: config.params ?? {}, body, user });
    if (out && (out as Reply).__reply) {
      status = (out as Reply).status;
      data = (out as Reply).data;
    } else data = out;
    // structuredClone-lite so screens can never mutate the mock "database"
    data = data === undefined ? undefined : JSON.parse(JSON.stringify(data));
  } catch (e) {
    if (!(e instanceof HttpError)) throw e;
    status = e.status;
    data = { statusCode: e.status, message: e.message };
  }

  const response = { data, status, statusText: String(status), headers: {}, config, request: {} };
  if (status >= 400) {
    throw new AxiosError(String((data as any)?.message), status === 401 ? 'ERR_UNAUTHORIZED' : 'ERR_BAD_REQUEST', config, {}, response);
  }
  return response;
};
