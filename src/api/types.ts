export type OrgType = 'ESTATE' | 'SHOP' | 'CHURCH' | 'MOSQUE';
export type Role = 'ORG_ADMIN' | 'SECURITY' | 'RESIDENT' | 'MEMBER' | 'STAFF';
export type MStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type ChatPrivacy = 'EVERYONE' | 'MY_ORGS_ONLY' | 'REQUEST_ONLY' | 'ADMINS_ONLY';

export type User = { id: string; fullName: string; email?: string | null; phone: string; chatPrivacy: ChatPrivacy; isSuperAdmin: boolean };
export type Org = { id: string; type: OrgType; name: string; description?: string | null; address?: string | null; city?: string | null; state?: string | null };
export type Membership = { id: string; role: Role; status: MStatus; unit?: string | null; organizationId: string; organization: Org };
export type Member = { id: string; role: Role; status: MStatus; unit?: string | null; user: { id: string; fullName: string; phone: string; email?: string | null } };
export type Pass = {
  id: string; code: string; organizationId: string; visitorName: string; visitorPhone?: string | null; purpose?: string | null;
  validFrom: string; validUntil: string; maxEntries: number; entriesUsed: number; status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'REVOKED';
};
export type Product = { id: string; name: string; description?: string | null; price: string; quantity: number; unit?: string | null; organizationId: string; organization?: { id: string; name: string; city?: string | null } };
export type Message = { id: string; conversationId: string; senderId: string; body: string; createdAt: string };
export type ConversationItem = { id: string; status: 'ACTIVE' | 'REQUESTED' | 'DECLINED'; initiatorId: string; other: { id: string; fullName: string }; lastMessage: Message | null };
export type Notif = { id: string; title: string; body: string; readAt?: string | null; createdAt: string };
