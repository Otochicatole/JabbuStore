import { AlertCircle, Calendar, Inbox, Loader2 } from "lucide-react";

import type { OrderTicket } from "@/features/tickets/domain/types";
import type { TranslationParams } from "@/shared/i18n/types";

import type { TicketStatusFilter } from "./useUserTickets";

type Translate = (key: string, params?: TranslationParams) => string;

interface TicketsListPanelProps {
  filteredTickets: OrderTicket[];
  loading: boolean;
  locale: string;
  selectedTicketId?: string;
  statusFilter: TicketStatusFilter;
  ticketsCount: number;
  onSelectTicket: (ticket: OrderTicket) => void;
  onStatusFilterChange: (status: TicketStatusFilter) => void;
  t: Translate;
}

export function TicketsListPanel({
  filteredTickets,
  loading,
  locale,
  selectedTicketId,
  statusFilter,
  ticketsCount,
  onSelectTicket,
  onStatusFilterChange,
  t,
}: TicketsListPanelProps) {
  return (
    <div className="order-2 lg:order-1 lg:col-span-2 rounded-2xl border border-white/5 bg-[#110f1e]/40 overflow-hidden min-h-[380px] flex flex-col backdrop-blur-md shadow-2xl relative">
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
      <div className="flex bg-[#110f1e]/90 border-b border-white/5 p-4 shrink-0 gap-4 items-center justify-between flex-wrap z-10">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#8984a1]">
          Lista de tickets
        </span>
        <div className="flex bg-[#0d0b16] border border-white/5 p-1 rounded-full">
          {(["ALL", "OPEN", "CLOSED"] as const).map((status) => (
            <button
              key={status}
              onClick={() => onStatusFilterChange(status)}
              className={`px-4 py-1.5 text-[8.5px] font-black uppercase tracking-wider rounded-full transition-all duration-300 text-center cursor-pointer ${
                statusFilter === status
                  ? "bg-accent text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]"
                  : "text-white/40 hover:text-white"
              }`}
            >
              {status === "ALL"
                ? "Todos"
                : status === "OPEN"
                  ? t("tickets.status.open")
                  : t("tickets.status.closed")}
            </button>
          ))}
        </div>
      </div>

      {loading && ticketsCount === 0 ? (
        <div className="flex items-center justify-center py-24 flex-1">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-24 px-6 flex-1 flex flex-col justify-center items-center relative z-10">
          <div className="absolute w-48 h-48 bg-accent/5 rounded-full blur-3xl -z-10" />
          <Inbox className="w-16 h-16 text-white/10 mb-4 animate-pulse" />
          <p className="text-xs font-black uppercase tracking-widest text-white/50">
            {t("tickets.noTickets")}
          </p>
          <p className="text-[11px] text-[#8984a1] mt-2 max-w-xs mx-auto leading-relaxed">
            No tienes consultas registradas bajo este filtro en este momento.
          </p>
        </div>
      ) : (
        <div className="p-4 sm:p-5 max-h-[600px] overflow-y-auto custom-scrollbar flex flex-col gap-3.5 z-10">
          {filteredTickets.map((ticket) => (
            <TicketListItem
              key={ticket.id}
              locale={locale}
              selected={selectedTicketId === ticket.id}
              ticket={ticket}
              onSelect={() => onSelectTicket(ticket)}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TicketListItem({
  locale,
  onSelect,
  selected,
  ticket,
  t,
}: {
  locale: string;
  onSelect: () => void;
  selected: boolean;
  ticket: OrderTicket;
  t: Translate;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full cursor-pointer p-4 text-left transition-all duration-300 rounded-xl border flex items-center justify-between gap-4 relative overflow-hidden group backdrop-blur-sm ${
        selected
          ? "bg-[#211c33]/65 border-accent/40 shadow-[0_4px_25px_rgba(217,70,239,0.12)] scale-[1.01]"
          : "bg-[#211c33]/15 border-white/5 hover:border-white/10 hover:bg-[#211c33]/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:translate-x-1"
      }`}
    >
      <div className={`absolute top-0 bottom-0 left-0 w-1.5 transition-all duration-300 ${selected ? "bg-accent" : "bg-transparent group-hover:bg-white/15"}`} />
      <div className="min-w-0 flex-1 space-y-2.5 pl-2">
        <div className="flex items-center gap-2.5">
          <span className={`text-xs sm:text-sm font-black tracking-wide transition-colors ${selected ? "text-white" : "text-white/80 group-hover:text-white"}`}>
            {ticket.subject}
          </span>
          {ticket.unreadCount > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[8px] font-black text-white shrink-0 shadow-[0_0_12px_rgba(217,70,239,0.5)] animate-pulse">
              {ticket.unreadCount}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono text-white/40">
          <span
            className={`px-2 py-0.5 rounded-[4px] border text-[8px] font-bold uppercase tracking-wider ${
              ticket.order?.type === "BUY"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.05)]"
                : "bg-purple-500/10 border-purple-500/20 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.05)]"
            }`}
          >
            {ticket.order?.type === "BUY" ? "Compra" : "Venta"}
          </span>
          <span>-</span>
          <span className="font-semibold text-white/50 bg-white/5 px-1.5 py-0.5 rounded select-all">
            #{ticket.orderId.slice(0, 8)}
          </span>
          <span>-</span>
          <span className="flex items-center gap-1.5 text-white/35 font-sans">
            <Calendar className="w-3 h-3 text-[#8984a1]/60" />
            {new Date(ticket.createdAt).toLocaleDateString(locale, {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
      <div className="shrink-0">
        <span
          className={`rounded-full border px-3 py-1 text-[8.5px] font-black uppercase tracking-wider transition-all duration-300 ${
            ticket.status === "OPEN"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
              : "border-white/10 bg-white/5 text-white/30"
          }`}
        >
          {ticket.status === "OPEN" ? t("tickets.status.open") : t("tickets.status.closed")}
        </span>
      </div>
    </button>
  );
}

export function TicketsError({ error }: { error: string }) {
  return (
    <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3.5 rounded-xl text-xs flex items-center gap-3">
      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
      <p>{error}</p>
    </div>
  );
}
