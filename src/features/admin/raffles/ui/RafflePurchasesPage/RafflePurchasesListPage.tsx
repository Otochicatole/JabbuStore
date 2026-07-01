"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Package, RefreshCw, Ticket } from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import {
  AdminAlert,
  AdminButton,
  AdminEmptyState,
  AdminHeader,
  AdminLoadingState,
} from "@/features/admin/ui/AdminShell";
import {
  RaffleManageActions,
  type RaffleManageData,
} from "@/features/admin/raffles/ui/RaffleManageActions";

export interface RaffleSummary {
  id: string;
  name: string;
  description: string | null;
  status: string;
  drawDate: string;
  ticketPrice: number;
  maxTickets: number | null;
  prizesCount: number;
  soldChances: number;
  pendingChances: number;
  revenue: number;
  ordersCount: number;
  prizes: { iconUrl: string | null; name: string }[];
}

function getRaffleStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "PENDING":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "FINISHED":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    default:
      return "bg-red-500/10 text-red-400 border-red-500/20";
  }
}

function RaffleListCard({
  raffle,
  href,
  onUpdated,
}: {
  raffle: RaffleSummary;
  href: string;
  onUpdated: () => void;
}) {
  const pct = raffle.maxTickets
    ? Math.min(100, Math.round((raffle.soldChances / raffle.maxTickets) * 100))
    : 0;

  const manageData: RaffleManageData = {
    id: raffle.id,
    name: raffle.name,
    description: raffle.description,
    status: raffle.status,
    drawDate: raffle.drawDate,
    ticketPrice: raffle.ticketPrice,
    maxTickets: raffle.maxTickets,
    soldChances: raffle.soldChances,
  };

  return (
    <div className="rounded-[3px] border border-white/5 bg-[#110f1e]/35 p-4 transition-all hover:border-accent/30 hover:bg-accent/5">
      <Link href={href} className="block">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-white">{raffle.name}</p>
            <p className="text-[10px] font-mono text-[#84849b] mt-0.5">
              {new Date(raffle.drawDate).toLocaleDateString()}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-[3px] border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${getRaffleStatusBadge(raffle.status)}`}
          >
            {raffle.status}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] font-bold text-[#84849b] uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1">
            <Ticket className="w-3 h-3" />
            {raffle.soldChances} {raffle.maxTickets ? `/ ${raffle.maxTickets}` : "vendidas"}
          </span>
          <span className="text-emerald-400 font-mono">${raffle.revenue.toFixed(2)}</span>
        </div>

        {raffle.maxTickets ? (
          <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden mb-3">
            <div
              className="bg-linear-to-r from-accent to-accent/60 h-full rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
        ) : null}

        <div className="flex items-center gap-1.5">
          {raffle.prizes.map((p, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded border border-white/5 bg-white/5 flex items-center justify-center overflow-hidden"
              title={p.name}
            >
              {p.iconUrl ? (
                <img src={p.iconUrl} alt={p.name} className="w-full h-full object-contain" />
              ) : (
                <Package className="w-3 h-3 text-white/20" />
              )}
            </div>
          ))}
          {raffle.ordersCount > 0 && (
            <span className="ml-auto text-[9px] font-black uppercase tracking-wider text-[#84849b]">
              {raffle.ordersCount} {raffle.ordersCount === 1 ? "orden" : "órdenes"}
            </span>
          )}
        </div>
      </Link>

      <div className="mt-3 pt-3 border-t border-white/5">
        <RaffleManageActions
          raffle={manageData}
          onUpdated={onUpdated}
          onDeleted={onUpdated}
          layout="compact"
        />
      </div>
    </div>
  );
}

export function RafflePurchasesListPage() {
  const { t } = useI18n();
  const localizePath = useLocalizedPath();

  const [raffles, setRaffles] = useState<RaffleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRaffles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/raffles/admin/summaries`);
      if (!res.ok) throw new Error("Error al cargar los sorteos.");
      setRaffles(await res.json());
    } catch (err: any) {
      setError(err.message || "Error al cargar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRaffles();
  }, []);

  return (
    <div className="space-y-6">
      <AdminHeader
        title={t("admin.rafflePurchases.title")}
        description={t("admin.rafflePurchases.description")}
        actions={
          <AdminButton
            onClick={fetchRaffles}
            disabled={loading}
            icon={RefreshCw}
            loading={loading}
            variant="secondary"
          >
            {t("common.refresh")}
          </AdminButton>
        }
      />

      {error && <AdminAlert>{error}</AdminAlert>}

      {loading ? (
        <AdminLoadingState />
      ) : raffles.length === 0 ? (
        <AdminEmptyState icon={Ticket} title="No hay sorteos" description="Crea tu primer sorteo desde la sección Sorteos." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {raffles.map((r) => (
            <RaffleListCard
              key={r.id}
              raffle={r}
              href={localizePath(`/admin/panel/raffle-purchases/${r.id}`)}
              onUpdated={fetchRaffles}
            />
          ))}
        </div>
      )}
    </div>
  );
}
