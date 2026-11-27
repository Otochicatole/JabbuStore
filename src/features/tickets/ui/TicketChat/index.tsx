"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import type { OrderTicket, TicketActor, TicketMessage } from "../../domain/types";
import { getTicketSocket } from "../../infrastructure/ticketSocket";
import { useTicketNotificationContext } from "../TicketNotificationProvider";

export function TicketChat(props: {
  ticket: OrderTicket;
  actor: TicketActor;
  onTicketUpdated?: () => void;
  fullscreen?: boolean;
  fillHeight?: boolean;
  hideHeader?: boolean;
}) {
  return <TicketChatSession key={`${props.actor}:${props.ticket.id}`} {...props} />;
}

function TicketChatSession({
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
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const addMessage = useCallback((message: TicketMessage) => {
    setMessages((current) =>
      current.some((item) => item.id === message.id) ? current : [...current, message],
    );
  }, []);

  const addMessageRef = useRef(addMessage);
  useEffect(() => {
    addMessageRef.current = addMessage;
  }, [addMessage]);

  const onTicketUpdatedRef = useRef(onTicketUpdated);
  useEffect(() => {
    onTicketUpdatedRef.current = onTicketUpdated;
  }, [onTicketUpdated]);

  useEffect(() => {
    let cancelled = false;
    fetchWithAuth(`${BACKEND_URL}/tickets/${ticket.id}/messages`, {
      headers: { "X-Ticket-Actor": actor },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(t("tickets.error.loadMessages"));
        return response.json();
      })
      .then((data) => {
        if (!cancelled) setMessages(data.messages || []);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t("tickets.error.loadMessages"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    let activeSocket: Awaited<ReturnType<typeof getTicketSocket>> | null = null;

    const handleNewMessage = (msg: TicketMessage) => {
      if (msg.ticketId === ticket.id) {
        addMessageRef.current(msg);
      }
    };
    const handleStatusUpdate = (payload?: { ticketId?: string }) => {
      if (!payload?.ticketId || payload.ticketId === ticket.id) {
        onTicketUpdatedRef.current?.();
      }
    };

    const connect = async () => {
      try {
        const socket = await getTicketSocket(actor);
        if (cancelled) return;
        activeSocket = socket;
        socket.emit("ticket:join", { ticketId: ticket.id });
        socket.on("message:new", handleNewMessage);
        socket.on("ticket:status", handleStatusUpdate);
      } catch (err) {
        console.warn("[TicketChat] Realtime socket unavailable, HTTP mode active:", err);
      }
    };
    void connect();

    return () => {
      cancelled = true;
      if (activeSocket) {
        activeSocket.emit("ticket:leave", { ticketId: ticket.id });
        activeSocket.off("message:new", handleNewMessage);
        activeSocket.off("ticket:status", handleStatusUpdate);
      }
    };
  }, [actor, t, ticket.id]);

  // Keep scrolling strictly inside the inner message container so outer layout never jumps
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages.length, loading]);

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.senderType !== actor) {
      const notifyRead = async () => {
        try {
          const socket = await getTicketSocket(actor);
          socket.emit("ticket:read", { ticketId: ticket.id });
        } catch {
          // Non-critical if socket isn't connected
        }
      };
      void notifyRead();
    }
  }, [messages, actor, ticket.id]);

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
    setSending(true);
    setError(null);
    const clientMessageId = crypto.randomUUID();

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/tickets/${ticket.id}/messages`, {
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
      addMessage(created);
      setBody("");
      onTicketUpdatedRef.current?.();
    } catch {
      setError(t("tickets.error.send"));
    } finally {
      setSending(false);
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
            <span className={`shrink-0 rounded px-2.5 py-1 text-[10px] font-black ${ticket.status === "OPEN" ? "bg-emerald-500/10 text-emerald-300" : "bg-white/5 text-white/40"}`}>
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
            onChange={(event) => setBody(event.target.value.slice(0, 2000))}
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
            placeholder={ticket.status === "CLOSED" ? t("tickets.closedPlaceholder") : t("tickets.messagePlaceholder")}
            disabled={ticket.status === "CLOSED" || sending}
            rows={2}
            className="h-14 min-w-0 flex-1 resize-none rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-accent/40 disabled:opacity-40"
          />
          <button
            type="button"
            onClick={send}
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
