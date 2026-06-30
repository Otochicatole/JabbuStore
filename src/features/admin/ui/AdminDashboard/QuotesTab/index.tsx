"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Calendar,
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Trash2,
  DollarSign,
  ArrowRight,
  User as UserIcon,
  Send,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { AlertConfirmModal } from "@/shared/components/AlertConfirmModal";

interface QuoteItem {
  id: string;
  assetId: string;
  name: string;
  price: number | null;
  iconUrl: string | null;
  rarity: string | null;
  exterior: string | null;
  float: number | null;
  pattern: number | null;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  steamId: string | null;
  avatar: string | null;
}

interface Quote {
  id: string;
  status: "PENDING" | "QUOTED" | "ACCEPTED" | "CANCELLED";
  items: QuoteItem[];
  user: User;
  createdAt: string;
  updatedAt: string;
}

export function QuotesTab() {
  const { t } = useI18n();
  const router = useRouter();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({});
  
  // Form pricing states: quoteId -> { assetId: price }
  const [pricesInput, setPricesInput] = useState<Record<string, Record<string, string>>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error" | "confirm";
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: () => {},
  });

  const showAlert = (title: string, message: string, type: "info" | "success" | "warning" | "error" = "info") => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
    });
  };

  const showConfirm = (title: string, message: string, onYes: () => void) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: "confirm",
      onConfirm: () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        onYes();
      },
      onCancel: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
    });
  };

  const fetchQuotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/quotes/admin/all`, {
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      });

      if (res.status === 401 || res.status === 403) {
        router.push("/admin/login");
        return;
      }

      if (!res.ok) {
        throw new Error("Error al obtener la lista de cotizaciones.");
      }

      const data = await res.json();
      setQuotes(data);

      // Initialize pricing inputs with existing prices if any
      const initialInputs: Record<string, Record<string, string>> = {};
      data.forEach((q: Quote) => {
        initialInputs[q.id] = {};
        q.items.forEach((item) => {
          initialInputs[q.id][item.assetId] = item.price !== null ? item.price.toString() : "";
        });
      });
      setPricesInput(initialInputs);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedQuotes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePriceChange = (quoteId: string, assetId: string, val: string) => {
    setPricesInput((prev) => ({
      ...prev,
      [quoteId]: {
        ...prev[quoteId],
        [assetId]: val,
      },
    }));
  };

  const handleSubmitQuote = async (quoteId: string, e: React.FormEvent) => {
    e.preventDefault();
    const inputs = pricesInput[quoteId];
    
    // Validate that all items have a valid price
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote) return;

    const prices: { assetId: string; price: number }[] = [];
    for (const item of quote.items) {
      const val = inputs[item.assetId];
      const parsed = parseFloat(val);
      if (isNaN(parsed) || parsed < 0) {
        showAlert("Precio Inválido", `Por favor, ingresa un precio válido para el ítem: ${item.name}`, "warning");
        return;
      }
      prices.push({ assetId: item.assetId, price: parsed });
    }

    setSubmittingId(quoteId);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/quotes/admin/${quoteId}/quote`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prices }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Error al enviar la cotización.");
      }

      const updated = await res.json();
      setQuotes((prev) => prev.map((q) => (q.id === quoteId ? updated : q)));
      showAlert("Cotización Enviada", "¡Cotización enviada exitosamente al usuario!", "success");
      
      // Close card details
      setExpandedQuotes((prev) => ({ ...prev, [quoteId]: false }));
    } catch (err: any) {
      showAlert("Error", err.message || "Error al enviar la cotización.", "error");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleCancelQuote = async (quoteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm(
      "Rechazar Cotización",
      "¿Estás seguro de que deseas rechazar/cancelar esta cotización desde administración?",
      async () => {
        setCancellingId(quoteId);
        try {
          const res = await fetchWithAuth(`${BACKEND_URL}/quotes/admin/${quoteId}/cancel`, {
            method: "POST",
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data?.error || "Error al cancelar la cotización.");
          }

          const updated = await res.json();
          setQuotes((prev) => prev.map((q) => (q.id === quoteId ? { ...q, status: updated.status } : q)));
          showAlert("Cotización Cancelada", "La solicitud de cotización ha sido rechazada/cancelada correctamente.", "success");
          
          // Close details
          setExpandedQuotes((prev) => ({ ...prev, [quoteId]: false }));
        } catch (err: any) {
          showAlert("Error", err.message || "Error al cancelar la cotización.", "error");
        } finally {
          setCancellingId(null);
        }
      }
    );
  };

  const getStatusBadgeConfig = (status: Quote["status"]) => {
    switch (status) {
      case "PENDING":
        return {
          label: "Pendiente",
          color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          icon: Clock,
        };
      case "QUOTED":
        return {
          label: "Cotizado",
          color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
          icon: DollarSign,
        };
      case "ACCEPTED":
        return {
          label: "Aceptado / Comprado",
          color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          icon: CheckCircle,
        };
      case "CANCELLED":
        return {
          label: "Cancelado",
          color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          icon: XCircle,
        };
    }
  };

  // Filter logic
  const filteredQuotes = quotes.filter((q) => {
    // Search user name, email, steamId or quote id
    const matchSearch =
      q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.user.name && q.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.user.email && q.user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.user.steamId && q.user.steamId.includes(searchTerm));

    const matchStatus = statusFilter === "all" || q.status === statusFilter;

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 text-white font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            Cotizaciones Manuales
          </h2>
          <p className="text-xs text-[#84849b] mt-1 font-bold">
            Ingresa y envía cotizaciones manuales para solicitudes de venta de usuarios.
          </p>
        </div>

        <button
          onClick={fetchQuotes}
          disabled={loading}
          className="flex items-center justify-center gap-2 h-10 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[3px] text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-accent" : ""}`} />
          Refrescar Lista
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-500/5 border border-rose-500/15 text-rose-400 text-xs font-bold">
          {error}
        </div>
      )}

      {/* Filters bar */}
      <div className="bg-[#110f1e]/80 border border-white/5 p-4 rounded-[3px] flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Buscar por usuario o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-white/5 border border-white/5 rounded-[3px] text-xs text-white placeholder-white/30 focus:border-accent/40 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-white/30 shrink-0" />
          <div className="flex bg-white/5 border border-white/5 p-1 rounded-[3px] w-full sm:w-auto justify-between">
            {["all", "PENDING", "QUOTED", "ACCEPTED", "CANCELLED"].map((st) => {
              const label =
                st === "all"
                  ? "Todas"
                  : st === "PENDING"
                    ? "Pendientes"
                    : st === "QUOTED"
                      ? "Cotizadas"
                      : st === "ACCEPTED"
                        ? "Aceptadas"
                        : "Canceladas";
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[3px] transition-all cursor-pointer ${
                    statusFilter === st
                      ? "bg-accent text-white shadow-[0_0_15px_rgba(217,70,239,0.35)]"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading && quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#110f1e]/20 border border-white/5 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-accent mb-2" />
          <span className="text-xs text-[#84849b] font-black uppercase tracking-wider font-mono">
            Cargando cotizaciones del servidor...
          </span>
        </div>
      ) : filteredQuotes.length === 0 ? (
        <div className="p-8 text-center bg-[#110f1e]/20 border border-white/5 rounded-lg">
          <p className="text-xs text-[#84849b] font-black uppercase tracking-wider">
            No se encontraron cotizaciones coincidentes
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuotes.map((quote) => {
            const isExpanded = !!expandedQuotes[quote.id];
            const badge = getStatusBadgeConfig(quote.status);
            const StatusIcon = badge.icon;
            
            const totalQuoted = quote.items.reduce((sum, item) => sum + (item.price ?? 0), 0);

            return (
              <div
                key={quote.id}
                className="bg-[#110f1e]/40 border border-white/5 rounded-[3px] hover:border-white/10 transition-colors backdrop-blur-sm relative overflow-hidden"
              >
                <div
                  className={`absolute top-0 bottom-0 left-0 w-1 ${
                    quote.status === "PENDING"
                      ? "bg-amber-500"
                      : quote.status === "QUOTED"
                        ? "bg-indigo-500"
                        : quote.status === "ACCEPTED"
                          ? "bg-emerald-500"
                          : "bg-rose-500"
                  }`}
                />

                <div
                  onClick={() => toggleExpand(quote.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    {/* User profile avatar or generic */}
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/5 shrink-0 border border-white/10 flex items-center justify-center">
                      {quote.user.avatar ? (
                        <Image src={quote.user.avatar} alt="Avatar" fill className="object-cover" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-white/40" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-white/90">
                          Cotización ID: <span className="text-accent">{quote.id.slice(0, 8)}</span>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-[3px] text-[8.5px] font-black tracking-widest uppercase border ${badge.color} flex items-center gap-1`}
                        >
                          <StatusIcon className="w-2.5 h-2.5 shrink-0" />
                          {badge.label}
                        </span>
                      </div>

                      <p className="text-[10px] text-[#84849b] mt-1 font-bold">
                        Usuario: <span className="text-white">{quote.user.name || "Steam User"}</span>
                        {" · "}
                        {quote.user.email || "Sin email"}
                        {" · "}
                        {quote.items.length} ítem{quote.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto border-t border-white/5 sm:border-t-0 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[8px] text-[#84849b] font-mono block uppercase tracking-widest">
                        Total Solicitado/Cotizado
                      </span>
                      <span className="text-sm font-black text-white">
                        {quote.status === "PENDING" && quote.items.every(i => i.price === null)
                          ? "Pendiente"
                          : `$${totalQuoted.toLocaleString()} USD`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {(quote.status === "PENDING" || quote.status === "QUOTED") && (
                        <button
                          onClick={(e) => handleCancelQuote(quote.id, e)}
                          disabled={cancellingId === quote.id}
                          className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-black uppercase tracking-wider text-rose-400 rounded-[3px] transition-all cursor-pointer flex items-center gap-1"
                        >
                          {cancellingId === quote.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          Rechazar
                        </button>
                      )}

                      <ChevronDown
                        className={`w-4 h-4 text-white/40 transition-transform duration-300 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded items & quoting form */}
                {isExpanded && (
                  <div className="border-t border-white/5 bg-[#0f0d1e]/30 p-5">
                    {/* User profile complete card */}
                    <div className="mb-6 p-4 rounded-[3px] border border-white/5 bg-background/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1.5">
                          Información del Usuario
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-6 text-xs font-bold text-[#84849b]">
                          <p>Nombre: <span className="text-white">{quote.user.name || "N/A"}</span></p>
                          <p>Email: <span className="text-white">{quote.user.email || "N/A"}</span></p>
                          <p>Steam ID: <span className="text-white font-mono">{quote.user.steamId || "N/A"}</span></p>
                        </div>
                      </div>

                      {quote.user.steamId && (
                        <a
                          href={`https://steamcommunity.com/profiles/${quote.user.steamId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[3px] text-[10px] font-black uppercase tracking-wider text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          Perfil de Steam <ArrowRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <form onSubmit={(e) => handleSubmitQuote(quote.id, e)} className="space-y-6">
                      <h4 className="text-[10px] font-black text-[#84849b] uppercase tracking-widest">
                        Artículos a Cotizar (USD)
                      </h4>

                      <div className="space-y-3">
                        {quote.items.map((item) => {
                          const inputValue = pricesInput[quote.id]?.[item.assetId] ?? "";
                          const isQuoteEditable = quote.status === "PENDING" || quote.status === "QUOTED";

                          return (
                            <div
                              key={item.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg border border-white/5 bg-background/30"
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 bg-white/5 rounded-lg shrink-0 flex items-center justify-center p-1 border border-white/5">
                                  {item.iconUrl ? (
                                    <Image src={item.iconUrl} alt={item.name} fill className="object-contain p-1" />
                                  ) : (
                                    <DollarSign className="w-5 h-5 text-white/20" />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <h5 className="text-[10px] font-black text-white uppercase truncate">
                                    {item.name}
                                  </h5>
                                  <p className="text-[9px] text-[#84849b] mt-0.5 font-bold">
                                    {item.exterior || "Exterior no especificado"}
                                    {item.float !== null && ` · Float: ${item.float.toFixed(6)}`}
                                    {item.pattern !== null && ` · Seed: ${item.pattern}`}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
                                <span className="text-xs text-[#84849b] font-bold">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  disabled={!isQuoteEditable || submittingId === quote.id}
                                  value={inputValue}
                                  onChange={(e) => handlePriceChange(quote.id, item.assetId, e.target.value)}
                                  className="w-28 h-9 px-3 bg-white/5 border border-white/5 rounded-[3px] text-xs text-white placeholder-white/20 focus:border-accent/40 focus:outline-none disabled:opacity-50 font-mono text-right"
                                  required
                                />
                                <span className="text-xs text-[#84849b] font-bold">USD</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {(quote.status === "PENDING" || quote.status === "QUOTED") && (
                        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                          <button
                            type="submit"
                            disabled={submittingId === quote.id}
                            className="px-5 py-2.5 bg-accent hover:bg-accent/90 border border-accent/20 hover:border-accent/40 rounded-[3px] text-xs font-black uppercase tracking-widest text-white transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                          >
                            {submittingId === quote.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            Enviar Cotización
                          </button>
                        </div>
                      )}
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Custom alert and confirmation modal */}
      <AlertConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
      />
    </div>
  );
}
export default QuotesTab;
