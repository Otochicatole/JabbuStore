"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Loader2, ExternalLink, Trash2, PowerOff, Power,
  Edit3, X, Check, Bot as BotIcon, Cpu, Activity, Shield, AlertTriangle
} from "lucide-react";
import { BACKEND_URL } from "@/shared/lib/api";

interface Bot {
  id: string;
  name: string;
  steamId: string;
  tradeUrl: string | null;
  status: "active" | "inactive" | "maintenance" | "full" | "error";
  maxItems: number;
  currentItems: number;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
}

interface BotModalProps {
  bot?: Bot | null;
  onClose: () => void;
  onSaved: () => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active:      { label: "Activo",        color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-500" },
  inactive:    { label: "Inactivo",      color: "text-slate-400",   bg: "bg-slate-500/10 border-slate-500/20",   dot: "bg-slate-500" },
  maintenance: { label: "Mantenimiento", color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/20", dot: "bg-yellow-500" },
  full:        { label: "Lleno",         color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/20", dot: "bg-orange-500" },
  error:       { label: "Error",         color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",       dot: "bg-red-500" },
};

function BotModal({ bot, onClose, onSaved }: BotModalProps) {
  const [name, setName] = useState(bot?.name ?? "");
  const [steamId, setSteamId] = useState(bot?.steamId ?? "");
  const [tradeUrl, setTradeUrl] = useState(bot?.tradeUrl ?? "");
  const [maxItems, setMaxItems] = useState(bot?.maxItems ?? 1000);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = bot
        ? `${BACKEND_URL}/api/admin/marketplace/bots/${bot.id}`
        : `${BACKEND_URL}/api/admin/marketplace/bots`;
      const method = bot ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, steamId, tradeUrl: tradeUrl || null, maxItems }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar el bot");
      }
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md bg-[#0f0d1e] border border-white/10 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-black uppercase tracking-wider">
            {bot ? "Editar Bot" : "Agregar Nuevo Bot"}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
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
              className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors"
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
              className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
            />
            {bot && <p className="text-[10px] text-[#84849b] mt-1">El SteamID no se puede modificar.</p>}
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
              className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors"
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
              className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 bg-accent hover:bg-accent/90 rounded-xl text-sm font-black text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? "Guardando..." : bot ? "Actualizar" : "Crear Bot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminBotsPanel() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBot, setEditingBot] = useState<Bot | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/marketplace/bots`, {
        credentials: "include",
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      });
      if (!res.ok) throw new Error("Error al cargar los bots");
      const data = await res.json();
      setBots(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  const handleToggle = async (bot: Bot) => {
    setActionLoading(bot.id);
    try {
      const action = bot.isActive ? "deactivate" : "activate";
      const res = await fetch(`${BACKEND_URL}/api/admin/marketplace/bots/${bot.id}/${action}`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al cambiar estado del bot");
      fetchBots();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (bot: Bot) => {
    if (!confirm(`¿Eliminar permanentemente el bot "${bot.name}"? Esta acción no se puede deshacer.`)) return;
    setActionLoading(bot.id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/marketplace/bots/${bot.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al eliminar el bot");
      fetchBots();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openCreate = () => { setEditingBot(null); setShowModal(true); };
  const openEdit = (bot: Bot) => { setEditingBot(bot); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingBot(null); };
  const onSaved = () => { closeModal(); fetchBots(); };

  const totalItems = bots.reduce((sum, b) => sum + b.currentItems, 0);
  const activeBots = bots.filter((b) => b.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black uppercase tracking-wider">Gestión de Bots de Steam</h2>
          <p className="text-xs text-[#84849b] mt-0.5">
            Administra las cuentas de bot que procesan los trades del marketplace.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-colors shadow-[0_0_20px_rgba(217,70,239,0.2)]"
        >
          <Plus className="w-4 h-4" />
          Nuevo Bot
        </button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#110f1e]/40 border border-white/5 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
            <BotIcon className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-[#84849b] tracking-wider">Total Bots</p>
            <p className="text-xl font-black">{bots.length}</p>
          </div>
        </div>
        <div className="bg-[#110f1e]/40 border border-white/5 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-[#84849b] tracking-wider">Activos</p>
            <p className="text-xl font-black text-emerald-400">{activeBots}</p>
          </div>
        </div>
        <div className="bg-[#110f1e]/40 border border-white/5 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-[#84849b] tracking-wider">Items Totales</p>
            <p className="text-xl font-black text-blue-400">{totalItems.toLocaleString()}</p>
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
          <button onClick={fetchBots} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors mt-1">
            Reintentar
          </button>
        </div>
      ) : bots.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center bg-[#110f1e]/20 border border-white/5 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/8 flex items-center justify-center">
            <BotIcon className="w-8 h-8 text-white/20" />
          </div>
          <div>
            <p className="text-sm font-black text-white uppercase tracking-wider">Sin bots registrados</p>
            <p className="text-xs text-[#84849b] mt-1">Agrega el primer bot de Steam para comenzar.</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent/90 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-colors">
            <Plus className="w-3.5 h-3.5" /> Agregar primer bot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {bots.map((bot) => {
            const statusCfg = statusConfig[bot.status] || statusConfig.inactive;
            const capacity = bot.maxItems > 0 ? (bot.currentItems / bot.maxItems) * 100 : 0;
            const isActioning = actionLoading === bot.id;

            return (
              <div
                key={bot.id}
                className={`relative bg-[#110f1e]/40 border rounded-2xl p-5 transition-all ${
                  bot.isActive ? "border-white/8 hover:border-white/15" : "border-white/4 opacity-60"
                }`}
              >
                {/* Active indicator glow */}
                {bot.isActive && bot.status === "active" && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-2xl rounded-full pointer-events-none" />
                )}

                <div className="relative">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border ${statusCfg.bg}`}>
                        <BotIcon className={`w-5 h-5 ${statusCfg.color}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white">{bot.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${bot.isActive && bot.status === 'active' ? 'animate-pulse' : ''}`} />
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`https://steamcommunity.com/profiles/${bot.steamId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/8 text-[#84849b] hover:text-white transition-colors"
                        title="Ver perfil de Steam"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => openEdit(bot)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/8 text-[#84849b] hover:text-blue-400 transition-colors"
                        title="Editar bot"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggle(bot)}
                        disabled={isActioning}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors disabled:opacity-40 ${
                          bot.isActive
                            ? "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20 text-orange-400"
                            : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400"
                        }`}
                        title={bot.isActive ? "Desactivar bot" : "Activar bot"}
                      >
                        {isActioning ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : bot.isActive ? (
                          <PowerOff className="w-3.5 h-3.5" />
                        ) : (
                          <Power className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(bot)}
                        disabled={isActioning}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-colors disabled:opacity-40"
                        title="Eliminar bot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Steam ID */}
                  <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-white/[0.02] border border-white/5">
                    <Shield className="w-3 h-3 text-[#84849b]" />
                    <span className="text-[10px] font-mono text-[#84849b]">SteamID64:</span>
                    <span className="text-[10px] font-mono text-white/80 flex-1">{bot.steamId}</span>
                  </div>

                  {/* Capacity bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-[#84849b] tracking-wider">Capacidad</span>
                      <span className="text-[10px] font-mono text-white">
                        {bot.currentItems.toLocaleString()} / {bot.maxItems.toLocaleString()} items
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          capacity > 90 ? "bg-red-500" : capacity > 70 ? "bg-orange-400" : "bg-accent"
                        }`}
                        style={{ width: `${Math.min(100, capacity)}%` }}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[9px] text-[#84849b] font-mono">
                        {capacity.toFixed(1)}% usado
                      </span>
                      {bot.lastSyncAt && (
                        <span className="text-[9px] text-[#84849b] font-mono">
                          Sync: {new Date(bot.lastSyncAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Trade URL */}
                  {bot.tradeUrl && (
                    <a
                      href={bot.tradeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 mt-3 text-[10px] text-accent hover:text-accent/80 transition-colors font-mono truncate"
                    >
                      <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                      {bot.tradeUrl.slice(0, 60)}...
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <BotModal bot={editingBot} onClose={closeModal} onSaved={onSaved} />
      )}
    </div>
  );
}
