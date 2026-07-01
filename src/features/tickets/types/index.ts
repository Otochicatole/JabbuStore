export interface Order {
  id: string;
  createdAt: string;
  status: string;
  type: "BUY" | "SELL";
  totalPrice: number;
  botId?: string | null;
  bot?: any;
}
