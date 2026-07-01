"use client";

import { useState } from "react";
import { Loader2, Pencil, Play, RotateCcw, Trash2, X } from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { AlertConfirmModal } from "@/shared/components/AlertConfirmModal";

export interface RaffleManageData {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  drawDate: string;
  ticketPrice: number;
  maxTickets: number | null;
  soldChances?: number;
}

interface RaffleManageActionsProps {
  raffle: RaffleManageData;
  onUpdated?: () => void;
  onDeleted?: () => void;
  layout?: "toolbar" | "compact";
}

type PendingConfirmAction = "reactivate" | "cancel" | "draw" | "delete" | null;

function toDatetimeLocalValue(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function RaffleManageActions({
  raffle,
  onUpdated,
  onDeleted,
  layout = "toolbar",
}: RaffleManageActionsProps) {
  const { t } = useI18n();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingConfirmAction>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [formName, setFormName] = useState(raffle.name);
  const [formDesc, setFormDesc] = useState(raffle.description ?? "");
  const [formDrawDate, setFormDrawDate] = useState(toDatetimeLocalValue(raffle.drawDate));
  const [formPrice, setFormPrice] = useState(String(raffle.ticketPrice));
  const [formMaxTickets, setFormMaxTickets] = useState(
    raffle.maxTickets != null ? String(raffle.maxTickets) : ""
  );

  const isFinished = raffle.status === "FINISHED";
  const isCancelled = raffle.status === "CANCELLED";
  const isPending = raffle.status === "PENDING";
  const isActive = raffle.status === "ACTIVE";
  const hasSoldChances = (raffle.soldChances ?? 0) > 0;
  const canEdit = !isFinished;
  const canManage = !isFinished;

  const refresh = () => onUpdated?.();

  const openEdit = () => {
    setFormName(raffle.name);
    setFormDesc(raffle.description ?? "");
    setFormDrawDate(toDatetimeLocalValue(raffle.drawDate));
    setFormPrice(String(raffle.ticketPrice));
    setFormMaxTickets(raffle.maxTickets != null ? String(raffle.maxTickets) : "");
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDrawDate || !formPrice) {
      alert(t("raffles.validationRequired"));
      return;
    }

    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: formName.trim(),
        description: formDesc.trim() || null,
      };

      if (!hasSoldChances) {
        payload.drawDate = new Date(formDrawDate).toISOString();
        payload.ticketPrice = Number(formPrice);
        payload.maxTickets = formMaxTickets ? Number(formMaxTickets) : null;
      }

      const res = await fetchWithAuth(`${BACKEND_URL}/raffles/admin/${raffle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || t("common.error"));

      setIsEditOpen(false);
      refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/raffles/admin/${raffle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || t("common.error"));
      refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t("common.error"));
    }
  };

  const executeReactivate = async () => {
    const res = await fetchWithAuth(`${BACKEND_URL}/raffles/admin/${raffle.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACTIVE" }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || t("common.error"));
    refresh();
  };

  const executeCancel = async () => {
    const res = await fetchWithAuth(`${BACKEND_URL}/raffles/admin/${raffle.id}/cancel`, {
      method: "PATCH",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || t("common.error"));
    refresh();
  };

  const executeDraw = async () => {
    const res = await fetchWithAuth(`${BACKEND_URL}/raffles/admin/${raffle.id}/draw`, {
      method: "POST",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || t("common.error"));
    refresh();
  };

  const executeDelete = async () => {
    const res = await fetchWithAuth(`${BACKEND_URL}/raffles/admin/${raffle.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || t("common.error"));
    }
    if (onDeleted) {
      onDeleted();
    } else {
      refresh();
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction || isActionLoading) return;

    setIsActionLoading(true);
    try {
      if (pendingAction === "reactivate") await executeReactivate();
      if (pendingAction === "cancel") await executeCancel();
      if (pendingAction === "draw") await executeDraw();
      if (pendingAction === "delete") await executeDelete();
      setPendingAction(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setIsActionLoading(false);
    }
  };

  const confirmModalConfig =
    pendingAction === "reactivate"
      ? {
          title: t("admin.rafflePurchases.reactivate"),
          message: t("admin.rafflePurchases.confirmReactivate"),
          type: "confirm" as const,
          confirmLabel: t("admin.rafflePurchases.reactivate"),
        }
      : pendingAction === "cancel"
        ? {
            title: t("raffles.cancelRaffle"),
            message: t("admin.rafflePurchases.confirmCancelRaffle"),
            type: "confirm" as const,
            confirmLabel: t("raffles.cancelRaffle"),
          }
        : pendingAction === "draw"
          ? {
              title: t("raffles.executeDraw"),
              message: t("raffles.confirmDraw"),
              type: "confirm" as const,
              confirmLabel: t("raffles.executeDraw"),
            }
          : pendingAction === "delete"
            ? {
                title: t("admin.rafflePurchases.deleteRaffle"),
                message: t("admin.rafflePurchases.confirmDeleteRaffle"),
                type: "error" as const,
                confirmLabel: t("admin.rafflePurchases.deleteRaffle"),
              }
            : null;

  const buttonBase =
    layout === "compact"
      ? "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[3px] text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer"
      : "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[3px] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer";

  return (
    <>
      <div
        className={layout === "compact" ? "flex flex-wrap gap-1.5" : "flex flex-wrap items-center gap-2"}
        onClick={(e) => e.stopPropagation()}
      >
        {canEdit && (
          <button type="button" onClick={openEdit} className={`${buttonBase} bg-white/5 hover:bg-white/10 text-white`}>
            <Pencil className={layout === "compact" ? "h-3 w-3" : "h-3.5 w-3.5"} />
            {t("raffles.editRaffle")}
          </button>
        )}

        {canManage && isPending && (
          <button
            type="button"
            onClick={handleActivate}
            className={`${buttonBase} bg-purple-500/10 hover:bg-purple-500/20 text-purple-300`}
          >
            {t("raffles.activate")}
          </button>
        )}

        {isCancelled && (
          <button
            type="button"
            onClick={() => setPendingAction("reactivate")}
            className={`${buttonBase} bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400`}
          >
            <RotateCcw className={layout === "compact" ? "h-3 w-3" : "h-3.5 w-3.5"} />
            {t("admin.rafflePurchases.reactivate")}
          </button>
        )}

        {isCancelled && (
          <button
            type="button"
            onClick={() => setPendingAction("delete")}
            className={`${buttonBase} bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-500/20`}
          >
            <Trash2 className={layout === "compact" ? "h-3 w-3" : "h-3.5 w-3.5"} />
            {t("admin.rafflePurchases.deleteRaffle")}
          </button>
        )}

        {canManage && isActive && (
          <button
            type="button"
            onClick={() => setPendingAction("draw")}
            className={`${buttonBase} bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400`}
          >
            <Play className={layout === "compact" ? "h-3 w-3" : "h-3.5 w-3.5"} />
            {t("raffles.executeDraw")}
          </button>
        )}

        {canManage && !isCancelled && (
          <button
            type="button"
            onClick={() => setPendingAction("cancel")}
            className={`${buttonBase} bg-red-500/10 hover:bg-red-500/20 text-red-400`}
          >
            <Trash2 className={layout === "compact" ? "h-3 w-3" : "h-3.5 w-3.5"} />
            {t("raffles.cancelRaffle")}
          </button>
        )}
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-lg bg-[#0f0d1e] border border-white/5 rounded-[3px] p-6 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="absolute top-5 right-5 text-white/50 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-black uppercase tracking-tight text-white mb-6">
              {t("raffles.editRaffle")}
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[#84849b] tracking-wider">
                  {t("raffles.name")}
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full bg-[#141221] border border-white/5 rounded-[3px] px-4 py-3 text-xs text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[#84849b] tracking-wider">
                  {t("raffles.desc")}
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-[#141221] border border-white/5 rounded-[3px] px-4 py-3 text-xs text-white focus:outline-none focus:border-accent h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[#84849b] tracking-wider">
                    {t("raffles.adminDrawDate")}
                  </label>
                  <input
                    type="datetime-local"
                    value={formDrawDate}
                    onChange={(e) => setFormDrawDate(e.target.value)}
                    required
                    disabled={hasSoldChances}
                    className="w-full bg-[#141221] border border-white/5 rounded-[3px] px-4 py-3 text-xs text-white focus:outline-none focus:border-accent disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[#84849b] tracking-wider">
                    {t("raffles.ticketPriceLabel")}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.10"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    required
                    disabled={hasSoldChances}
                    className="w-full bg-[#141221] border border-white/5 rounded-[3px] px-4 py-3 text-xs text-white focus:outline-none focus:border-accent disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[#84849b] tracking-wider">
                  {t("raffles.maxTicketsLabel")}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formMaxTickets}
                  onChange={(e) => setFormMaxTickets(e.target.value)}
                  disabled={hasSoldChances}
                  className="w-full bg-[#141221] border border-white/5 rounded-[3px] px-4 py-3 text-xs text-white focus:outline-none focus:border-accent disabled:opacity-50"
                  placeholder={t("raffles.maxTicketsLabel")}
                />
              </div>

              {hasSoldChances && (
                <p className="text-[10px] text-amber-300/80 font-bold">
                  {t("admin.rafflePurchases.editRestrictedHint")}
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2.5 rounded-[3px] hover:bg-white/5 text-xs font-bold text-white uppercase tracking-wider cursor-pointer"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-[3px] bg-accent hover:bg-accent/90 text-xs font-black uppercase text-white tracking-widest transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("raffles.save")}
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmModalConfig && (
        <AlertConfirmModal
          isOpen={pendingAction !== null}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          type={confirmModalConfig.type}
          confirmLabel={isActionLoading ? "..." : confirmModalConfig.confirmLabel}
          cancelLabel={t("common.cancel")}
          onConfirm={handleConfirmAction}
          onCancel={() => !isActionLoading && setPendingAction(null)}
        />
      )}
    </>
  );
}
