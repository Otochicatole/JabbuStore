"use client";

import { Package, UserRound } from "lucide-react";
import type { Order } from "@/features/admin/domain/types";
import { useI18n } from "@/shared/i18n/I18nProvider";

interface AdminOrderListCardProps {
  order: Order;
  kind: "purchase" | "listing";
  onOpen: (orderId: string) => void;
}

function getStatusTone(status: string) {
  if (status === "COMPLETED") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  if (status === "CANCELLED") return "border-red-500/20 bg-red-500/10 text-red-400";
  if (status === "PAID") return "border-blue-500/20 bg-blue-500/10 text-blue-400";
  if (status === "TRADE_PENDING") return "border-purple-500/20 bg-purple-500/10 text-purple-400";
  return "border-orange-500/20 bg-orange-500/10 text-orange-400";
}

function getStatusLabel(status: string, t: (key: any) => string) {
  switch (status) {
    case 'PENDING_PAYMENT': return t("purchases.status.paymentPending");
    case 'PAID': return t("purchases.status.paid");
    case 'TRADE_PENDING': return t("purchases.status.tradePending");
    case 'COMPLETED': return t("purchases.status.completed");
    case 'CANCELLED': return t("purchases.status.cancelled");
    default: return status.replaceAll("_", " ");
  }
}

export function AdminOrderListCard({ order, kind, onOpen }: AdminOrderListCardProps) {
  const { t } = useI18n();
  const actorLabel = kind === "purchase" ? t("admin.orders.buyer") : t("admin.sellOrders.seller");
  const totalLabel = kind === "purchase" ? t("admin.orders.totalAmount") : t("admin.sellOrders.amountToPay");
  const previewItems = order.items.slice(0, 3);

  return (
    <button
      type="button"
      onClick={() => onOpen(order.id)}
      className="group w-full cursor-pointer rounded-[3px] border border-white/5 bg-[#110f1e]/35 p-4 text-left transition-all hover:border-accent/30 hover:bg-[#110f1e]/55"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {order.user?.avatar ? (
            <img
              src={order.user.avatar}
              alt=""
              className="h-11 w-11 shrink-0 rounded-[3px] border border-white/10"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] border border-white/10 bg-white/[0.03] text-[#84849b]">
              <UserRound className="h-5 w-5" />
            </div>
          )}

          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#84849b]">
              {actorLabel}
            </p>
            <p className="truncate text-sm font-black text-white">
              {order.user?.name || t("admin.common.unknownUser")}
            </p>
            <p className="truncate text-[10px] font-mono text-accent">
              {order.user?.steamId || order.id}
            </p>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:items-center lg:gap-6">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#84849b]">{t("admin.common.order")}</p>
            <p className="truncate font-mono text-xs font-bold text-white/80">
              {order.id.slice(0, 8)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#84849b]">
              {totalLabel}
            </p>
            <p className="text-sm font-black text-emerald-400">
              ${order.totalPrice.toLocaleString()} USD
            </p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#84849b]">{t("admin.common.status")}</p>
            <span className={`inline-flex rounded-[3px] border px-2 py-1 text-[9px] font-black uppercase tracking-wider ${getStatusTone(order.status)}`}>
              {getStatusLabel(order.status, t)}
            </span>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#84849b]">{t("admin.common.items")}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-[#84849b]" />
              <span className="text-xs font-bold text-white">{order.items.length}</span>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-3 border-t border-white/5 pt-3 lg:min-w-[220px] lg:border-t-0 lg:pt-0">
          <div className="flex min-w-0 -space-x-2">
            {previewItems.map((item) => (
              <div
                key={item.id}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[3px] border border-white/10 bg-[#0b0818]"
                title={item.name}
              >
                {item.iconUrl ? (
                  <img src={item.iconUrl} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  <Package className="h-4 w-4 text-[#84849b]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}
