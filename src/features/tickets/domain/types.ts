export type TicketActor = "USER" | "ADMIN";
export type TicketStatus = "OPEN" | "CLOSED";

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderType: TicketActor;
  senderUserId?: string | null;
  senderAdminId?: string | null;
  clientMessageId: string;
  body: string;
  createdAt: string;
}

export interface OrderTicket {
  id: string;
  orderId: string;
  userId: string;
  subject: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  unreadCount: number;
  lastMessage?: TicketMessage | null;
  order: {
    id: string;
    type: "BUY" | "SELL";
    status: string;
    totalPrice: number;
  };
  user?: {
    id: string;
    name?: string | null;
    steamId?: string | null;
    avatar?: string | null;
  };
}
