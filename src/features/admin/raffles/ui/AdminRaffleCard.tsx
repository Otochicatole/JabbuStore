import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Gift, ExternalLink, Calendar, Ticket, Package, Clock, ShieldCheck, ShieldAlert, Activity } from "lucide-react";
import { AdminSection } from "@/features/admin/ui/AdminShell";
import { RaffleManageActions, type RaffleManageData } from "@/features/admin/raffles/ui/RaffleManageActions";
import { RaffleAdminWinnersList } from "@/features/admin/raffles/ui/RaffleAdminWinnersList";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";

interface AdminRaffleCardProps {
  raffle: any; // Using any for simplicity in this extraction, though ideally we'd type it based on the parent.
  fetchRaffles: () => void;
  t: (key: string) => string;
}

const getRaffleStatusBadge = (status: string) => {
  switch (status) {
    case "PENDING":
      return "bg-[#84849b]/10 text-[#84849b] border-[#84849b]/20";
    case "ACTIVE":
      return "bg-accent/10 text-accent border-accent/20";
    case "FINISHED":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "CANCELLED":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-[#84849b]/10 text-[#84849b] border-[#84849b]/20";
  }
};

export const AdminRaffleCard: React.FC<AdminRaffleCardProps> = ({ raffle, fetchRaffles, t }) => {
  const localizePath = useLocalizedPath();
  const [timeLeft, setTimeLeft] = useState<string>("");
  const isFinished = raffle.status === "FINISHED";
  const isActive = raffle.status === "ACTIVE";
  const soldTickets = raffle.tickets?.filter((t: any) => t.status === "PAID").length || 0;
  
  const pct = raffle.maxTickets
    ? Math.min(100, Math.round((soldTickets / raffle.maxTickets) * 100))
    : 0;

  const manageData: RaffleManageData = {
    id: raffle.id,
    name: raffle.name,
    description: raffle.description,
    status: raffle.status,
    isPublic: raffle.isPublic,
    drawDate: raffle.drawDate,
    ticketPrice: raffle.ticketPrice,
    maxTickets: raffle.maxTickets,
    soldChances: soldTickets,
  };

  useEffect(() => {
    if (isActive) {
      const updateCountdown = () => {
        const now = new Date().getTime();
        const drawTime = new Date(raffle.drawDate).getTime();
        const diff = drawTime - now;

        if (diff <= 0) {
          setTimeLeft(t("raffles.drawingSoon") || "Sorteando pronto...");
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const pad = (n: number) => n.toString().padStart(2, "0");
        let formatted = "";
        if (days > 0) formatted += `${days}d `;
        formatted += `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
        
        setTimeLeft(formatted);
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft("");
    }
  }, [isActive, raffle.drawDate, t]);

  return (
    <AdminSection className="relative overflow-hidden p-6 border border-white/[0.05] bg-linear-to-b from-[#141221] to-[#0f0d1e] shadow-2xl transition-all duration-300 hover:border-white/10 group">
      {isActive && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[80px] rounded-full pointer-events-none" />
      )}
      
      <div className="relative flex flex-col xl:flex-row xl:items-start justify-between gap-8">
        
        {/* Principal Info */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-xl font-black text-white uppercase tracking-wider drop-shadow-sm">
              {raffle.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-[4px] border ${getRaffleStatusBadge(raffle.status)} flex items-center gap-1.5 shadow-xs`}>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
                {t(`admin.status${raffle.status.charAt(0).toUpperCase() + raffle.status.slice(1).toLowerCase()}`) || raffle.status}
              </span>
              {!raffle.isPublic && (
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-[4px] border bg-[#84849b]/10 text-[#84849b] border-[#84849b]/20 flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3" />
                  {t("admin.raffles.hiddenFromClient") || "Oculto"}
                </span>
              )}
            </div>
          </div>
          
          <p className="text-sm text-[#84849b] leading-relaxed max-w-3xl">
            {raffle.description || t("raffles.noDescription") || "Sin descripción proporcionada."}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/[0.02] border border-white/[0.03] rounded-lg p-3 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[#84849b] text-[10px] font-bold uppercase tracking-widest">
                <Calendar className="w-3.5 h-3.5 text-accent" />
                Fecha Sorteo
              </div>
              <span className="text-xs text-white font-medium">
                {new Date(raffle.drawDate).toLocaleString()}
              </span>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.03] rounded-lg p-3 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[#84849b] text-[10px] font-bold uppercase tracking-widest">
                <Ticket className="w-3.5 h-3.5 text-accent" />
                Precio
              </div>
              <span className="text-xs text-white font-medium">
                ${raffle.ticketPrice.toFixed(2)} / chance
              </span>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.03] rounded-lg p-3 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[#84849b] text-[10px] font-bold uppercase tracking-widest">
                <Gift className="w-3.5 h-3.5 text-accent" />
                Premios
              </div>
              <span className="text-xs text-white font-medium">
                {raffle.prizes?.length || 0} items
              </span>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.03] rounded-lg p-3 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[#84849b] text-[10px] font-bold uppercase tracking-widest">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Recaudación
              </div>
              <span className="text-xs text-emerald-400 font-bold">
                ${(soldTickets * raffle.ticketPrice).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/[0.05]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[#84849b] uppercase tracking-widest flex items-center gap-1.5">
                Progreso de Tickets
                <span className="text-white bg-white/10 px-1.5 py-0.5 rounded ml-1">{soldTickets} {raffle.maxTickets ? `/ ${raffle.maxTickets}` : ""}</span>
              </span>
              {raffle.maxTickets && (
                <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{pct}%</span>
              )}
            </div>
            
            {raffle.maxTickets ? (
              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                <div
                  className="absolute top-0 left-0 h-full bg-linear-to-r from-accent/80 to-accent rounded-full shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)] transition-all duration-1000"
                  style={{ width: `${pct}%` }}
                />
              </div>
            ) : (
              <div className="text-[10px] text-[#84849b] italic">Sin límite de tickets</div>
            )}
          </div>
        </div>

        {/* Aside Info: Countdown & Prizes */}
        <div className="flex flex-col gap-6 xl:w-72 shrink-0">
          
          {isActive && (
            <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 shadow-[inset_0_0_20px_rgba(255,170,0,0.05)]">
              <div className="flex items-center gap-2 text-accent/80 text-[10px] font-black uppercase tracking-widest">
                <Clock className="w-4 h-4 animate-pulse" />
                Tiempo Restante
              </div>
              <div className="text-2xl font-black text-accent tracking-wider font-mono drop-shadow-md">
                {timeLeft || "Calculando..."}
              </div>
            </div>
          )}

          <div className="bg-black/20 border border-white/5 rounded-xl p-4">
            <h4 className="text-[10px] font-bold text-[#84849b] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Package className="w-3.5 h-3.5" />
              Vista Previa de Premios
            </h4>
            <div className="flex flex-wrap gap-2">
              {raffle.prizes?.slice(0, 5).map((p: any) => (
                <div
                  key={p.id}
                  className="w-11 h-11 rounded-md border border-white/10 bg-white/[0.03] p-1 flex items-center justify-center relative group/prize transition-transform hover:scale-110"
                  title={p.name}
                >
                  {p.iconUrl ? (
                    <img
                      src={p.iconUrl}
                      alt={p.name}
                      className="w-full h-full object-contain drop-shadow-md"
                    />
                  ) : (
                    <Package className="w-4 h-4 text-white/20" />
                  )}
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 border border-white/10 text-[9px] text-white px-2 py-1 rounded opacity-0 group-hover/prize:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-10">
                    {p.name}
                  </div>
                </div>
              ))}
              {(raffle.prizes?.length || 0) > 5 && (
                <div className="w-11 h-11 rounded-md border border-white/10 bg-white/[0.01] flex items-center justify-center text-xs font-black text-[#84849b]">
                  +{(raffle.prizes?.length || 0) - 5}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Actions Footer */}
      <div className="mt-6 pt-5 border-t border-white/[0.05] flex flex-wrap items-center gap-3 bg-black/10 -mx-6 -mb-6 px-6 py-4">
        <Link
          href={localizePath(`/admin/panel/raffle-purchases?raffle=${raffle.id}`)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white text-[11px] font-black uppercase tracking-widest transition-all hover:scale-[1.02]"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#84849b]" />
          Ver Participantes
        </Link>

        <RaffleManageActions
          raffle={manageData}
          onUpdated={fetchRaffles}
          onDeleted={fetchRaffles}
          layout="toolbar"
        />

        {isFinished && (
          <div className="w-full mt-4 pt-4 border-t border-white/5">
            <RaffleAdminWinnersList prizes={raffle.prizes} t={t} />
          </div>
        )}
      </div>

    </AdminSection>
  );
};
