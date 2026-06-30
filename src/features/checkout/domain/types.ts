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
  manualTransferType: "bank" | "crypto";
  paymentProof: File | null;
}

export type FormErrors = Record<string, string>;

export interface ManualTransferSettings {
  mercadoPagoEnabled: boolean;
  paypalEnabled: boolean;
  nowpaymentsEnabled: boolean;
  manualTransferEnabled: boolean;
  manualBankAlias: string | null;
  manualBankCbu: string | null;
  manualBankHolder: string | null;
  manualBankInstructions: string | null;
  manualCryptoAddress: string | null;
  manualCryptoNetwork: string | null;
  manualCryptoInstructions: string | null;
}
