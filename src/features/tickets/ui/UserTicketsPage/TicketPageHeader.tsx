import { Plus, RefreshCw, Ticket } from "lucide-react";

import type { TranslationParams } from "@/shared/i18n/types";

type Translate = (key: string, params?: TranslationParams) => string;

export function TicketPageHeader({
  loading,
  onNewTicket,
  onRefresh,
  t,
}: {
  loading: boolean;
  onNewTicket: () => void;
  onRefresh: () => void;
  t: Translate;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-white/5 pb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
          <Ticket className="w-8 h-8 text-accent animate-pulse" />
          {t("nav.tickets")}
        </h1>
        <p className="text-sm text-[#8984a1] mt-1.5 font-medium">
          {t("tickets.pageDescription")}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center justify-center gap-2 h-12 px-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-[3px] text-sm font-black uppercase tracking-wider text-white transition-all duration-300 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-accent" : ""}`} />
          <span className="hidden sm:inline">{t("common.refresh")}</span>
        </button>

        <button
          type="button"
          onClick={onNewTicket}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-[3px] bg-gradient-to-r from-accent to-fuchsia-600 hover:from-accent hover:to-fuchsia-500 px-6 py-3 text-sm font-black uppercase text-white shadow-[0_0_20px_rgba(217,70,239,0.35)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <Plus className="h-4 w-4" />
          {t("tickets.openTicket")}
        </button>
      </div>
    </div>
  );
}
