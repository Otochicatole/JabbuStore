export interface StoreItem {
  assetId: string;
  classId: string;
  name: string;
  type: string;
  iconUrl: string | null;
  tradable: boolean;
  marketable: boolean;
  botSteamId: string;
  price: number;
  isPriceManual?: boolean;
  rarity: string;
  exterior: string | null;
  category: string;
  isStatTrak: boolean;
  isSouvenir: boolean;
  float: number | null;
  pattern: number | null;
}

export interface OrderItem {
  id: string;
  assetId: string;
  name: string;
  price: number;
  iconUrl: string | null;
  rarity?: string | null;
  exterior?: string | null;
  float?: number | null;
  pattern?: number | null;
  provider?: string | null;
  /** YouPin listing id (SteamWebAPI marketid) when the user bought a specific float */
  externalId?: string | null;
}

export interface PaymentProofMetadata {
  id?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  size?: number | null;
  uploadedAt?: string | null;
  uploadedBy?: "buyer" | "admin" | string | null;
}

export interface Order {
  id: string;
  userId: string;
  user: { name: string | null; steamId: string | null; avatar: string | null; tradeUrl?: string | null };
  type: string;
  status: string;
  totalPrice: number;
  items: OrderItem[];
  createdAt: string;
  paymentMethod?: string | null;
  metadata?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    cbu?: string | null;
    cuil?: string | null;
    accountHolder?: string | null;
    walletAddress?: string | null;
    network?: string | null;
    mpPaymentId?: string | null;
    nowpaymentsPaymentId?: string | null;
    paypalPaymentId?: string | null;
    buyerPaymentProof?: PaymentProofMetadata | null;
    adminPaymentProof?: PaymentProofMetadata | null;
  } | null;
}

export interface Listing {
  id: string;
  userId: string | null;
  user: { id: string; name: string | null; avatar: string | null; steamId: string | null } | null;
  skinId: string;
  itemName: string | null;
  itemIconUrl: string | null;
  basePrice: number;
  finalPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface AdminDashboardProps {
  initialItems: StoreItem[];
  adminUser: AdminUser;
}
