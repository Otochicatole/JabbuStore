import type { PaymentProofInfo } from "@/shared/components/PaymentProofModal";

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
}

export interface Order {
  id: string;
  userId: string;
  type: "BUY" | "SELL";
  status: "PENDING_PAYMENT" | "PAID" | "TRADE_PENDING" | "COMPLETED" | "CANCELLED";
  totalPrice: number;
  items: OrderItem[];
  createdAt: string;
  paymentMethod?: string | null;
  botId?: string | null;
  bot?: { id: string; name: string; steamId: string; tradeUrl: string | null } | null;
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
    paypalPaymentId?: string | null;
    nowpaymentsPaymentId?: string | null;
    buyerPaymentProof?: PaymentProofInfo | null;
    adminPaymentProof?: PaymentProofInfo | null;
    manualTransferType?: "bank" | "crypto" | string | null;
    manualTransferSnapshot?: {
      type?: "bank" | "crypto" | string | null;
      bank?: {
        alias?: string | null;
        cbu?: string | null;
        holder?: string | null;
        instructions?: string | null;
      } | null;
      crypto?: {
        address?: string | null;
        network?: string | null;
        instructions?: string | null;
      } | null;
    } | null;
  } | null;
}

export interface SelectedProof {
  url: string;
  proof: PaymentProofInfo;
  title: string;
}
