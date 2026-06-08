"use client";

import React, { useState } from "react";
import {
  Plus,
  Loader2,
  ExternalLink,
  Trash2,
  PowerOff,
  Power,
  Edit3,
  X,
  Check,
  Bot as BotIcon,
  Activity,
  Shield,
  AlertTriangle,
  Cpu,
} from "lucide-react";
import { BACKEND_URL } from "@/shared/lib/api";
import { useAdminBots, Bot } from "./useAdminBots";

interface BotModalProps {
  bot?: Bot | null;
  onClose: () => void;
  onSaved: () => void;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  active: {
    label: "Activo",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  inactive: {
    label: "Inactivo",
    color: "text-slate-400",
    bg: "bg-slate-500/10 border-slate-500/20",
    dot: "bg-slate-500",
  },
  maintenance: {
    label: "Mantenimiento",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    dot: "bg-yellow-500",
  },
  full: {
    label: "Lleno",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
    dot: "bg-orange-500",
  },
  error: {
    label: "Error",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    dot: "bg-red-500",
  },
};

function BotModal({ bot, onClose, onSaved }: BotModalProps) {
  const [name, setName] = useState(bot ? bot.name : "");
  const [steamId, setSteamId] = useState(bot ? bot.steamId : "");
  const [tradeUrl, setTradeUrl] = useState(bot ? bot.tradeUrl || "" : "");
  const [maxItems, setMaxItems] = useState(bot ? bot.maxItems : 1000);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = bot
        ? `${BACKEND_URL}/admin/marketplace/bots/${bot.id}`
        : `${BACKEND_URL}/admin/marketplace/bots`;
      const method = bot ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          steamId,
          tradeUrl: tradeUrl || null,
          maxItems,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Error al guardar el bot");
      }

      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md bg-[#0f0d1e] border border-white/10 rounded-[3px] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-black uppercase tracking-wider">
            {bot ? "Editar Bot" : "Agregar Nuevo Bot"}
          </h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b] block mb-1.5">
              Nombre del Bot *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="JabbuBot #1"
              className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/8 rounded-[3px] text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b] block mb-1.5">
              SteamID64 *
            </label>
            <input
              type="text"
              required
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              placeholder="76561199649767651"
              disabled={!!bot}
              className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/8 rounded-[3px] text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
            />
            {bot && (
              <p className="text-[10px] text-[#84849b] mt-1">
                El SteamID no se puede modificar.
              </p>
            )}
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b] block mb-1.5">
              URL de Intercambio (Trade URL)
            </label>
            <input
              type="url"
              value={tradeUrl}
              onChange={(e) => setTradeUrl(e.target.value)}
              placeholder="https://steamcommunity.com/tradeoffer/new/..."
              className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/8 rounded-[3px] text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b] block mb-1.5">
              Capacidad Máxima de Items
            </label>
            <input
              type="number"
              min={1}
              max={10000}
              value={maxItems}
              onChange={(e) => setMaxItems(parseInt(e.target.value) || 1000)}
              className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/8 rounded-[3px] text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-[3px]">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[3px] text-sm font-bold text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 bg-accent hover:bg-accent/90 rounded-[3px] text-sm font-black text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {saving ? "Guardando..." : bot ? "Actualizar" : "Crear Bot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  bot: Bot;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function DeleteConfirmModal({
  bot,
  onClose,
  onConfirm,
  loading,
}: DeleteConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md bg-[#0f0d1e] border border-white/10 rounded-[3px] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4 text-red-400">
          <AlertTriangle className="w-6 h-6" />
          <h2 className="text-base font-black uppercase tracking-wider">
            ¿Eliminar Bot?
          </h2>
        </div>

        <p className="text-sm text-[#84849b] mb-6">
          ¿Estás seguro de que deseas eliminar permanentemente el bot{" "}
          <span className="text-white font-bold">{bot.name}</span>? Esta acción
          no se puede deshacer.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[3px] text-sm font-bold text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-11 bg-red-500 hover:bg-red-600 rounded-[3px] text-sm font-black text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminBotsPanel() {
  const {
    bots,
    loading,
    error,
    showModal,
    editingBot,
    botToDelete,
    setBotToDelete,
    actionLoading,
    fetchBots,
    handleToggle,
    handleDelete,
    openCreate,
    openEdit,
    closeModal,
    onSaved,
    activeBots,
  } = useAdminBots();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-wider text-white">
            Gestión de Bots de Steam
          </h2>
          <p className="text-xs text-[#84849b] mt-0.5">
            Administra las cuentas de bot que procesan los trades del
            marketplace.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 rounded-[3px] text-xs font-black uppercase tracking-wider text-white transition-colors shadow-[0_0_20px_rgba(217,70,239,0.2)] w-full sm:w-auto cursor-pointer min-h-[38px]"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Nuevo Bot</span>
        </button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#110f1e]/40 border border-white/5 rounded-[3px] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-[3px] bg-accent/10 flex items-center justify-center">
            <BotIcon className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-[#84849b] tracking-wider">
              Total Bots
            </p>
            <p className="text-xl font-black">{bots.length}</p>
          </div>
        </div>
        <div className="bg-[#110f1e]/40 border border-white/5 rounded-[3px] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-[3px] bg-emerald-500/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-[#84849b] tracking-wider">
              Activos
            </p>
            <p className="text-xl font-black text-emerald-400">{activeBots}</p>
          </div>
        </div>
      </div>

      {/* Bot Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertTriangle className="w-10 h-10 text-red-500/80" />
          <p className="text-sm font-black text-white">Error al cargar bots</p>
          <p className="text-xs text-[#84849b]">{error}</p>
          <button
            onClick={fetchBots}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-[3px] text-xs font-bold uppercase tracking-wider transition-colors mt-1"
          >
            Reintentar
          </button>
        </div>
      ) : bots.length === 0 ? (
        <div className="bg-[#110f1e]/20 border border-white/5 rounded-[3px] p-12 text-center">
          <BotIcon className="w-12 h-12 text-[#84849b] mx-auto mb-3" />
          <h3 className="text-sm font-black uppercase tracking-wider mb-1">
            No hay bots registrados
          </h3>
          <p className="text-xs text-[#84849b] max-w-sm mx-auto leading-relaxed mb-6">
            Agrega tu primera cuenta de bot de Steam para empezar a depositar y
            procesar inventario en la tienda.
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent/90 rounded-[3px] text-xs font-black uppercase tracking-wider text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Registrar Primer Bot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map((b) => {
            const status = statusConfig[b.status] || statusConfig.inactive;
            const pct = b.maxItems > 0 ? (b.currentItems / b.maxItems) * 100 : 0;
            const pctColor =
              pct > 90
                ? "bg-red-500"
                : pct > 75
                  ? "bg-orange-400"
                  : "bg-accent";

            return (
              <div
                key={b.id}
                className="bg-[#110f1e]/30 border border-white/5 rounded-[3px] p-5 space-y-5 relative overflow-hidden group"
              >
                {/* Status Indicator Bar */}
                <div
                  className={`absolute top-0 left-0 w-full h-[2px] ${status.dot}`}
                />

                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-[3px] bg-white/[0.02] border border-white/8 flex items-center justify-center shrink-0">
                      <Cpu className="w-4 h-4 text-white/50 group-hover:text-accent transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-sm text-white truncate max-w-[150px]">
                        {b.name}
                      </h3>
                      <p className="text-[9px] text-[#84849b] font-mono mt-0.5 uppercase tracking-wider">
                        Steam Bot Account
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-[3px] text-[8px] font-black uppercase tracking-wider border flex items-center gap-1 shrink-0 ${status.bg} ${status.color}`}
                  >
                    <span className={`w-1 h-1 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>

                {/* Properties */}
                <div className="space-y-2.5 pt-1.5 border-t border-white/[0.03]">
                  <div>
                    <span className="text-[8px] font-black uppercase text-[#84849b] tracking-wider block">
                      SteamID64 del Bot
                    </span>
                    <span className="text-[10px] font-mono text-white/70 block mt-0.5">
                      {b.steamId}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[8px] font-black uppercase text-[#84849b] tracking-wider mb-1">
                      <span>Capacidad de Almacenamiento</span>
                      <span className="text-white/80">
                        {b.currentItems} / {b.maxItems} items ({pct.toFixed(0)}
                        %)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${pctColor}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.03] gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(b)}
                      className="p-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-[3px] text-white/60 hover:text-white transition-all cursor-pointer"
                      title="Editar Configuración"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setBotToDelete(b)}
                      className="p-2 bg-white/[0.02] hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 rounded-[3px] text-white/40 hover:text-red-400 transition-all cursor-pointer"
                      title="Eliminar Bot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {b.tradeUrl && (
                      <a
                        href={b.tradeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-[3px] text-[#84849b] hover:text-white transition-all cursor-pointer"
                        title="Ver Enlace de Oferta de Intercambio"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggle(b)}
                    disabled={actionLoading === b.id}
                    className={`flex items-center gap-1.5 px-3 py-2 text-[9px] font-black uppercase tracking-wider rounded-[3px] transition-all cursor-pointer select-none border disabled:opacity-45 ${
                      b.isActive
                        ? "bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400"
                        : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {actionLoading === b.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : b.isActive ? (
                      <PowerOff className="w-3 h-3" />
                    ) : (
                      <Power className="w-3 h-3" />
                    )}
                    {b.isActive ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Forms and Deletions Modal Popups */}
      {showModal && (
        <BotModal
          bot={editingBot}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}

      {botToDelete && (
        <DeleteConfirmModal
          bot={botToDelete}
          onClose={() => setBotToDelete(null)}
          onConfirm={() => handleDelete(botToDelete)}
          loading={actionLoading === botToDelete.id}
        />
      )}
    </div>
  );
}
export default AdminBotsPanel;
