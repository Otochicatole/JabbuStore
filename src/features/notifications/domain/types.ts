export interface Notification {
  id: string;
  userId: string | null;
  adminId: string | null;
  title: string;
  content: string;
  type: "TICKET_MESSAGE" | "ORDER_STATUS" | "SYSTEM" | string;
  read: boolean;
  link: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NotificationActor = "USER" | "ADMIN";
