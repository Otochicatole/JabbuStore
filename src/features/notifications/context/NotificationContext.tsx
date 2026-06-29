"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
} from "react";
import { Bell, X } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import { stripLocaleFromPathname } from "@/shared/i18n/routing";
import { Notification, NotificationActor } from "../domain/types";
import { getNotifications, markAsRead, markAllAsRead } from "../infrastructure/api";
import { getTicketSocket } from "@/features/tickets/infrastructure/ticketSocket";

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

interface ToastPayload {
  id: string;
  title: string;
  content: string;
  link: string | null;
}

function NotificationProviderContent({
  actor,
  enabled,
  children,
}: {
  actor: NotificationActor;
  enabled: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const localizePath = useLocalizedPath();
  const { t } = useI18n();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [toasts, setToasts] = useState<ToastPayload[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const timersRef = useRef(new Map<string, number>());

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Play a premium micro-sound alert
  const playSound = useCallback(() => {
    try {
      const context = audioContextRef.current;
      if (!context || context.state !== "running") return;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.setValueAtTime(1100, now + 0.08);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.21);
    } catch {
      // Audio context might fail on some browsers before interaction
    }
  }, []);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!enabled) return;
    try {
      setIsLoading(true);
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  // Audio Context Unlocker
  useEffect(() => {
    if (!enabled) return;
    const unlockAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      void audioContextRef.current.resume();
    };
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [enabled]);

  // Mark all timers cleanup
  useEffect(() => {
    const timers = timersRef.current;
    const audioContext = audioContextRef.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
      void audioContext?.close();
    };
  }, []);

  const removeToast = useCallback((toastId: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
    const timer = timersRef.current.get(toastId);
    if (timer) window.clearTimeout(timer);
    timersRef.current.delete(toastId);
  }, []);

  // WebSocket connection for real-time notifications
  useEffect(() => {
    if (!enabled) return;
    let socketRef: any = null;
    let cancelled = false;

    const onNewDbNotification = (notification: Notification) => {
      if (!notification || cancelled) return;

      // Check if we are currently looking at the notification target path.
      // If so, mark it read immediately and do not show toast/alert.
      const normalizedPath = stripLocaleFromPathname(pathname);
      const currentParams = searchParams.toString() ? `?${searchParams.toString()}` : "";
      const currentLink = normalizedPath + currentParams;

      if (notification.link && currentLink.includes(notification.link)) {
        // Automatically mark as read on the backend
        void markAsRead(notification.id).catch(() => {});
        // Append to list as read
        setNotifications((prev) => [
          { ...notification, read: true },
          ...prev.filter((n) => n.id !== notification.id),
        ]);
        return;
      }

      // Add to notifications list (replace if already exists, e.g. grouping)
      setNotifications((prev) => [
        notification,
        ...prev.filter((n) => n.id !== notification.id && n.link !== notification.link),
      ]);

      // Trigger Toast (filtered to prevent duplicate keys in state)
      setToasts((current) => [
        ...current.filter((t) => t.id !== notification.id).slice(-2),
        {
          id: notification.id,
          title: notification.title,
          content: notification.content,
          link: notification.link,
        },
      ]);

      playSound();

      const timer = window.setTimeout(() => removeToast(notification.id), 6000);
      timersRef.current.set(notification.id, timer);
    };

    const connect = async () => {
      try {
        const socket = await getTicketSocket(actor);
        if (cancelled) return;
        socketRef = socket;
        socket.on("notification:new_db", onNewDbNotification);
      } catch {
        // Session might be logged out
      }
    };

    void connect();

    return () => {
      cancelled = true;
      if (socketRef) {
        socketRef.off("notification:new_db", onNewDbNotification);
      }
    };
  }, [actor, enabled, pathname, searchParams, playSound, removeToast]);

  // Auto-read notifications matching current path
  useEffect(() => {
    if (!enabled || notifications.length === 0) return;

    const normalizedPath = stripLocaleFromPathname(pathname);
    const currentParams = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const currentLink = normalizedPath + currentParams;

    const matchingUnread = notifications.filter(
      (n) => !n.read && n.link && currentLink.includes(n.link)
    );

    if (matchingUnread.length > 0) {
      matchingUnread.forEach((n) => {
        void markAsRead(n.id).catch(() => {});
      });
      const matchingIds = new Set(matchingUnread.map((n) => n.id));
      setNotifications((prev) =>
        prev.map((item) => (matchingIds.has(item.id) ? { ...item, read: true } : item))
      );
    }
  }, [pathname, searchParams, notifications, enabled]);

  // Methods
  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  }, []);

  const handleToastClick = (toast: ToastPayload) => {
    removeToast(toast.id);
    void markNotificationRead(toast.id);
    if (toast.link) {
      router.push(localizePath(toast.link));
    }
  };

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [notifications, unreadCount, isLoading, markNotificationRead, markAllNotificationsRead]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Real-time notification toasts overlay */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[250] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex cursor-pointer gap-3 rounded-xl border border-accent/25 bg-[#120e24]/95 p-4 text-white shadow-2xl shadow-black/80 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]"
            onClick={() => handleToastClick(toast)}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-accent">
              <Bell className="h-4.5 w-4.5 animate-bounce" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-accent">
                {t("notifications.newAlert") || "Notificación"}
              </p>
              <p className="truncate text-xs font-black">{toast.title}</p>
              <p className="mt-1 line-clamp-2 text-[11px] text-white/70">{toast.content}</p>
            </div>
            <button
              type="button"
              className="h-fit cursor-pointer rounded-full p-1 text-white/30 hover:bg-white/10 hover:text-white"
              aria-label="Dismiss"
              onClick={(event) => {
                event.stopPropagation();
                removeToast(toast.id);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

// Wrapper to safety support Suspense internally when reading search parameters in Next.js App Router
export function NotificationProvider({
  actor,
  enabled,
  children,
}: {
  actor: NotificationActor;
  enabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={children}>
      <NotificationProviderContent actor={actor} enabled={enabled}>
        {children}
      </NotificationProviderContent>
    </Suspense>
  );
}
