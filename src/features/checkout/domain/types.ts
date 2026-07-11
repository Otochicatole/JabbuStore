export interface CheckoutItem {
  assetId: string;
  name: string;
  price: number;
  iconUrl: string | null;
  provider?: string | null;
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

export interface PaymentQuote {
  base: {
    currency: "USD";
    amount: number;
  };
  settlement: {
    currency: "ARS" | "USD" | "USDT";
    amount: number;
  };
  rate: {
    source: "DOLARAPI";
    kind: "oficial" | "blue" | "cripto";
    side: "venta";
    value: number;
    casa: string | null;
    name: string | null;
    fetchedAt: string;
    providerUpdatedAt: string | null;
  } | null;
  paymentMethod: string;
  manualTransferType: "bank" | "crypto" | null;
  quotedAt: string;
  expiresAt: string | null;
  quoteToken?: string;
}
