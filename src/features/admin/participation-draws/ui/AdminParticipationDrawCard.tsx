"use client";

import React, { useEffect, useState } from "react";
import {
  Ban,
  Bot,
  Calendar,
  Clock,
  Dices,
  Gift,
  Package,
  Pencil,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import { AdminButton, AdminSection } from "@/features/admin/ui/AdminShell";
import { ParticipationDrawAdminWinnersList } from "@/features/admin/participation-draws/ui/ParticipationDrawAdminWinnersList";

export interface AdminParticipationDrawPrize {
  id: string;
  position: number;
  name: string;
  iconUrl: string | null;
  winnerId?: string | null;
  winner?: {
    id: string;
    name: string | null;
    avatar: string | null;
    steamId?: string | null;
    tradeUrl?: string | null;
    isFake?: boolean;
  } | null;
}

export interface AdminParticipationDrawWinner {
  prizeId: string;
  position: number;
  prizeName: string;
  prizeIconUrl: string | null;
  winner: {
    id: string;
    name: string | null;
    avatar: string | null;
    steamId?: string | null;
    tradeUrl?: string | null;
    isFake?: boolean;
  } | null;
}

export interface AdminParticipationDrawData {
  id: string;
  name: string;
  description: string | null;
  minRaffles: number;
  drawDate: string;
  status: string;
  eligibleCount: number;
  prizes: AdminParticipationDrawPrize[];
  winners?: AdminParticipationDrawWinner[];
}

interface AdminParticipationDrawCardProps {
  draw: AdminParticipationDrawData;
  actionLoading?: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  onShowEligible: (draw: AdminParticipationDrawData) => void;
  onRunDraw: (draw: AdminParticipationDrawData) => void;
  onManualDraw: (draw: AdminParticipationDrawData) => void;
  onAddBots: (draw: AdminParticipationDrawData) => void;
  onEdit: (draw: AdminParticipationDrawData) => void;
  onCancel: (draw: AdminParticipationDrawData) => void;
  onDelete: (draw: AdminParticipationDrawData) => void;
}

function statusBadge(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-accent/10 text-accent border-accent/20";
    case "FINISHED":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "CANCELLED":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-[#84849b]/10 text-[#84849b] border-[#84849b]/20";
  }
}

export function AdminParticipationDrawCard({
  draw,
  actionLoading = false,
  t,
  onShowEligible,
  onRunDraw,
  onManualDraw,
  onAddBots,
  onEdit,
  onCancel,
  onDelete,
}: AdminParticipationDrawCardProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const isOpen = draw.status === "OPEN";
  const isFinished = draw.status === "FINISHED";

  const statusLabel =
    draw.status === "OPEN"
      ? t("participationDraws.status.open")
      : draw.status === "FINISHED"
        ? t("participationDraws.status.finished")
        : t("participationDraws.status.cancelled");

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft("");
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const drawTime = new Date(draw.drawDate).getTime();
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
  }, [isOpen, draw.drawDate, t]);

  return (
    <AdminSection className="relative overflow-hidden p-6 border border-white/[0.05] bg-linear-to-b from-[#141221] to-[#0f0d1e] shadow-2xl transition-all duration-300 hover:border-white/10 group">
      {isOpen && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[80px] rounded-full pointer-events-none" />
      )}

      <div className="relative flex flex-col xl:flex-row xl:items-start justify-between gap-8">
        <div className="flex-1 space-y-4 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-xl font-black text-white uppercase tracking-wider drop-shadow-sm">
              {draw.name}
            </h3>
            <span
              className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-[4px] border ${statusBadge(draw.status)} flex items-center gap-1.5 shadow-xs`}
            >
              {isOpen && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
              {statusLabel}
            </span>
          </div>

          <p className="text-sm text-[#84849b] leading-relaxed max-w-3xl">
            {draw.description || t("raffles.noDescription") || "Sin descripción proporcionada."}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/[0.02] border border-white/[0.03] rounded-lg p-3 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[#84849b] text-[10px] font-bold uppercase tracking-widest">
                <Calendar className="w-3.5 h-3.5 text-accent" />
                {t("admin.participationDraws.drawDate")}
              </div>
              <span className="text-xs text-white font-medium">
                {new Date(draw.drawDate).toLocaleString()}
              </span>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.03] rounded-lg p-3 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[#84849b] text-[10px] font-bold uppercase tracking-widest">
                <Gift className="w-3.5 h-3.5 text-accent" />
                {t("admin.participationDraws.minRaffles")}
              </div>
              <span className="text-xs text-white font-medium">{draw.minRaffles}</span>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.03] rounded-lg p-3 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[#84849b] text-[10px] font-bold uppercase tracking-widest">
                <Package className="w-3.5 h-3.5 text-accent" />
                {t("admin.participationDraws.prizes")}
              </div>
              <span className="text-xs text-white font-medium">
                {t("admin.raffles.prizesCount", { count: draw.prizes.length })}
              </span>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.03] rounded-lg p-3 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[#84849b] text-[10px] font-bold uppercase tracking-widest">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                {t("admin.participationDraws.eligible")}
              </div>
              <span className="text-xs text-emerald-400 font-bold">{draw.eligibleCount}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 xl:w-72 shrink-0">
          {isOpen && (
            <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 shadow-[inset_0_0_20px_rgba(255,170,0,0.05)]">
              <div className="flex items-center gap-2 text-accent/80 text-[10px] font-black uppercase tracking-widest">
                <Clock className="w-4 h-4 animate-pulse" />
                {t("admin.raffles.timeRemaining")}
              </div>
              <div className="text-2xl font-black text-accent tracking-wider font-mono drop-shadow-md">
                {timeLeft || t("admin.raffles.calculating")}
              </div>
            </div>
          )}

          <div className="bg-black/20 border border-white/5 rounded-xl p-4">
            <h4 className="text-[10px] font-bold text-[#84849b] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Package className="w-3.5 h-3.5" />
              {t("admin.raffles.prizesPreview")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {draw.prizes.slice(0, 5).map((prize) => (
                <div
                  key={prize.id}
                  className="w-11 h-11 rounded-md border border-white/10 bg-white/[0.03] p-1 flex items-center justify-center relative group/prize transition-transform hover:scale-110"
                  title={`#${prize.position} ${prize.name}`}
                >
                  {prize.iconUrl ? (
                    <img
                      src={prize.iconUrl}
                      alt={prize.name}
                      className="w-full h-full object-contain drop-shadow-md"
                    />
                  ) : (
                    <Package className="w-4 h-4 text-white/20" />
                  )}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 border border-white/10 text-[9px] text-white px-2 py-1 rounded opacity-0 group-hover/prize:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-10">
                    #{prize.position} {prize.name}
                  </div>
                </div>
              ))}
              {draw.prizes.length > 5 && (
                <div className="w-11 h-11 rounded-md border border-white/10 bg-white/[0.01] flex items-center justify-center text-xs font-black text-[#84849b]">
                  +{draw.prizes.length - 5}
                </div>
              )}
              {draw.prizes.length === 0 && (
                <p className="text-[10px] text-[#84849b] italic">
                  {t("admin.participationDraws.prizes")}: 0
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-white/[0.05] flex flex-wrap items-center gap-3 bg-black/10 -mx-6 -mb-6 px-6 py-4">
        <AdminButton
          variant="secondary"
          icon={Users}
          onClick={() => onShowEligible(draw)}
        >
          {t("admin.participationDraws.showEligible")}
        </AdminButton>

        {isOpen && (
          <>
            <AdminButton
              variant="primary"
              icon={Dices}
              onClick={() => onRunDraw(draw)}
              disabled={draw.eligibleCount < 1 || actionLoading}
            >
              {t("admin.participationDraws.runDraw")}
            </AdminButton>
            <AdminButton
              variant="secondary"
              icon={Trophy}
              onClick={() => onManualDraw(draw)}
              disabled={draw.eligibleCount < 1 || actionLoading}
            >
              {t("admin.participationDraws.manualDraw")}
            </AdminButton>
            <AdminButton variant="secondary" icon={Bot} onClick={() => onAddBots(draw)}>
              {t("admin.raffles.bots")}
            </AdminButton>
            <AdminButton variant="ghost" icon={Pencil} onClick={() => onEdit(draw)}>
              {t("common.edit")}
            </AdminButton>
            <AdminButton variant="danger" icon={Ban} onClick={() => onCancel(draw)}>
              {t("admin.participationDraws.cancel")}
            </AdminButton>
          </>
        )}

        {!isFinished && (
          <AdminButton variant="danger" icon={Trash2} onClick={() => onDelete(draw)}>
            {t("common.delete")}
          </AdminButton>
        )}

        {isFinished && (
          <div className="w-full mt-2 pt-2">
            <ParticipationDrawAdminWinnersList prizes={draw.prizes} t={t} />
          </div>
        )}
      </div>
    </AdminSection>
  );
}
