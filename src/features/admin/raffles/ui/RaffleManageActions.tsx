"use client";

import { useState, useEffect } from "react";
import { Loader2, Eye, EyeOff, Pencil, Play, RotateCcw, Trash2, Bot } from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { AlertConfirmModal } from "@/shared/components/AlertConfirmModal";
import { AdminButton, AdminModal } from "@/features/admin/ui/AdminShell";

export interface RaffleManageData {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  isPublic?: boolean;
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

interface FakeBotItem {
  id: string;
  name: string;
}

type PendingConfirmAction = "reactivate" | "cancel" | "draw" | "delete" | "hide" | "show" | null;

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

  const [isAddBotsOpen, setIsAddBotsOpen] = useState(false);
  const [botMode, setBotMode] = useState<"new" | "existing">("new");
  const [formBotName, setFormBotName] = useState("");
  const [formBotAvatar, setFormBotAvatar] = useState("");
  const [formBotAvatarFile, setFormBotAvatarFile] = useState<File | null>(null);
  const [formBotId, setFormBotId] = useState("");
  const [botTickets, setBotTickets] = useState("10");

  const [existingBots, setExistingBots] = useState<FakeBotItem[]>([]);
  const [isLoadingBots, setIsLoadingBots] = useState(false);

  useEffect(() => {
    if (isAddBotsOpen && existingBots.length === 0) {
      setIsLoadingBots(true);
      fetchWithAuth(`${BACKEND_URL}/raffles/admin/bots`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setExistingBots(data);
            if (data.length > 0) setFormBotId(data[0].id);
          }
        })
        .finally(() => setIsLoadingBots(false));
    }
  }, [isAddBotsOpen, existingBots.length]);

  const [formName, setFormName] = useState(raffle.name);
  const [formDesc, setFormDesc] = useState(raffle.description ?? "");
  const [formDrawDate, setFormDrawDate] = useState(toDatetimeLocalValue(raffle.drawDate));
  const [formPrice, setFormPrice] = useState(String(raffle.ticketPrice));
  const [formMaxTickets, setFormMaxTickets] = useState(
    raffle.maxTickets != null ? String(raffle.maxTickets) : "",
  );

  const isFinished = raffle.status === "FINISHED";
  const isCancelled = raffle.status === "CANCELLED";
  const isPending = raffle.status === "PENDING";
  const isActive = raffle.status === "ACTIVE";
  const isPublic = raffle.isPublic !== false;
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

  const handleAddBots = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botTickets || Number(botTickets) <= 0) {
      alert("Por favor ingresa una cantidad válida de chances.");
      return;
    }
    if (botMode === "new" && !formBotName.trim()) {
      alert("El nombre del bot es requerido.");
      return;
    }
    if (botMode === "existing" && !formBotId) {
      alert("Por favor selecciona un bot existente.");
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("mode", botMode);
      formData.append("tickets", String(botTickets));
      if (botMode === "new") {
        if (formBotName) formData.append("name", formBotName);
        if (formBotAvatarFile) {
          formData.append("avatarFile", formBotAvatarFile);
        } else if (formBotAvatar) {
          formData.append("avatar", formBotAvatar);
        }
      } else {
        if (formBotId) formData.append("botId", formBotId);
      }

      const res = await fetchWithAuth(`${BACKEND_URL}/raffles/admin/${raffle.id}/fake-participants`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || t("common.error"));

      setIsAddBotsOpen(false);
      setFormBotName("");
      setFormBotAvatar("");
      setFormBotAvatarFile(null);
      setBotTickets("10");
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
    if (onDeleted) onDeleted();
    else refresh();
  };

  const executeSetVisibility = async (nextIsPublic: boolean) => {
    const res = await fetchWithAuth(`${BACKEND_URL}/raffles/admin/${raffle.id}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: nextIsPublic }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || t("common.error"));
    refresh();
  };

  const handleConfirmAction = async () => {
    if (!pendingAction || isActionLoading) return;

    setIsActionLoading(true);
    try {
      if (pendingAction === "reactivate") await executeReactivate();
      if (pendingAction === "cancel") await executeCancel();
      if (pendingAction === "draw") await executeDraw();
      if (pendingAction === "delete") await executeDelete();
      if (pendingAction === "hide") await executeSetVisibility(false);
      if (pendingAction === "show") await executeSetVisibility(true);
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
            : pendingAction === "hide"
              ? {
                  title: t("admin.raffles.hideFromClient"),
                  message: t("admin.raffles.confirmHideFromClient"),
                  type: "confirm" as const,
                  confirmLabel: t("admin.raffles.hideFromClient"),
                }
              : pendingAction === "show"
                ? {
                    title: t("admin.raffles.showOnClient"),
                    message: t("admin.raffles.confirmShowOnClient"),
                    type: "confirm" as const,
                    confirmLabel: t("admin.raffles.showOnClient"),
                  }
                : null;

  const buttonBase =
    layout === "compact"
      ? "inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-medium transition-colors cursor-pointer"
      : "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors cursor-pointer";

  return (
    <>
      <div
        className={layout === "compact" ? "flex flex-wrap gap-1.5" : "flex flex-wrap items-center gap-2"}
        onClick={(e) => e.stopPropagation()}
      >
        {canEdit && (
          <button
            type="button"
            onClick={openEdit}
            className={`${buttonBase} border border-white/10 bg-[#1c1833] text-white hover:bg-[#252042]`}
          >
            <Pencil className="h-3.5 w-3.5" />
            {t("raffles.editRaffle")}
          </button>
        )}

        {canManage && isPending && (
          <button
            type="button"
            onClick={handleActivate}
            className={`${buttonBase} border border-accent/30 bg-accent/15 text-fuchsia-200 hover:bg-accent/25`}
          >
            {t("raffles.activate")}
          </button>
        )}

        {isCancelled && (
          <button
            type="button"
            onClick={() => setPendingAction("reactivate")}
            className={`${buttonBase} border border-emerald-500/25 bg-emerald-500/12 text-emerald-300 hover:bg-emerald-500/20`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("admin.rafflePurchases.reactivate")}
          </button>
        )}

        {canManage && isActive && (
          <button
            type="button"
            onClick={() => setPendingAction("draw")}
            className={`${buttonBase} border border-emerald-500/30 bg-emerald-600 text-white hover:bg-emerald-500`}
          >
            <Play className="h-3.5 w-3.5" />
            {t("raffles.executeDraw")}
          </button>
        )}

        {canManage && (isActive || isPending) && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsAddBotsOpen(true);
            }}
            className={`${buttonBase} border border-sky-500/25 bg-sky-500/12 text-sky-200 hover:bg-sky-500/20`}
          >
            <Bot className="h-3.5 w-3.5" />
            {t("admin.raffles.bots")}
          </button>
        )}

        {canManage && !isCancelled && (
          <button
            type="button"
            onClick={() => setPendingAction("cancel")}
            className={`${buttonBase} border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("raffles.cancelRaffle")}
          </button>
        )}

        <button
          type="button"
          onClick={() => setPendingAction("delete")}
          className={`${buttonBase} border border-rose-500/25 bg-rose-500/12 text-rose-300 hover:bg-rose-500/20`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t("admin.rafflePurchases.deleteRaffle")}
        </button>

        {isFinished && isPublic && (
          <button
            type="button"
            onClick={() => setPendingAction("hide")}
            className={`${buttonBase} border border-amber-500/25 bg-amber-500/12 text-amber-200 hover:bg-amber-500/20`}
          >
            <EyeOff className="h-3.5 w-3.5" />
            {t("admin.raffles.hideFromClient")}
          </button>
        )}

        {isFinished && !isPublic && (
          <button
            type="button"
            onClick={() => setPendingAction("show")}
            className={`${buttonBase} border border-indigo-500/25 bg-indigo-500/12 text-indigo-200 hover:bg-indigo-500/20`}
          >
            <Eye className="h-3.5 w-3.5" />
            {t("admin.raffles.showOnClient")}
          </button>
        )}
      </div>

      {/* Add Bots Modal */}
      <AdminModal
        open={isAddBotsOpen}
        onClose={() => setIsAddBotsOpen(false)}
        size="sm"
        title={
          <span className="inline-flex items-center gap-2">
            <Bot className="h-4.5 w-4.5 text-sky-400" />
            <span>{t("admin.raffles.addBots")}</span>
          </span>
        }
      >
        <form onSubmit={handleAddBots} className="space-y-4">
          <div className="flex rounded-md border border-white/10 bg-[#0d0a18] p-1">
            <button
              type="button"
              onClick={() => setBotMode("new")}
              className={`flex-1 rounded py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                botMode === "new" ? "bg-accent text-white font-semibold" : "text-[#9e98b6] hover:text-white"
              }`}
            >
              {t("admin.raffles.createNew")}
            </button>
            <button
              type="button"
              onClick={() => setBotMode("existing")}
              className={`flex-1 rounded py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                botMode === "existing" ? "bg-accent text-white font-semibold" : "text-[#9e98b6] hover:text-white"
              }`}
            >
              {t("admin.raffles.existing")}
            </button>
          </div>

          {botMode === "new" ? (
            <>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#b8b2cd]">
                  {t("admin.raffles.userName")}
                </label>
                <input
                  type="text"
                  value={formBotName}
                  onChange={(e) => setFormBotName(e.target.value)}
                  placeholder="Ej. SniperGod"
                  required
                  className="h-9 w-full rounded-md border border-white/10 bg-[#0d0a18] px-3 text-sm text-white outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#b8b2cd]">
                  {t("admin.raffles.userAvatarOptional")}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setFormBotAvatarFile(file);
                      setFormBotAvatar(URL.createObjectURL(file));
                    }
                  }}
                  className="w-full rounded-md border border-white/10 bg-[#0d0a18] px-3 py-2 text-xs text-white file:mr-3 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#9e98b6]">{t("admin.raffles.orUseUrl")}</span>
                  <input
                    type="url"
                    value={formBotAvatarFile ? "" : formBotAvatar}
                    onChange={(e) => {
                      setFormBotAvatar(e.target.value);
                      setFormBotAvatarFile(null);
                    }}
                    placeholder="https://..."
                    className="h-9 flex-1 rounded-md border border-white/10 bg-[#0d0a18] px-3 text-xs text-white outline-none focus:border-accent"
                  />
                </div>
                {formBotAvatar && (
                  <div className="flex items-center gap-3 rounded-md border border-white/10 bg-[#1a1630] p-2">
                    <img src={formBotAvatar} alt="Preview" className="h-8 w-8 rounded object-cover bg-black" />
                    <span className="text-xs text-[#9e98b6]">{t("admin.raffles.preview")}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#b8b2cd]">
                {t("admin.raffles.selectBot")}
              </label>
              {isLoadingBots ? (
                <div className="flex items-center gap-2 p-2 text-xs text-[#9e98b6]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("admin.raffles.loadingBots")}
                </div>
              ) : existingBots.length === 0 ? (
                <div className="rounded-md border border-white/10 bg-[#0d0a18] p-3 text-xs text-[#9e98b6]">
                  {t("admin.raffles.noBotsCreated")}
                </div>
              ) : (
                <select
                  value={formBotId}
                  onChange={(e) => setFormBotId(e.target.value)}
                  required
                  className="h-9 w-full rounded-md border border-white/10 bg-[#0d0a18] px-3 text-xs text-white outline-none focus:border-accent cursor-pointer"
                >
                  {existingBots.map((bot) => (
                    <option key={bot.id} value={bot.id}>
                      {bot.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="space-y-1.5 border-t border-white/[0.06] pt-3">
            <label className="block text-xs font-medium text-[#b8b2cd]">
              {t("admin.raffles.chancesToBuy")}
            </label>
            <input
              type="number"
              min="1"
              value={botTickets}
              onChange={(e) => setBotTickets(e.target.value)}
              required
              className="h-9 w-full rounded-md border border-white/10 bg-[#0d0a18] px-3 text-sm text-white outline-none focus:border-accent"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-white/[0.06] pt-4">
            <AdminButton
              type="button"
              variant="secondary"
              disabled={isSaving}
              onClick={() => setIsAddBotsOpen(false)}
            >
              {t("common.cancel")}
            </AdminButton>
            <AdminButton type="submit" variant="primary" loading={isSaving} disabled={isSaving}>
              {t("admin.raffles.add")}
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* Edit Raffle Modal */}
      <AdminModal
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        size="md"
        title={t("raffles.editRaffle")}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#b8b2cd]">
              {t("raffles.name")}
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              className="h-9 w-full rounded-md border border-white/10 bg-[#0d0a18] px-3 text-sm text-white outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#b8b2cd]">
              {t("raffles.desc")}
            </label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="h-20 w-full resize-none rounded-md border border-white/10 bg-[#0d0a18] p-3 text-sm text-white outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#b8b2cd]">
                {t("raffles.adminDrawDate")}
              </label>
              <input
                type="datetime-local"
                value={formDrawDate}
                onChange={(e) => setFormDrawDate(e.target.value)}
                required
                disabled={hasSoldChances}
                className="h-9 w-full rounded-md border border-white/10 bg-[#0d0a18] px-3 text-xs text-white outline-none focus:border-accent disabled:opacity-50 [color-scheme:dark]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#b8b2cd]">
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
                className="h-9 w-full rounded-md border border-white/10 bg-[#0d0a18] px-3 text-sm text-white outline-none focus:border-accent disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#b8b2cd]">
              {t("raffles.maxTicketsLabel")}
            </label>
            <input
              type="number"
              min="1"
              value={formMaxTickets}
              onChange={(e) => setFormMaxTickets(e.target.value)}
              disabled={hasSoldChances}
              placeholder={t("raffles.maxTicketsLabel")}
              className="h-9 w-full rounded-md border border-white/10 bg-[#0d0a18] px-3 text-sm text-white outline-none focus:border-accent disabled:opacity-50"
            />
          </div>

          {hasSoldChances && (
            <p className="text-xs font-medium text-amber-300">
              {t("admin.rafflePurchases.editRestrictedHint")}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-white/[0.06] pt-4">
            <AdminButton type="button" variant="secondary" onClick={() => setIsEditOpen(false)}>
              {t("common.cancel")}
            </AdminButton>
            <AdminButton type="submit" variant="primary" loading={isSaving} disabled={isSaving}>
              {t("raffles.save")}
            </AdminButton>
          </div>
        </form>
      </AdminModal>

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
