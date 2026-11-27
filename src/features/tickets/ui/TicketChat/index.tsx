"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import type { OrderTicket, TicketActor, TicketMessage } from "../../domain/types";
import { getTicketSocket } from "../../infrastructure/ticketSocket";
import { useTicketNotificationContext } from "../TicketNotificationProvider";

const EMPTY_MESSAGES: TicketMessage[] = [];
const moduleMessagesCache = new Map<string, TicketMessage[]>();
const moduleDraftsCache = new Map<string, string>();

function mergeUniqueMessages(
  existing: TicketMessage[],
  incoming: TicketMessage[],
): TicketMessage[] {
  if (incoming.length === 0) return existing;
  const byId = new Map<string, TicketMessage>();
  for (const msg of existing) byId.set(msg.id, msg);
  for (const msg of incoming) byId.set(msg.id, msg);
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function areMessageListsEqual(a: TicketMessage[], b: TicketMessage[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]?.id !== b[i]?.id) return false;
  }
  return true;
}

export function TicketChat({
  ticket,
  actor,
  onTicketUpdated,
  fullscreen = false,
  fillHeight = false,
  hideHeader = false,
}: {
  ticket: OrderTicket;
  actor: TicketActor;
  onTicketUpdated?: () => void;
  fullscreen?: boolean;
  fillHeight?: boolean;
  hideHeader?: boolean;
}) {
  const { locale, t } = useI18n();
  const { setActiveTicketId } = useTicketNotificationContext();
  const cacheKey = `${actor}:${ticket.id}`;

  const [messagesByKey, setMessagesByKey] = useState<Record<string, TicketMessage[]>>({});
  const [loadedByKey, setLoadedByKey] = useState<Record<string, boolean>>({});
  const [draftByKey, setDraftByKey] = useState<Record<string, string>>({});
  const [errorByKey, setErrorByKey] = useState<Record<string, string | null>>({});
  const [sendingKey, setSendingKey] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const lastMarkedReadMsgByKeyRef = useRef<Map<string, string>>(new Map());
  const prevScrollAnchorRef = useRef<{ key: string; count: number }>({
    key: "",
    count: 0,
  });

  const cachedMessages = moduleMessagesCache.get(cacheKey);
  const messages = messagesByKey[cacheKey] ?? cachedMessages ?? EMPTY_MESSAGES;
  const hasLoaded = Boolean(loadedByKey[cacheKey] || cachedMessages !== undefined);
  const loading = !hasLoaded;
  const body = draftByKey[cacheKey] ?? moduleDraftsCache.get(cacheKey) ?? "";
  const error = errorByKey[cacheKey] ?? null;
  const sending = sendingKey === cacheKey;

  const setDraftForKey = useCallback(
    (nextDraft: string) => {
      const clipped = nextDraft.slice(0, 2000);
      moduleDraftsCache.set(cacheKey, clipped);
      setDraftByKey((prev) => (prev[cacheKey] === clipped ? prev : { ...prev, [cacheKey]: clipped }));
    },
    [cacheKey],
  );

  const appendMessageForKey = useCallback((targetKey: string, message: TicketMessage) => {
    setMessagesByKey((prev) => {
      const base = prev[targetKey] ?? moduleMessagesCache.get(targetKey) ?? EMPTY_MESSAGES;
      if (base.some((item) => item.id === message.id)) return prev;
      const next = mergeUniqueMessages(base, [message]);
      moduleMessagesCache.set(targetKey, next);
      return { ...prev, [targetKey]: next };
    });
    setLoadedByKey((prev) => (prev[targetKey] ? prev : { ...prev, [targetKey]: true }));
  }, []);

  const onTicketUpdatedRef = useRef(onTicketUpdated);
  useEffect(() => {
    onTicketUpdatedRef.current = onTicketUpdated;
  }, [onTicketUpdated]);

  useEffect(() => {
    const targetTicketId = ticket.id;
    const targetKey = `${actor}:${targetTicketId}`;
    const abortController = new AbortController();
    let cancelled = false;

    fetchWithAuth(`${BACKEND_URL}/tickets/${targetTicketId}/messages`, {
      headers: { "X-Ticket-Actor": actor },
      signal: abortController.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(t("tickets.error.loadMessages"));
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        const fetched: TicketMessage[] = Array.isArray(data?.messages) ? data.messages : [];
        const lastOpposite = [...fetched].reverse().find((m) => m.senderType !== actor);
        if (lastOpposite) {
          lastMarkedReadMsgByKeyRef.current.set(targetKey, lastOpposite.id);
        }

        setMessagesByKey((prev) => {
          const existing = prev[targetKey] ?? moduleMessagesCache.get(targetKey);
          const merged = existing ? mergeUniqueMessages(existing, fetched) : fetched;
          moduleMessagesCache.set(targetKey, merged);
          if (existing && areMessageListsEqual(existing, merged)) {
            return prev[targetKey] ? prev : { ...prev, [targetKey]: merged };
          }
          return { ...prev, [targetKey]: merged };
        });
        setErrorByKey((prev) => (prev[targetKey] ? { ...prev, [targetKey]: null } : prev));
      })
      .catch((err: unknown) => {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) return;
        const message = err instanceof Error ? err.message : t("tickets.error.loadMessages");
        setErrorByKey((prev) => ({ ...prev, [targetKey]: message }));
      })
      .finally(() => {
        if (cancelled) return;
        setLoadedByKey((prev) => (prev[targetKey] ? prev : { ...prev, [targetKey]: true }));
      });

    let activeSocket: Awaited<ReturnType<typeof getTicketSocket>> | null = null;

    const joinRoom = () => {
      if (!cancelled && activeSocket) {
        activeSocket.emit("ticket:join", { ticketId: targetTicketId });
      }
    };

    const handleNewMessage = (msg: TicketMessage) => {
      if (cancelled || msg.ticketId !== targetTicketId) return;
      appendMessageForKey(targetKey, msg);
      if (
        msg.senderType !== actor &&
        lastMarkedReadMsgByKeyRef.current.get(targetKey) !== msg.id
      ) {
        lastMarkedReadMsgByKeyRef.current.set(targetKey, msg.id);
        activeSocket?.emit("ticket:read", { ticketId: targetTicketId });
      }
    };

    const handleStatusUpdate = (payload?: { ticketId?: string }) => {
      if (!cancelled && (!payload?.ticketId || payload.ticketId === targetTicketId)) {
        onTicketUpdatedRef.current?.();
      }
    };

    const connect = async () => {
      try {
        const socket = await getTicketSocket(actor);
        if (cancelled) return;
        activeSocket = socket;
        socket.on("connect", joinRoom);
        socket.on("message:new", handleNewMessage);
        socket.on("ticket:status", handleStatusUpdate);
        if (socket.connected) {
          joinRoom();
        }
      } catch (err) {
        console.warn("[TicketChat] Realtime socket unavailable, HTTP mode active:", err);
      }
    };
    void connect();

    return () => {
      cancelled = true;
      abortController.abort();
      if (activeSocket) {
        activeSocket.off("connect", joinRoom);
        activeSocket.off("message:new", handleNewMessage);
        activeSocket.off("ticket:status", handleStatusUpdate);
        activeSocket.emit("ticket:leave", { ticketId: targetTicketId });
      }
    };
  }, [actor, appendMessageForKey, t, ticket.id]);

  // Keep scrolling strictly inside the inner message container without outer layout jumps
  useEffect(() => {
    const container = listRef.current;
    if (!container || loading) return;
    const prev = prevScrollAnchorRef.current;
    if (prev.key !== cacheKey || messages.length !== prev.count) {
      container.scrollTop = container.scrollHeight;
      prevScrollAnchorRef.current = { key: cacheKey, count: messages.length };
    }
  }, [cacheKey, loading, messages.length]);

  useEffect(() => {
    if (!fullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [fullscreen]);

  useEffect(() => {
    setActiveTicketId(ticket.id);
    return () => setActiveTicketId(null);
  }, [setActiveTicketId, ticket.id]);

  const send = async () => {
    const cleanBody = body.trim();
    if (!cleanBody || cleanBody.length > 2000 || sending || ticket.status === "CLOSED") return;
    const targetTicketId = ticket.id;
    const targetKey = cacheKey;
    setSendingKey(targetKey);
    setErrorByKey((prev) => (prev[targetKey] ? { ...prev, [targetKey]: null } : prev));
    const clientMessageId = crypto.randomUUID();

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/tickets/${targetTicketId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Ticket-Actor": actor,
        },
        body: JSON.stringify({
          clientMessageId,
          body: cleanBody,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "SEND_FAILED");
      }

      const created: TicketMessage = await response.json();
      appendMessageForKey(targetKey, created);
      moduleDraftsCache.set(targetKey, "");
      setDraftByKey((prev) => ({ ...prev, [targetKey]: "" }));
      onTicketUpdatedRef.current?.();
    } catch {
      setErrorByKey((prev) => ({ ...prev, [targetKey]: t("tickets.error.send") }));
    } finally {
      setSendingKey((current) => (current === targetKey ? null : current));
    }
  };

  const containerSizeClass =
    fullscreen || fillHeight
      ? "h-full min-h-0 w-full min-w-0"
      : "h-[520px] w-full min-w-0 rounded-lg border border-white/10";

  return (
    <div className={`flex flex-col overflow-hidden bg-[#0d0b16] ${containerSizeClass}`}>
      {!hideHeader && (
        <div className="shrink-0 border-b border-white/10 px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="min-w-0 truncate text-sm font-black text-white">{ticket.subject}</h3>
            <span
              className={`shrink-0 rounded px-2.5 py-1 text-[10px] font-black ${
                ticket.status === "OPEN"
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-white/5 text-white/40"
              }`}
            >
              {t(`tickets.status.${ticket.status.toLowerCase()}`)}
            </span>
          </div>
          <p className="mt-1 truncate text-[10px] font-mono text-white/35">#{ticket.orderId}</p>
        </div>
      )}

      <div
        ref={listRef}
        className="flex-1 min-h-0 space-y-3 overflow-y-auto overflow-x-hidden p-4 sm:p-5 custom-scrollbar"
      >
        {loading && (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-xs text-white/35">{t("tickets.noMessages")}</p>
          </div>
        )}
        {!loading &&
          messages.map((message) => {
            const mine = message.senderType === actor;
            return (
              <div key={message.id} className={`flex min-w-0 ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`min-w-0 max-w-[78%] rounded-xl px-4 py-2.5 ${
                    mine ? "bg-accent/20 text-white" : "bg-white/5 text-white/85"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm">
                    {message.body}
                  </p>
                  <p className="mt-1 text-right text-[10px] text-white/40 tabular-nums">
                    {new Date(message.createdAt).toLocaleString(locale === "es" ? "es-AR" : "en-US")}
                  </p>
                </div>
              </div>
            );
          })}
      </div>

      <div className="shrink-0 border-t border-white/10 bg-[#0d0b16]">
        {error && <p className="px-3 pt-2 text-[11px] font-medium text-red-400">{error}</p>}
        <div className="flex gap-2 p-3">
          <textarea
            value={body}
            onChange={(event) => setDraftForKey(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                void send();
              }
            }}
            placeholder={
              ticket.status === "CLOSED"
                ? t("tickets.closedPlaceholder")
                : t("tickets.messagePlaceholder")
            }
            disabled={ticket.status === "CLOSED" || sending}
            rows={2}
            className="h-14 min-w-0 flex-1 resize-none rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-accent/40 disabled:opacity-40"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={!body.trim() || sending || ticket.status === "CLOSED"}
            className="flex h-14 w-12 shrink-0 cursor-pointer items-center justify-center rounded-md bg-gradient-to-r from-accent to-fuchsia-600 text-white disabled:cursor-not-allowed disabled:opacity-30 hover:brightness-110 transition-all"
            aria-label={t("tickets.send")}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
