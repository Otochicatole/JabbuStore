"use client";

import { useState, useEffect } from "react";
import { Loader2, Eye, EyeOff, Pencil, Play, RotateCcw, Trash2, X, Bot } from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { AlertConfirmModal } from "@/shared/components/AlertConfirmModal";

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
  
  const [existingBots, setExistingBots] = useState<any[]>([]);
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
  }, [isAddBotsOpen]);

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
    if (onDeleted) {
      onDeleted();
    } else {
      refresh();
    }
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

        <button
          type="button"
          onClick={() => setPendingAction("delete")}
          className={`${buttonBase} bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-500/20`}
        >
          <Trash2 className={layout === "compact" ? "h-3 w-3" : "h-3.5 w-3.5"} />
          {t("admin.rafflePurchases.deleteRaffle")}
        </button>

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

        {canManage && (isActive || isPending) && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsAddBotsOpen(true);
            }}
            className={`${buttonBase} bg-blue-500/10 hover:bg-blue-500/20 text-blue-400`}
          >
            <Bot className={layout === "compact" ? "h-3 w-3" : "h-3.5 w-3.5"} />
            Bots
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

        {isFinished && isPublic && (
          <button
            type="button"
            onClick={() => setPendingAction("hide")}
            className={`${buttonBase} bg-amber-500/10 hover:bg-amber-500/20 text-amber-400`}
          >
            <EyeOff className={layout === "compact" ? "h-3 w-3" : "h-3.5 w-3.5"} />
            {t("admin.raffles.hideFromClient")}
          </button>
        )}

        {isFinished && !isPublic && (
          <button
            type="button"
            onClick={() => setPendingAction("show")}
            className={`${buttonBase} bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400`}
          >
            <Eye className={layout === "compact" ? "h-3 w-3" : "h-3.5 w-3.5"} />
            {t("admin.raffles.showOnClient")}
          </button>
        )}
      </div>

      {isAddBotsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleAddBots}
            className="w-full max-w-sm bg-[#0f0d1e] border border-white/5 rounded-[3px] p-6 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsAddBotsOpen(false)}
              className="absolute top-5 right-5 text-white/50 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-black uppercase tracking-tight text-white mb-6 flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-400" />
              Agregar Bots
            </h2>

            <div className="flex bg-[#141221] p-1 rounded-[3px] border border-white/5 mb-6">
              <button
                type="button"
                onClick={() => setBotMode("new")}
                className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-2 rounded-[2px] transition-colors cursor-pointer ${
                  botMode === "new" ? "bg-accent text-white" : "text-[#84849b] hover:text-white"
                }`}
              >
                Crear Nuevo
              </button>
              <button
                type="button"
                onClick={() => setBotMode("existing")}
                className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-2 rounded-[2px] transition-colors cursor-pointer ${
                  botMode === "existing" ? "bg-accent text-white" : "text-[#84849b] hover:text-white"
                }`}
              >
                Existente
              </button>
            </div>

            <div className="space-y-4">
              {botMode === "new" ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-[#84849b] tracking-wider">
                      Nombre del Usuario
                    </label>
                    <input
                      type="text"
                      value={formBotName}
                      onChange={(e) => setFormBotName(e.target.value)}
                      placeholder="Ej. SniperGod"
                      required
                      className="w-full bg-[#141221] border border-white/5 rounded-[3px] px-4 py-3 text-xs text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-[#84849b] tracking-wider">
                      Avatar del Usuario (Opcional)
                    </label>
                    <div className="flex flex-col gap-2">
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
                        className="w-full bg-[#141221] border border-white/5 rounded-[3px] px-4 py-2 text-xs text-white focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-[3px] file:border-0 file:text-xs file:font-black file:uppercase file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all cursor-pointer"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#84849b] uppercase font-bold">O usa una URL:</span>
                        <input
                          type="url"
                          value={formBotAvatarFile ? "" : formBotAvatar}
                          onChange={(e) => {
                            setFormBotAvatar(e.target.value);
                            setFormBotAvatarFile(null);
                          }}
                          placeholder="https://..."
                          className="flex-1 bg-[#141221] border border-white/5 rounded-[3px] px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>
                    {formBotAvatar && (
                      <div className="mt-2 flex items-center gap-3 bg-white/5 p-2 rounded-[3px] border border-white/5">
                        <img src={formBotAvatar} alt="Preview" className="w-8 h-8 rounded-md object-cover bg-black" />
                        <span className="text-xs text-[#84849b]">Vista previa</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[#84849b] tracking-wider">
                    Seleccionar Bot
                  </label>
                  {isLoadingBots ? (
                    <div className="flex items-center gap-2 text-xs text-[#84849b] p-3">
                      <Loader2 className="w-3 h-3 animate-spin" /> Cargando bots...
                    </div>
                  ) : existingBots.length === 0 ? (
                    <div className="text-xs text-[#84849b] p-3 border border-white/5 rounded-[3px] bg-[#141221]">
                      No hay bots creados aún. Crea uno nuevo primero.
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={formBotId}
                        onChange={(e) => setFormBotId(e.target.value)}
                        required
                        className="w-full bg-[#141221] border border-white/5 rounded-[3px] px-4 py-3 text-xs text-white focus:outline-none focus:border-accent appearance-none cursor-pointer"
                      >
                        {existingBots.map((bot) => (
                          <option key={bot.id} value={bot.id}>
                            {bot.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <div className="w-2 h-2 border-b border-r border-[#84849b] transform rotate-45 mb-1" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="text-[10px] font-bold uppercase text-[#84849b] tracking-wider">
                  Chances a Comprar
                </label>
                <input
                  type="number"
                  min="1"
                  value={botTickets}
                  onChange={(e) => setBotTickets(e.target.value)}
                  required
                  className="w-full bg-[#141221] border border-white/5 rounded-[3px] px-4 py-3 text-xs text-white focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddBotsOpen(false)}
                className="px-4 py-2 text-xs font-bold uppercase text-white/70 hover:text-white transition-colors cursor-pointer"
                disabled={isSaving}
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-[3px] text-xs font-black uppercase tracking-wider text-white transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                Agregar
              </button>
            </div>
          </form>
        </div>
      )}

      {isEditOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
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
