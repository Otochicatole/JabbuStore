import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Calendar, ChevronDown, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

import type { Order, SelectedProof } from "@/features/purchases/types";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";

import { getRaffleOrderContext, getStatusConfig, type Translate } from "./helpers";
import { PurchaseDetailsPanels } from "./PurchaseDetailsPanels";
import { PurchaseItemsList } from "./PurchaseItemsList";
import { PurchaseTimeline } from "./PurchaseTimeline";
import { Money } from "@/features/currency/ui/Money";
import { useCurrency } from "@/features/currency/context/CurrencyContext";
import { RetentionCountdown } from "@/shared/components/RetentionCountdown";

interface PurchaseOrderCardProps {
  expanded: boolean;
  index: number;
  locale: string;
  onOpenProof: (proof: SelectedProof) => void;
  onToggle: () => void;
  onRefresh: () => void;
  order: Order;
  t: Translate;
}

export function PurchaseOrderCard({
  expanded,
  index,
  locale,
  onOpenProof,
  onToggle,
  onRefresh,
  order,
  t,
}: PurchaseOrderCardProps) {
  const router = useRouter();
  const localizePath = useLocalizedPath();
  const { effectiveCurrency, rates } = useCurrency();
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const isBuy = order.type === "BUY";
  const raffleContext = getRaffleOrderContext(order);
  const isRaffle = raffleContext.isRaffle;
  const statusConfig = getStatusConfig(order.status, order.type, t, order);
  const paymentQuote = order.metadata?.paymentQuote;
  const arsSettlement =
    paymentQuote?.settlement?.currency === "ARS" &&
    typeof paymentQuote.settlement.amount === "number"
      ? paymentQuote.settlement.amount
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-[#110f1e]/40 border border-white/5 rounded-[3px] p-5 hover:border-white/10 transition-colors backdrop-blur-sm relative overflow-hidden"
    >
      <div className={`absolute top-0 bottom-0 left-0 w-1 ${isRaffle ? "bg-accent" : isBuy ? "bg-emerald-500" : "bg-purple-500"}`} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div
            className={`p-2.5 rounded-[3px] border shrink-0 ${
              isRaffle
                ? "bg-accent/5 border-accent/10 text-accent"
                : isBuy
                  ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400"
                  : "bg-purple-500/5 border-purple-500/10 text-purple-400"
            }`}
          >
            {isBuy ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
          </div>

          <div className="min-w-0 flex-1 sm:flex-initial">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-white/90">
                ID: <span className="text-accent">{order.id.slice(0, 8)}</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-[3px] text-[8.5px] font-black tracking-widest uppercase ${
                  isRaffle
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : isBuy
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                }`}
              >
                {isRaffle ? t("purchases.raffle") : isBuy ? t("purchases.buy") : t("purchases.sell")}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#84849b] mt-1 font-medium">
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(order.createdAt).toLocaleDateString(locale, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-white/5 sm:border-t-0">
          <div className="text-left sm:text-right">
            <span className="text-[9px] text-[#84849b] font-mono block uppercase tracking-widest">
              {t("purchases.totalAmount")}
            </span>
            <span className="text-sm sm:text-base font-black text-white">
              ${order.totalPrice.toLocaleString()} USD
            </span>
            {arsSettlement !== null && (
              <span className="block text-[10px] font-bold text-emerald-400">
                {formatArs(arsSettlement)} ARS
              </span>
            )}
            {effectiveCurrency !== "USD" && (
              <Money amountUsd={order.totalPrice} approximate className="block text-[10px] font-bold text-accent" />
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-[3px] text-[10px] font-bold border ${statusConfig.color}`}>
              {statusConfig.icon}
              <span className="max-w-[120px] sm:max-w-none truncate">{statusConfig.label}</span>
            </div>

            <button
              onClick={onToggle}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-[3px] transition-all text-white/50 hover:text-white cursor-pointer shrink-0"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded ? "rotate-180 text-accent animate-pulse" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 mt-5 pt-5 space-y-4">
              <PurchaseTimeline order={order} t={t} />

              {/* Retention timer panel for client */}
              {order.status === "RETENTION" && order.metadata?.retentionStartedAt && (
                <div className="space-y-3">
                  <RetentionCountdown retentionStartedAt={order.metadata.retentionStartedAt} />
                  <p className="text-[10px] text-white/40 leading-relaxed px-1">
                    Tu artículo se encuentra en el período de retención de seguridad de 8 días. Una vez finalizado el plazo, el administrador procesará el pago correspondiente.
                  </p>
                </div>
              )}

              {order.status === "AWAITING_APPROVAL" && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-[3px] space-y-3">
                  <h4 className="text-xs font-black uppercase text-blue-400">
                    Propuesta de Nueva Cotización
                  </h4>
                  <p className="text-[10px] text-white/70 leading-relaxed">
                    El administrador ha actualizado la cotización de tus ítems debido a cambios en el mercado global. La cotización total cambió de <span className="line-through text-white/40">${(order.metadata?.originalPrice || order.totalPrice).toFixed(2)} USD</span> a <span className="font-extrabold text-emerald-400 font-mono">${order.totalPrice.toFixed(2)} USD</span>.
                  </p>
                  
                  {/* Equivalents in local cashing currencies */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 bg-black/25 rounded-[3px] border border-white/5 text-[9.5px]">
                    <div>
                      <span className="text-[#84849b] block uppercase">Equivalente USD</span>
                      <span className="font-bold text-white font-mono">${order.totalPrice.toFixed(2)} USD</span>
                    </div>
                    {rates?.rates.ARS && (
                      <div>
                        <span className="text-[#84849b] block uppercase">Equivalente ARS</span>
                        <span className="font-bold text-white font-mono">
                          {new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(order.totalPrice * rates.rates.ARS)} ARS
                        </span>
                      </div>
                    )}
                    {rates?.rates.BRL && (
                      <div>
                        <span className="text-[#84849b] block uppercase">Equivalente BRL</span>
                        <span className="font-bold text-white font-mono">
                          {new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(order.totalPrice * rates.rates.BRL)} BRL
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2.5 pt-1.5">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={async () => {
                        setActionLoading(true);
                        setActionError(null);
                        try {
                          const res = await fetchWithAuth(`${BACKEND_URL}/orders/${order.id}/approve-requote`, {
                            method: "POST"
                          });
                          if (!res.ok) {
                            const data = await res.json().catch(() => null);
                            throw new Error(data?.error || "Error al aprobar cotización");
                          }
                          onRefresh();
                        } catch (err: any) {
                          setActionError(err.message || "Error al procesar la aprobación.");
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/20 text-white rounded-[3px] text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Aprobar nueva cotización
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={async () => {
                        setActionLoading(true);
                        setActionError(null);
                        try {
                          const res = await fetchWithAuth(`${BACKEND_URL}/orders/${order.id}/reject-requote`, {
                            method: "POST"
                          });
                          if (!res.ok) {
                            const data = await res.json().catch(() => null);
                            throw new Error(data?.error || "Error al rechazar cotización");
                          }
                          onRefresh();
                        } catch (err: any) {
                          setActionError(err.message || "Error al procesar el rechazo.");
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-300 rounded-[3px] text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      Rechazar y cancelar venta
                    </button>
                  </div>

                  {actionError && (
                    <p className="text-[10px] font-bold text-red-400">{actionError}</p>
                  )}
                </div>
              )}
              <PurchaseDetailsPanels
                isBuy={isBuy}
                order={order}
                onOpenProof={onOpenProof}
                onOpenSupport={() => router.push(`${localizePath("/tickets")}?orderId=${order.id}`)}
                t={t}
              />
              <PurchaseItemsList
                items={order.items}
                t={t}
                raffleId={raffleContext.raffleId}
                raffleName={raffleContext.raffleName}
                ticketsCount={raffleContext.ticketsCount}
                userChancesInRaffle={raffleContext.userChancesInRaffle}
                localizePath={localizePath}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function formatArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
