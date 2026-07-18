"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
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
  TrendingUp
} from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { AlertConfirmModal } from "@/shared/components/AlertConfirmModal";
import { Money } from "@/features/currency/ui/Money";
import { useCurrency } from "@/features/currency/context/CurrencyContext";

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

interface Quote {
  id: string;
  status: "PENDING" | "QUOTED" | "ACCEPTED" | "CANCELLED";
  items: QuoteItem[];
  createdAt: string;
  updatedAt: string;
}

export function QuotesPage() {
  const { t } = useI18n();
  const { effectiveCurrency } = useCurrency();
  const router = useRouter();
  const localizePath = useLocalizedPath();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({});
  const [cancellingId, setCancellingId] = useState<string | null>(null);

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
      const res = await fetchWithAuth(`${BACKEND_URL}/quotes/me`, {
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      });

      if (res.status === 401) {
        router.push(localizePath("/"));
        return;
      }

      if (!res.ok) {
        throw new Error("No se pudieron cargar tus cotizaciones.");
      }

      const data = await res.json();
      setQuotes(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al cargar las cotizaciones.");
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

  const handleCancelQuote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm(
      "Cancelar Cotización",
      "¿Estás seguro de que deseas cancelar esta solicitud de cotización?",
      async () => {
        setCancellingId(id);
        try {
          const res = await fetchWithAuth(`${BACKEND_URL}/quotes/${id}/cancel`, {
            method: "POST",
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data?.error || "Error al cancelar la cotización.");
          }

          const updatedQuote = await res.json();
          setQuotes((prev) =>
            prev.map((q) => (q.id === id ? { ...q, status: updatedQuote.status } : q))
          );
          showAlert("Solicitud Cancelada", "Tu solicitud de cotización ha sido cancelada correctamente.", "success");
        } catch (err: any) {
          showAlert("Error", err.message || "Error al cancelar la cotización.", "error");
        } finally {
          setCancellingId(null);
        }
      }
    );
  };

  const handleAcceptQuote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(localizePath(`/checkout?type=sell&quoteId=${id}`));
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
          color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]",
          icon: DollarSign,
        };
      case "ACCEPTED":
        return {
          label: "Aceptado",
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20 text-white min-h-screen font-sans">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
            Mis Cotizaciones
          </h1>
          <p className="text-xs sm:text-sm text-[#84849b] mt-1.5 font-medium">
            Seguimiento de tus solicitudes de cotización manual.
          </p>
        </div>

        <button
          onClick={fetchQuotes}
          disabled={loading}
          className="flex items-center justify-center gap-2 h-10 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[3px] text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
          ) : (
            <TrendingUp className="w-3.5 h-3.5" />
          )}
          {t("common.refresh")}
        </button>
      </header>

      {error && (
        <div className="p-6 rounded-xl bg-rose-500/5 border border-rose-500/10 text-center mb-8">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-white/90 mb-4">{error}</p>
          <button
            onClick={fetchQuotes}
            className="px-4 py-2 bg-accent hover:bg-accent/90 text-xs font-black uppercase tracking-wider rounded-[3px] transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {loading && quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-white/5 rounded-2xl">
          <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
          <p className="text-xs text-[#84849b] font-bold uppercase tracking-widest">
            Cargando cotizaciones...
          </p>
        </div>
      ) : quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#110f1e]/40 border border-white/5 rounded-2xl text-center px-4">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <DollarSign className="w-8 h-8 text-[#84849b]/40" />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
            No tienes cotizaciones registradas
          </h3>
          <p className="text-xs text-[#84849b] max-w-sm mb-6">
            Ve a la sección de venta para seleccionar ítems de tu inventario y solicitar una cotización manual.
          </p>
          <button
            onClick={() => router.push(localizePath("/sell"))}
            className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-xs font-black uppercase tracking-wider rounded-[3px] transition-colors"
          >
            Ir a Vender
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote, index) => {
            const isExpanded = !!expandedQuotes[quote.id];
            const badge = getStatusBadgeConfig(quote.status);
            const StatusIcon = badge.icon;

            const totalQuoted = quote.items.reduce((sum, item) => sum + (item.price ?? 0), 0);

            return (
              <motion.div
                key={quote.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-[#110f1e]/40 border border-white/5 rounded-[3px] hover:border-white/10 transition-colors backdrop-blur-sm relative overflow-hidden"
              >
                {/* Visual indicator bar on the side */}
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

                {/* Card Header clickable area */}
                <div
                  onClick={() => toggleExpand(quote.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-[3px] border shrink-0 bg-white/5 border-white/5 text-[#84849b]`}
                    >
                      <Calendar className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-white/90">
                          ID: <span className="text-accent">{quote.id.slice(0, 8)}</span>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-[3px] text-[8.5px] font-black tracking-widest uppercase border ${badge.color} flex items-center gap-1`}
                        >
                          <StatusIcon className="w-2.5 h-2.5 shrink-0" />
                          {badge.label}
                        </span>
                      </div>

                      <p className="text-[10px] text-[#84849b] mt-1 font-bold">
                        {new Date(quote.createdAt).toLocaleDateString(undefined, {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" · "}
                        {quote.items.length} ítem{quote.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto border-t border-white/5 sm:border-t-0 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[8px] text-[#84849b] font-mono block uppercase tracking-widest">
                        Total Cotizado
                      </span>
                      {quote.status === "PENDING" ? (
                        <span className="text-sm font-black text-white">Pendiente</span>
                      ) : (
                        <>
                          <Money amountUsd={totalQuoted} approximate={effectiveCurrency !== "USD"} className="block text-sm font-black text-white" />
                          {effectiveCurrency !== "USD" && <span className="block text-[9px] font-bold text-white/40">${totalQuoted.toFixed(2)} USD</span>}
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {quote.status === "QUOTED" && (
                        <button
                          onClick={(e) => handleAcceptQuote(quote.id, e)}
                          className="px-3.5 py-1.5 bg-accent hover:bg-accent/90 border border-accent/20 hover:border-accent/40 rounded-[3px] text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-[0_0_15px_rgba(217,70,239,0.2)] flex items-center gap-1 cursor-pointer"
                        >
                          Aceptar <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {(quote.status === "PENDING" || quote.status === "QUOTED") && (
                        <button
                          onClick={(e) => handleCancelQuote(quote.id, e)}
                          disabled={cancellingId === quote.id}
                          className="p-1.5 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-white/40 hover:text-rose-400 rounded-[3px] transition-all cursor-pointer"
                          title="Cancelar solicitud"
                        >
                          {cancellingId === quote.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
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

                {/* Collapsible Details Area */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-white/5 bg-[#0f0d1e]/30"
                    >
                      <div className="p-5 space-y-4">
                        <h4 className="text-[10px] font-black text-[#84849b] uppercase tracking-widest">
                          Detalle de Artículos
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {quote.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-background/30"
                            >
                              <div className="relative w-12 h-12 bg-white/5 rounded-lg shrink-0 flex items-center justify-center p-1 border border-white/5">
                                {item.iconUrl ? (
                                  <Image
                                    src={item.iconUrl}
                                    alt={item.name}
                                    fill
                                    className="object-contain p-1"
                                  />
                                ) : (
                                  <DollarSign className="w-5 h-5 text-white/20" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <h5 className="text-[10px] font-black text-white uppercase truncate">
                                  {item.name}
                                </h5>
                                <p className="text-[9px] text-[#84849b] mt-0.5 font-bold">
                                  {item.exterior || "Exterior no especificado"}
                                  {item.float !== null && ` · Float: ${item.float.toFixed(4)}`}
                                </p>
                              </div>

                              <div className="text-right font-mono shrink-0">
                                <p className="text-[9px] text-[#84849b] uppercase tracking-widest font-sans font-bold">
                                  Precio
                                </p>
                                {item.price !== null ? (
                                  <Money amountUsd={item.price} approximate={effectiveCurrency !== "USD"} className="text-xs font-black text-white mt-0.5" />
                                ) : (
                                  <p className="text-xs font-black text-white mt-0.5">A cotizar</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
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
export default QuotesPage;
