"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import type { OrderTicket, TicketActor, TicketMessage } from "../domain/types";
import { getTicketSocket } from "../infrastructure/ticketSocket";
import { useTicketNotificationContext } from "./TicketNotificationProvider";

interface SocketAck {
  ok: boolean;
  data?: TicketMessage;
  error?: string;
}

export function TicketChat(props: {
  ticket: OrderTicket;
  actor: TicketActor;
  onTicketUpdated?: () => void;
  fullscreen?: boolean;
}) {
  return <TicketChatSession key={`${props.actor}:${props.ticket.id}`} {...props} />;
}

function TicketChatSession({
  ticket,
  actor,
  onTicketUpdated,
  fullscreen = false,
}: {
  ticket: OrderTicket;
  actor: TicketActor;
  onTicketUpdated?: () => void;
  fullscreen?: boolean;
}) {
  const { locale, t } = useI18n();
  const { setActiveTicketId } = useTicketNotificationContext();
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const addMessage = useCallback((message: TicketMessage) => {
    setMessages((current) =>
      current.some((item) => item.id === message.id) ? current : [...current, message],
    );
  }, []);

  // Use refs to store the callbacks. This allows event listeners to use the latest
  // references without requiring the useEffect hook to re-run and reconnect the socket.
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
    
    const handleNewMessage = (msg: TicketMessage) => addMessageRef.current(msg);
    const handleStatusUpdate = () => onTicketUpdatedRef.current?.();

    const connect = async () => {
      try {
        const socket = await getTicketSocket(actor);
        if (cancelled) return;
        activeSocket = socket;
        socket.emit("ticket:join", { ticketId: ticket.id });
        socket.on("message:new", handleNewMessage);
        socket.on("ticket:status", handleStatusUpdate);
      } catch {
        if (!cancelled) setError(t("tickets.error.connection"));
      }
    };
    connect();

    return () => {
      cancelled = true;
      if (activeSocket) {
        activeSocket.emit("ticket:leave", { ticketId: ticket.id });
        activeSocket.off("message:new", handleNewMessage);
        activeSocket.off("ticket:status", handleStatusUpdate);
      }
    };
  }, [actor, t, ticket.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    const isOpponentMsg = lastMsg.senderType !== actor;
    if (isOpponentMsg) {
      const notifyRead = async () => {
        try {
          const socket = await getTicketSocket(actor);
          socket.emit("ticket:read", { ticketId: ticket.id });
        } catch (e) {
          console.error("Failed to emit ticket:read", e);
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
    try {
      const socket = await getTicketSocket(actor);
      await new Promise<void>((resolve, reject) => {
        socket.timeout(10_000).emit(
          "message:send",
          { ticketId: ticket.id, clientMessageId: crypto.randomUUID(), body: cleanBody },
          (timeoutError: Error | null, response?: SocketAck) => {
            if (timeoutError || !response?.ok) return reject(new Error(response?.error || "SEND_FAILED"));
            if (response.data) addMessage(response.data);
            resolve();
          },
        );
      });
      setBody("");
      onTicketUpdated?.();
    } catch {
      setError(t("tickets.error.send"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`flex flex-col bg-[#0d0b16] ${fullscreen ? "h-full min-h-0" : "min-h-[360px] rounded-[3px] border border-white/10"}`}>
      <div className="border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="truncate text-xs font-black text-white">{ticket.subject}</h3>
          <span className={`rounded px-2 py-1 text-[9px] font-black ${ticket.status === "OPEN" ? "bg-emerald-500/10 text-emerald-300" : "bg-white/5 text-white/40"}`}>
            {t(`tickets.status.${ticket.status.toLowerCase()}`)}
          </span>
        </div>
        <p className="mt-1 text-[9px] font-mono text-white/35">#{ticket.orderId}</p>
      </div>

      <div className={`flex-1 space-y-3 overflow-y-auto p-4 sm:p-6 ${fullscreen ? "min-h-0" : "max-h-[430px]"}`}>
        {loading && <Loader2 className="mx-auto mt-10 h-5 w-5 animate-spin text-accent" />}
        {!loading && messages.length === 0 && <p className="py-10 text-center text-xs text-white/35">{t("tickets.noMessages")}</p>}
        {messages.map((message) => {
          const mine = message.senderType === actor;
          return (
            <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-[3px] px-3 py-2 ${mine ? "bg-accent/20 text-white" : "bg-white/5 text-white/80"}`}>
                <p className="whitespace-pre-wrap break-words text-xs">{message.body}</p>
                <p className="mt-1 text-right text-[8px] text-white/35">
                  {new Date(message.createdAt).toLocaleString(locale === "es" ? "es-AR" : "en-US")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {error && <p className="px-4 pb-2 text-[10px] text-red-300">{error}</p>}
      <div className="flex gap-2 border-t border-white/5 p-3">
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
          className="min-h-14 flex-1 resize-none rounded-[3px] border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white outline-none focus:border-accent/40 disabled:opacity-40"
        />
        <button
          type="button"
          onClick={send}
          disabled={!body.trim() || sending || ticket.status === "CLOSED"}
          className="flex w-11 cursor-pointer items-center justify-center rounded-[3px] bg-accent text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={t("tickets.send")}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
