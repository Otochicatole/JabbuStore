import { fetchWithAuth, BACKEND_URL } from "@/shared/lib/api";
import { Notification } from "../domain/types";

export async function getNotifications(): Promise<Notification[]> {
  try {
    const res = await fetchWithAuth(`${BACKEND_URL}/notifications/me`);
    if (res.status === 401) {
      return [];
    }
    if (!res.ok) {
      throw new Error("FAILED_TO_FETCH_NOTIFICATIONS");
    }
    return res.json();
  } catch (err) {
    console.warn("Failed to fetch notifications, returning empty list:", err);
    return [];
  }
}

export async function markAsRead(id: string): Promise<Notification> {
  const res = await fetchWithAuth(`${BACKEND_URL}/notifications/${id}/read`, {
    method: "PATCH",
  });
  if (!res.ok) {
    throw new Error("FAILED_TO_MARK_NOTIFICATION_AS_READ");
  }
  return res.json();
}

export async function markAllAsRead(): Promise<void> {
  const res = await fetchWithAuth(`${BACKEND_URL}/notifications/read-all`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("FAILED_TO_MARK_ALL_NOTIFICATIONS_AS_READ");
  }
}

export async function clearAllNotifications(): Promise<void> {
  const res = await fetchWithAuth(`${BACKEND_URL}/notifications/clear-all`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("FAILED_TO_CLEAR_ALL_NOTIFICATIONS");
  }
}
