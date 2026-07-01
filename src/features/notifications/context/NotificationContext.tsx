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
import { Bell, X, MessageSquare, ShoppingBag, Info, XCircle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import { stripLocaleFromPathname } from "@/shared/i18n/routing";
import { Notification, NotificationActor } from "../domain/types";
import { getNotifications, markAsRead, markAllAsRead, clearAllNotifications } from "../infrastructure/api";
import { getTicketSocket } from "@/features/tickets/infrastructure/ticketSocket";

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

function getNotificationTheme(resolvedTitle: string, resolvedContent: string, type: string) {
  const t = resolvedTitle.toLowerCase();
  const c = resolvedContent.toLowerCase();
  
  // 1. Support/Tickets -> Pink
  if (type === "TICKET_MESSAGE" || t.includes("ticket") || t.includes("soporte")) {
    return {
      name: "ticket",
      color: "pink",
      textClass: "text-pink-400",
      bgFadeClass: "from-pink-500/10 via-pink-500/[0.02]",
      borderClass: "border-pink-500/20 hover:border-pink-500/40",
      toastBgClass: "from-pink-500/10 via-[#160b21]/95 to-[#160b21]/95 hover:from-pink-500/15",
      shadowClass: "shadow-[0_15px_40px_rgba(236,72,153,0.15)]",
      iconBgClass: "bg-pink-500/10 border-pink-500/20 text-pink-400"
    };
  }
  
  // 2. Critical/Error/Red -> Cancellations or rejections
  if (
    t.includes("cancelada") || 
    t.includes("rechazada") || 
    t.includes("error") || 
    t.includes("cancel") || 
    t.includes("reject") ||
    c.includes("cancelada") ||
    c.includes("rechazada")
  ) {
    return {
      name: "error",
      color: "red",
      textClass: "text-red-400",
      bgFadeClass: "from-red-500/10 via-red-500/[0.02] to-transparent",
      borderClass: "border-red-500/20 hover:border-red-500/40",
      toastBgClass: "from-red-500/10 via-[#1f0b0b]/95 to-[#1f0b0b]/95 hover:from-red-500/15",
      shadowClass: "shadow-[0_15px_40px_rgba(239,68,68,0.15)]",
      iconBgClass: "bg-red-500/10 border-red-500/20 text-red-400"
    };
  }
  
  // 3. Security/Warning/Orange -> Trade bot assigned or pending trade
  if (
    t.includes("bot") || 
    t.includes("seguridad") || 
    t.includes("security") || 
    t.includes("pendiente") || 
    t.includes("pending") ||
    t.includes("trade") ||
    c.includes("bot oficial")
  ) {
    return {
      name: "warning",
      color: "orange",
      textClass: "text-orange-400",
      bgFadeClass: "from-orange-500/10 via-orange-500/[0.02] to-transparent",
      borderClass: "border-orange-500/20 hover:border-orange-500/40",
      toastBgClass: "from-orange-500/10 via-[#21140b]/95 to-[#21140b]/95 hover:from-orange-500/15",
      shadowClass: "shadow-[0_15px_40px_rgba(249,115,22,0.15)]",
      iconBgClass: "bg-orange-500/10 border-orange-500/20 text-orange-400"
    };
  }
  
  // 4. Success/Green -> Approved, completed, paid
  if (
    t.includes("aprobada") || 
    t.includes("completada") || 
    t.includes("pagada") || 
    t.includes("éxito") || 
    t.includes("success") || 
    t.includes("approved") || 
    t.includes("completed") || 
    t.includes("paid")
  ) {
    return {
      name: "success",
      color: "emerald",
      textClass: "text-emerald-400",
      bgFadeClass: "from-emerald-500/10 via-emerald-500/[0.02] to-transparent",
      borderClass: "border-emerald-500/20 hover:border-emerald-500/40",
      toastBgClass: "from-emerald-500/10 via-[#081714]/95 to-[#081714]/95 hover:from-emerald-500/15",
      shadowClass: "shadow-[0_15px_40px_rgba(16,185,129,0.15)]",
      iconBgClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
    };
  }
  
  // 5. Default/System/Blue -> General info
  return {
    name: "info",
    color: "accent",
    textClass: "text-accent",
    bgFadeClass: "from-accent/10 via-accent/[0.02] to-transparent",
    borderClass: "border-accent/25 hover:border-accent/40",
    toastBgClass: "from-accent/10 via-[#0c071d]/95 to-[#0c071d]/95 hover:from-accent/15",
    shadowClass: "shadow-[0_15px_40px_rgba(217,70,239,0.15)]",
    iconBgClass: "bg-accent/10 border-accent/25 text-accent"
  };
}

interface ToastPayload {
  id: string;
  title: string;
  content: string;
  link: string | null;
  type: string;
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
      let context = audioContextRef.current;
      if (!context) {
        context = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = context;
      }
      
      const play = () => {
        const oscillator = context!.createOscillator();
        const gain = context!.createGain();
        const now = context!.currentTime;
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, now);
        oscillator.frequency.setValueAtTime(1100, now + 0.08);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
        oscillator.connect(gain);
        gain.connect(context!.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.21);
      };

      if (context.state === "suspended") {
        context.resume().then(play).catch(() => {});
      } else {
        play();
      }
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
          type: notification.type,
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

  const clearNotifications = useCallback(async () => {
    try {
      await clearAllNotifications();
      setNotifications([]);
    } catch (err) {
      console.error("Failed to clear notifications:", err);
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
      clearNotifications,
    }),
    [notifications, unreadCount, isLoading, markNotificationRead, markAllNotificationsRead, clearNotifications]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Real-time notification toasts overlay */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[250] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2.5 sm:bottom-6 sm:right-6">
        <AnimatePresence>
          {toasts.map((toast) => {
            const resolvedTitle = t(toast.title) || toast.title;
            let resolvedContent = "";
            try {
              const parsed = JSON.parse(toast.content);
              resolvedContent = t(parsed.key, parsed.params) || toast.content;
            } catch {
              resolvedContent = t(toast.content) || toast.content;
            }

            const theme = getNotificationTheme(resolvedTitle, resolvedContent, toast.type);
            
            // Icon selection based on theme
            const toastIcon = theme.name === "ticket" ? (
              <MessageSquare className="h-4.5 w-4.5 text-pink-400" />
            ) : theme.name === "error" ? (
              <XCircle className="h-4.5 w-4.5 text-red-400" />
            ) : theme.name === "warning" ? (
              <ShieldCheck className="h-4.5 w-4.5 text-orange-400" />
            ) : theme.name === "success" ? (
              <ShoppingBag className="h-4.5 w-4.5 text-emerald-400" />
            ) : (
              <Bell className="h-4.5 w-4.5 text-accent animate-pulse" />
            );

            // Tag text selection
            const tagText = theme.name === "ticket" 
              ? t("notifications.ticketAlert") || "Mensaje de Soporte"
              : theme.name === "error" 
              ? t("notifications.errorAlert") || "Fallo en Operación"
              : theme.name === "warning" 
              ? t("notifications.warningAlert") || "Alerta de Seguridad"
              : theme.name === "success" 
              ? t("notifications.orderAlert") || "Actualización de Orden"
              : t("notifications.newAlert") || "Notificación";

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                role="status"
                className={`pointer-events-auto relative flex cursor-pointer gap-3.5 rounded-xl border p-4 text-white backdrop-blur-xl transition-all duration-300 ${theme.borderClass} ${theme.toastBgClass} ${theme.shadowClass}`}
                onClick={() => handleToastClick(toast)}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${theme.iconBgClass}`}>
                  {toastIcon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[9.5px] font-black uppercase tracking-widest ${theme.textClass}`}>
                    {tagText}
                  </p>
                  <p className="truncate text-xs font-black mt-0.5 text-white/95">
                    {resolvedTitle}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[10.5px] leading-relaxed text-white/60">
                    {resolvedContent}
                  </p>
                </div>
                <button
                  type="button"
                  className="h-fit cursor-pointer rounded-full p-1 text-white/30 hover:bg-white/10 hover:text-white transition-colors"
                  aria-label="Dismiss"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeToast(toast.id);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
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
