"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare, RefreshCw, Search, X } from "lucide-react";
import { AdminSelect } from "@/shared/components/AdminSelect";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import type { OrderTicket, TicketStatus } from "../domain/types";
import { getTicketSocket } from "../infrastructure/ticketSocket";
import { TicketChat } from "./TicketChat";

export function AdminTicketsTab() {
  const { t } = useI18n();
  const router = useRouter();
  const [tickets, setTickets] = useState<OrderTicket[]>([]);
  const [selected, setSelected] = useState<OrderTicket | null>(null);
  const [status, setStatus] = useState("OPEN");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status !== "ALL") params.set("status", status);
      if (search.trim()) params.set("search", search.trim());
      const response = await fetchWithAuth(`${BACKEND_URL}/tickets/admin?${params}`, {
        headers: { "X-Ticket-Actor": "ADMIN" },
      });
      if (!response.ok) throw new Error(t("tickets.error.load"));
      const data: OrderTicket[] = await response.json();
      setTickets(data);
      const requestedTicketId = new URLSearchParams(window.location.search).get("ticket");
      setSelected((current) => {
        if (requestedTicketId) {
          return data.find((ticket) => ticket.id === requestedTicketId) || current;
        }
        return current ? data.find((ticket) => ticket.id === current.id) || current : null;
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("tickets.error.load"));
    } finally {
      setLoading(false);
    }
  }, [search, status, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadTickets, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadTickets]);

  const loadTicketsRef = useRef(loadTickets);
  useEffect(() => {
    loadTicketsRef.current = loadTickets;
  }, [loadTickets]);

  useEffect(() => {
    let socketRef: Awaited<ReturnType<typeof getTicketSocket>> | null = null;
    let cancelled = false;

    const handleUpdate = () => {
      loadTicketsRef.current();
    };

    const connect = async () => {
      try {
        const socket = await getTicketSocket("ADMIN");
        if (cancelled) return;
        socketRef = socket;
        socket.on("ticket:updated", handleUpdate);
      } catch {
        setError(t("tickets.error.connection"));
      }
    };
    connect();

    return () => {
      cancelled = true;
      if (socketRef) {
        socketRef.off("ticket:updated", handleUpdate);
      }
    };
  }, [t]);

  const changeStatus = async (nextStatus: TicketStatus) => {
    if (!selected) return;
    setUpdating(true);
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/tickets/admin/${selected.id}/status`, {
        method: "PATCH",
        headers: { "X-Ticket-Actor": "ADMIN" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) throw new Error(t("tickets.error.status"));
      setSelected({ ...selected, status: nextStatus });
      await loadTickets();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("tickets.error.status"));
    } finally {
      setUpdating(false);
    }
  };

  const closeTicket = () => {
    setSelected(null);
    router.replace("/admin/panel/dashboard?tab=tickets");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-white"><MessageSquare className="h-5 w-5 text-accent" />{t("tickets.adminTitle")}</h2>
          <p className="mt-1 text-xs text-[#84849b]">{t("tickets.adminDescription")}</p>
        </div>
        <button type="button" onClick={loadTickets} className="flex cursor-pointer items-center justify-center gap-2 rounded-[3px] border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white"><RefreshCw className="h-4 w-4" />{t("common.refresh")}</button>
      </div>

      <div className="flex flex-col gap-3 rounded-[3px] border border-white/5 bg-[#110f1e]/40 p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("tickets.searchPlaceholder")} className="w-full rounded-[3px] border border-white/10 bg-black/20 py-2.5 pl-10 pr-3 text-xs text-white outline-none focus:border-accent/40" />
        </div>
        <AdminSelect value={status} onChange={setStatus} options={[
          { value: "OPEN", label: t("tickets.status.open") },
          { value: "CLOSED", label: t("tickets.status.closed") },
          { value: "ALL", label: t("tickets.status.all") },
        ]} />
      </div>

      {error && <p className="rounded-[3px] border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}

      <div className="min-h-[420px] overflow-hidden rounded-[3px] border border-white/5 bg-[#110f1e]/30">
        {loading ? <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-accent" /> : tickets.length === 0 ? (
          <p className="p-10 text-center text-xs text-white/35">{t("tickets.noTickets")}</p>
        ) : (
          <div className="max-h-[680px] divide-y divide-white/5 overflow-y-auto">
            {tickets.map((ticket) => (
              <button key={ticket.id} type="button" onClick={() => setSelected(ticket)} className="w-full cursor-pointer p-4 text-left transition-colors hover:bg-white/[0.03] sm:px-5 sm:py-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-xs font-black text-white">{ticket.subject}</span>
                  {ticket.unreadCount > 0 && <span className="rounded-full bg-accent px-1.5 py-0.5 text-[8px] font-black text-white">{ticket.unreadCount}</span>}
                </div>
                <p className="mt-1 truncate text-[10px] text-white/45">{ticket.user?.name || t("admin.common.unknownUser")}</p>
                <div className="mt-2 flex items-center justify-between text-[9px] font-mono text-white/30">
                  <span>{ticket.order.type} · #{ticket.orderId.slice(0, 8)}</span>
                  <span>{t(`tickets.status.${ticket.status.toLowerCase()}`)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && createPortal(
        <div className="fixed inset-0 z-[120] flex h-dvh flex-col bg-[#070510]">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0f0d1e] px-4 py-3 sm:px-6">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[9px] font-mono text-white/45">
                {t("tickets.orderReference")}: <span className="text-white">{selected.orderId}</span> · {selected.order.type}
              </p>
              <h2 className="truncate text-sm font-black text-white sm:text-base">{selected.subject}</h2>
              <p className="mt-0.5 truncate text-[10px] text-white/45">{selected.user?.name || t("admin.common.unknownUser")} · SteamID: {selected.user?.steamId || "N/A"}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" disabled={updating} onClick={() => changeStatus(selected.status === "OPEN" ? "CLOSED" : "OPEN")} className="cursor-pointer rounded-[3px] border border-white/10 bg-white/5 px-3 py-2.5 text-[9px] font-black uppercase text-white disabled:cursor-not-allowed disabled:opacity-40">
                {selected.status === "OPEN" ? t("tickets.close") : t("tickets.reopen")}
              </button>
              <button type="button" onClick={closeTicket} className="cursor-pointer rounded-full bg-white/10 p-2.5 text-white hover:bg-white/15" aria-label={t("common.close")}><X className="h-5 w-5" /></button>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <TicketChat ticket={selected} actor="ADMIN" onTicketUpdated={loadTickets} fullscreen />
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
