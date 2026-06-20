"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, MessageSquarePlus, X } from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import type { OrderTicket } from "../domain/types";
import { TicketChat } from "./TicketChat";

export function UserOrderTickets({ orderId }: { orderId: string }) {
  const { t } = useI18n();
  const [tickets, setTickets] = useState<OrderTicket[]>([]);
  const [selected, setSelected] = useState<OrderTicket | null>(null);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    const response = await fetchWithAuth(`${BACKEND_URL}/tickets/me?orderId=${encodeURIComponent(orderId)}`, {
      headers: { "X-Ticket-Actor": "USER" },
    });
    if (!response.ok) throw new Error(t("tickets.error.load"));
    const data: OrderTicket[] = await response.json();
    setTickets(data);
    setSelected((current) => current ? data.find((ticket) => ticket.id === current.id) || current : null);
  }, [orderId, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => loadTickets().catch(() => setError(t("tickets.error.load"))), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadTickets, t]);

  const createTicket = async () => {
    if (subject.trim().length < 3 || !message.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/tickets`, {
        method: "POST",
        headers: { "X-Ticket-Actor": "USER" },
        body: JSON.stringify({ orderId, subject: subject.trim(), message: message.trim() }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error === "OPEN_TICKET_LIMIT" ? t("tickets.error.limit") : t("tickets.error.create"));
      }
      setSubject("");
      setMessage("");
      setShowForm(false);
      await loadTickets();
      setSelected(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("tickets.error.create"));
    } finally {
      setCreating(false);
    }
  };

  const openCount = tickets.filter((ticket) => ticket.status === "OPEN").length;

  return (
    <div className="space-y-3 border-t border-white/5 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">{t("tickets.support")}</h4>
          <p className="mt-1 text-[10px] text-white/35">{t("tickets.orderHelp")}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          disabled={openCount >= 3}
          className="flex cursor-pointer items-center gap-2 rounded-[3px] border border-accent/20 bg-accent/10 px-3 py-2 text-[9px] font-black uppercase text-accent disabled:cursor-not-allowed disabled:opacity-30"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          {t("tickets.openTicket")}
        </button>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-[3px] border border-white/10 bg-white/[0.02] p-4">
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value.slice(0, 120))}
            placeholder={t("tickets.subjectPlaceholder")}
            className="w-full rounded-[3px] border border-white/10 bg-black/20 px-3 py-2 text-xs text-white outline-none focus:border-accent/40"
          />
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, 2000))}
            placeholder={t("tickets.initialMessagePlaceholder")}
            rows={3}
            className="w-full resize-none rounded-[3px] border border-white/10 bg-black/20 px-3 py-2 text-xs text-white outline-none focus:border-accent/40"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="cursor-pointer px-3 py-2 text-[9px] font-black uppercase text-white/50">{t("common.cancel")}</button>
            <button type="button" onClick={createTicket} disabled={creating || subject.trim().length < 3 || !message.trim()} className="cursor-pointer rounded-[3px] bg-accent px-4 py-2 text-[9px] font-black uppercase text-white disabled:cursor-not-allowed disabled:opacity-30">
              {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("tickets.create")}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-[10px] text-red-300">{error}</p>}

      {tickets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => setSelected(ticket)}
              className={`flex cursor-pointer items-center gap-2 rounded-[3px] border px-3 py-2 text-left text-[10px] ${selected?.id === ticket.id ? "border-accent/40 bg-accent/10" : "border-white/10 bg-white/[0.02]"}`}
            >
              <span className="max-w-48 truncate font-bold text-white">{ticket.subject}</span>
              {ticket.unreadCount > 0 && <span className="rounded-full bg-accent px-1.5 text-[8px] font-black text-white">{ticket.unreadCount}</span>}
            </button>
          ))}
        </div>
      )}

      {selected && createPortal(
        <div className="fixed inset-0 z-[120] flex h-dvh flex-col bg-[#070510]">
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#0f0d1e] px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-accent">{t("tickets.support")}</p>
              <h2 className="truncate text-sm font-black text-white sm:text-base">{selected.subject}</h2>
            </div>
            <button type="button" onClick={() => setSelected(null)} className="shrink-0 cursor-pointer rounded-full bg-white/10 p-2.5 text-white hover:bg-white/15" aria-label={t("common.close")}><X className="h-5 w-5" /></button>
          </div>
          <div className="min-h-0 flex-1">
            <TicketChat ticket={selected} actor="USER" onTicketUpdated={loadTickets} fullscreen />
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
