"use client";

import { ChevronRight, Package, UserRound } from "lucide-react";
import type { Order } from "@/features/admin/domain/types";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { AdminBadge } from "@/features/admin/ui/AdminShell";

interface AdminOrderListCardProps {
  order: Order;
  kind: "purchase" | "listing";
  onOpen: (orderId: string) => void;
}

function getStatusBadgeProps(
  status: string,
): { tone: "success" | "danger" | "info" | "accent" | "warning" | "neutral" } {
  if (status === "COMPLETED") return { tone: "success" };
  if (status === "CANCELLED") return { tone: "danger" };
  if (status === "PAID") return { tone: "info" };
  if (status === "TRADE_PENDING") return { tone: "accent" };
  if (status === "RETENTION" || status === "AWAITING_APPROVAL" || status === "PENDING_PAYMENT") {
    return { tone: "warning" };
  }
  return { tone: "neutral" };
}

function getStatusLabel(status: string, kind: "purchase" | "listing", t: (key: string) => string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return kind === "listing"
        ? t("purchases.status.sellPendingApproval")
        : t("purchases.status.paymentPending");
    case "PAID":
      return t("purchases.status.paid");
    case "TRADE_PENDING":
      return t("purchases.status.tradePending");
    case "RETENTION":
      return t("purchases.status.sellRetention");
    case "AWAITING_APPROVAL":
      return t("purchases.status.sellAwaitingApproval");
    case "COMPLETED":
      return t("purchases.status.completed");
    case "CANCELLED":
      return t("purchases.status.cancelled");
    default:
      return status.replaceAll("_", " ");
  }
}

export function AdminOrderListCard({ order, kind, onOpen }: AdminOrderListCardProps) {
  const { t } = useI18n();
  const actorLabel = kind === "purchase" ? t("admin.orders.buyer") : t("admin.sellOrders.seller");
  const totalLabel = kind === "purchase" ? t("admin.orders.totalAmount") : t("admin.sellOrders.amountToPay");
  const previewItems = order.items.slice(0, 3);
  const badgeProps = getStatusBadgeProps(order.status);
  const arsSettlement =
    order.metadata?.paymentQuote?.settlement?.currency === "ARS" &&
    typeof order.metadata.paymentQuote.settlement.amount === "number"
      ? order.metadata.paymentQuote.settlement.amount
      : null;

  return (
    <button
      type="button"
      onClick={() => onOpen(order.id)}
      className="group w-full cursor-pointer rounded-lg border border-white/[0.07] bg-[#141124] p-4 text-left transition-colors hover:border-accent/40 hover:bg-[#19152d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* User & Identity */}
        <div className="flex min-w-0 items-center gap-3 lg:w-72">
          {order.user?.avatar ? (
            <img
              src={order.user.avatar}
              alt=""
              className="h-10 w-10 shrink-0 rounded-md border border-white/10 object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#1c1833] text-[#9e98b6]">
              <UserRound className="h-4.5 w-4.5" />
            </div>
          )}

          <div className="min-w-0">
            <p className="text-[11px] font-medium text-[#8e88a6]">{actorLabel}</p>
            <p className="truncate text-sm font-semibold text-white">
              {order.user?.name || t("admin.common.unknownUser")}
            </p>
            <p className="truncate font-mono text-xs text-[#a39db9] tabular-nums">
              {order.user?.steamId || order.id.slice(0, 8)}
            </p>
          </div>
        </div>

        {/* Key Figures */}
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 sm:grid-cols-4 lg:items-center lg:gap-5">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-[#8e88a6]">{t("admin.common.order")}</p>
            <p className="mt-0.5 truncate font-mono text-xs font-medium text-[#d4cfe6] tabular-nums">
              #{order.id.slice(0, 8)}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-medium text-[#8e88a6]">{totalLabel}</p>
            <p className="mt-0.5 text-sm font-semibold text-emerald-400 tabular-nums">
              ${order.totalPrice.toLocaleString()} USD
            </p>
            {arsSettlement !== null && (
              <p className="text-xs font-medium text-emerald-300/85 tabular-nums">
                {formatArs(arsSettlement)} ARS
              </p>
            )}
            {kind === "listing" && (
              <p className="mt-0.5 text-[11px] font-medium text-[#b8b2cd]">
                {order.paymentMethod === "mercado_pago"
                  ? `${t("checkout.bankTransfer")} (${order.metadata?.payoutCurrency || "ARS"})`
                  : order.paymentMethod === "paypal"
                    ? "PayPal (USD)"
                    : order.paymentMethod === "nowpayments"
                      ? "Crypto"
                      : order.paymentMethod || "N/A"}
              </p>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-medium text-[#8e88a6] mb-1">{t("admin.common.status")}</p>
            <AdminBadge tone={badgeProps.tone} dot>
              {getStatusLabel(order.status, kind, t)}
            </AdminBadge>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-medium text-[#8e88a6]">{t("admin.common.items")}</p>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-white tabular-nums">
              <Package className="h-3.5 w-3.5 text-[#8e88a6]" />
              <span>{order.items.length}</span>
            </div>
          </div>
        </div>

        {/* Preview Items + Manage Arrow */}
        <div className="flex min-w-0 items-center justify-between gap-3 border-t border-white/[0.06] pt-3 lg:justify-end lg:border-t-0 lg:pt-0">
          <div className="flex min-w-0 -space-x-2">
            {previewItems.map((item) => (
              <div
                key={item.id}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-[#0d0a18]"
                title={item.name}
              >
                {item.iconUrl ? (
                  <img src={item.iconUrl} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  <Package className="h-3.5 w-3.5 text-[#8e88a6]" />
                )}
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-[#1c1833] text-xs font-medium text-[#b8b2cd] tabular-nums">
                +{order.items.length - 3}
              </div>
            )}
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#9e98b6] group-hover:text-white transition-colors">
            <span className="hidden xl:inline">{t("admin.common.manage")}</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </button>
  );
}

function formatArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
