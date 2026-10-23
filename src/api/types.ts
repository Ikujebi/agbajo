/**
 * Mirrors the Prisma schema. Prisma serialises Decimal as a string over JSON,
 * hence `Money`. Dates arrive as ISO strings.
 */
export type Money = string | number;

export type OrgType = 'ESTATE' | 'SHOP' | 'CHURCH' | 'MOSQUE' | 'ARTISAN' | 'COMPANY' | 'COMMUNITY_GROUP' | 'OTHER';
export type MembershipRole =
  | 'OWNER' | 'CHAIRMAN' | 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'SECURITY' | 'RESIDENT'
  | 'ATTENDANT' | 'MEMBER' | 'RIDER' | 'STAFF' | 'ACCOUNTANT' | 'MODERATOR';
export type MembershipStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type PassStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'REVOKED';
export type GateAction = 'ENTRY' | 'EXIT' | 'DENIED';
export type ChatPrivacy = 'EVERYONE' | 'MY_ORGS_ONLY' | 'REQUEST_ONLY' | 'ADMINS_ONLY';
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED';
export type NotificationType =
  | 'GENERAL' | 'ORDER' | 'PAYMENT' | 'VISITOR_PASS' | 'CHAT' | 'SERVICE_BOOKING'
  | 'DELIVERY' | 'SAFETY' | 'EVENT' | 'SYSTEM';

export type User = {
  id: string;
  fullName: string;
  email?: string | null;
  phone: string;
  avatarUrl?: string | null;
  bio?: string | null;
  isSuperAdmin: boolean;
  chatPrivacy: ChatPrivacy;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
};

export type Session = { user: User; accessToken: string; refreshToken: string };

export type Org = {
  id: string;
  type: OrgType;
  name: string;
  slug?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  isVerified: boolean;
  acceptingOrders: boolean;
};

export type Membership = {
  id: string;
  userId: string;
  organizationId: string;
  role: MembershipRole;
  status: MembershipStatus;
  unit?: string | null;
  title?: string | null;
  joinedAt?: string | null;
  organization: Org;
};

/** A row in an organisation's member list (admin view). */
export type Member = {
  id: string;
  role: MembershipRole;
  status: MembershipStatus;
  unit?: string | null;
  title?: string | null;
  user: Pick<User, 'id' | 'fullName' | 'phone' | 'avatarUrl'>;
};

/**
 * The backend only stores `codeHash`, so the plain `code` exists ONLY on the
 * response to POST /visitors. List endpoints never include it.
 */
export type Pass = {
  id: string;
  organizationId: string;
  hostId: string;
  visitorName: string;
  visitorPhone?: string | null;
  purpose?: string | null;
  validFrom: string;
  validUntil: string;
  maxEntries: number;
  entriesUsed: number;
  status: PassStatus;
  createdAt: string;
  revokedAt?: string | null;
};
export type CreatedPass = Pass & { code: string };

export type VerifyResponse = {
  visitorName: string;
  purpose?: string | null;
  host: { id: string; fullName: string };
  pass: Pick<Pass, 'id' | 'entriesUsed' | 'maxEntries' | 'validUntil'>;
};

export type GateLog = {
  id: string;
  passId?: string | null;
  action: GateAction;
  visitorName?: string | null;
  notes?: string | null;
  createdAt: string;
  pass?: { visitorName: string; host: { fullName: string } } | null;
  security?: { fullName: string } | null;
};

export type Product = {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  price: Money;
  quantity: number;
  reservedQty: number;
  lowStockAt: number;
  unit?: string | null;
  imageUrl?: string | null;
  status: ProductStatus;
  isAvailable: boolean;
  organization?: Pick<Org, 'id' | 'name' | 'city' | 'acceptingOrders'>;
};

export type Notif = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
};

export type ConversationStatus = 'ACTIVE' | 'REQUESTED' | 'DECLINED'; // adjust based on your backend values

export type ConversationItem = {
  id: string;
  status: 'ACTIVE' | 'REQUESTED' | 'DECLINED';
  initiatorId: string;
  other: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
  lastMessage: Message | null;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string | null;
  type: MessageType;
  mediaUrl?: string | null;
  mediaPublicId?: string | null;
  mediaFileName?: string | null;
  mediaMimeType?: string | null;
  mediaSize?: number | null;
  isEdited: boolean;
  editedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
};


export type MessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'VIDEO'
  | 'AUDIO'
  | 'FILE'
  | 'DOCUMENT';