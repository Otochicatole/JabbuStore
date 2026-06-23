"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MessageSquare, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import type {
  TicketActor,
  TicketNotificationPayload,
} from "../../domain/types";
import { getTicketSocket } from "../../infrastructure/ticketSocket";

interface TicketNotificationContextValue {
  setActiveTicketId: (ticketId: string | null) => void;
}

const TicketNotificationContext = createContext<TicketNotificationContextValue>({
  setActiveTicketId: () => undefined,
});

export function useTicketNotificationContext() {
  return useContext(TicketNotificationContext);
}

export function TicketNotificationProvider({
  actor,
  enabled,
  children,
}: {
  actor: TicketActor;
  enabled: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const localizePath = useLocalizedPath();
  const { t } = useI18n();
  const [toasts, setToasts] = useState<TicketNotificationPayload[]>([]);
  const activeTicketRef = useRef<string | null>(null);
  const seenMessagesRef = useRef(new Set<string>());
  const timersRef = useRef(new Map<string, number>());
  const audioContextRef = useRef<AudioContext | null>(null);

  const setActiveTicketId = useCallback((ticketId: string | null) => {
    activeTicketRef.current = ticketId;
  }, []);

  const removeToast = useCallback((messageId: string) => {
    setToasts((current) => current.filter((toast) => toast.messageId !== messageId));
    const timer = timersRef.current.get(messageId);
    if (timer) window.clearTimeout(timer);
    timersRef.current.delete(messageId);
  }, []);

  const playSound = useCallback(() => {
    const context = audioContextRef.current;
    if (!context || context.state !== "running") return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(720, now);
    oscillator.frequency.setValueAtTime(920, now + 0.09);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.23);
  }, []);

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

  useEffect(() => {
    if (!enabled) return;
    let socketRef: Awaited<ReturnType<typeof getTicketSocket>> | null = null;
    let cancelled = false;
    const onNotification = (notification: TicketNotificationPayload) => {
      if (
        !notification?.messageId ||
        seenMessagesRef.current.has(notification.messageId) ||
        activeTicketRef.current === notification.ticketId
      ) {
        return;
      }
      seenMessagesRef.current.add(notification.messageId);
      if (seenMessagesRef.current.size > 500) seenMessagesRef.current.clear();
      setToasts((current) => [...current.slice(-3), notification]);
      playSound();
      const timer = window.setTimeout(() => removeToast(notification.messageId), 7000);
      timersRef.current.set(notification.messageId, timer);
    };

    const connect = async () => {
      try {
        const socket = await getTicketSocket(actor);
        if (cancelled) return;
        socketRef = socket;
        socket.on("notification:new", onNotification);
      } catch {
        // Logged-out visitors do not need a notification connection.
      }
    };
    void connect();
    return () => {
      cancelled = true;
      socketRef?.off("notification:new", onNotification);
    };
  }, [actor, enabled, playSound, removeToast]);

  useEffect(() => {
    const timers = timersRef.current;
    const audioContext = audioContextRef.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
      void audioContext?.close();
    };
  }, []);

  const openNotification = (notification: TicketNotificationPayload) => {
    removeToast(notification.messageId);
    if (actor === "ADMIN") {
      router.push(`${localizePath("/admin/panel/dashboard")}?tab=tickets&ticket=${encodeURIComponent(notification.ticketId)}`);
    } else {
      router.push(`${localizePath("/tickets")}?ticket=${encodeURIComponent(notification.ticketId)}`);
    }
  };

  const value = useMemo(
    () => ({ setActiveTicketId }),
    [setActiveTicketId],
  );

  return (
    <TicketNotificationContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[220] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((notification) => (
          <div
            key={notification.messageId}
            role="status"
            className="pointer-events-auto flex cursor-pointer gap-3 rounded-xl border border-accent/25 bg-[#151126]/95 p-4 text-white shadow-2xl shadow-black/60 backdrop-blur-xl"
            onClick={() => openNotification(notification)}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/10 bg-cover bg-center text-accent"
              style={notification.senderAvatar ? { backgroundImage: `url(${notification.senderAvatar})` } : undefined}
            >
              {!notification.senderAvatar && <MessageSquare className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-accent">{t("tickets.notification.newMessage")}</p>
              <p className="truncate text-xs font-black">{notification.senderName}</p>
              <p className="mt-0.5 truncate text-[10px] text-white/55">{notification.subject}</p>
              <p className="mt-1 line-clamp-2 text-[11px] text-white/75">{notification.preview}</p>
            </div>
            <button
              type="button"
              className="h-fit cursor-pointer rounded-full p-1 text-white/35 hover:bg-white/10 hover:text-white"
              aria-label={t("tickets.notification.dismiss")}
              onClick={(event) => {
                event.stopPropagation();
                removeToast(notification.messageId);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </TicketNotificationContext.Provider>
  );
}
