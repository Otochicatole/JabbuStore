export interface CheckoutItem {
  assetId: string;
  name: string;
  price: number;
  iconUrl: string | null;
  float?: number | null;
  pattern?: number | null;
  exterior?: string | null;
  rarity?: string | null;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
  color: string;
}

export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cbu: string;
  cuil: string;
  accountHolder: string;
  walletAddress: string;
  network: string;
}

export type FormErrors = Record<string, string>;
