"use client";

import Link from "next/link";
import { ChevronRight, Ticket, UserRound } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import type { PaymentQuoteSnapshot } from "@/features/admin/domain/types";
import { AdminBadge } from "@/features/admin/ui/AdminShell";

interface RaffleOrderMetadata extends Record<string, unknown> {
  paymentQuote?: PaymentQuoteSnapshot | null;
}

export interface RafflePurchaseOrder {
  id: string;
  userId: string;
  user: { name: string | null; steamId: string | null; avatar: string | null } | null;
  status: string;
  totalPrice: number;
  paymentMethod: string | null;
  createdAt: string;
  ticketsCount: number;
  raffleTickets: number[];
  raffleId: string;
  raffle: { id: string; name: string; status: string };
  metadata: RaffleOrderMetadata | null;
  items: { id: string; name: string; iconUrl: string | null; price: number }[];
}

function getOrderStatusTone(status: string): "success" | "danger" | "info" | "accent" | "warning" {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED") return "danger";
  if (status === "PAID") return "info";
  if (status === "TRADE_PENDING") return "accent";
  return "warning";
}

function getOrderStatusLabel(status: string, t: (key: string) => string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return t("admin.rafflePurchases.statusPendingPayment");
    case "PAID":
      return t("admin.rafflePurchases.statusPaid");
    case "TRADE_PENDING":
      return t("admin.rafflePurchases.workflowProcessing");
    case "COMPLETED":
      return t("admin.rafflePurchases.statusCompleted");
    case "CANCELLED":
      return t("admin.rafflePurchases.statusCancelled");
    default:
      return status.replaceAll("_", " ");
  }
}

export function RafflePurchaseOrderCard({
  order,
  detailHref,
  showRaffle = true,
}: {
  order: RafflePurchaseOrder;
  detailHref: string;
  showRaffle?: boolean;
}) {
  const { t } = useI18n();
  const arsSettlement =
    order.metadata?.paymentQuote?.settlement?.currency === "ARS" &&
    typeof order.metadata.paymentQuote.settlement.amount === "number"
      ? order.metadata.paymentQuote.settlement.amount
      : null;

  return (
    <Link
      href={detailHref}
      className="group block rounded-lg border border-white/[0.07] bg-[#141124] p-4 transition-colors hover:border-accent/40 hover:bg-[#19152d]"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3 lg:w-72">
          {order.user?.avatar ? (
            <img
              src={order.user.avatar}
              alt=""
              className="h-10 w-10 shrink-0 rounded-md border border-white/10 object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#1c1833] text-[#9e98b6]">
              <UserRound className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {order.user?.name || t("admin.rafflePurchases.steamUser")}
            </p>
            <p className="truncate font-mono text-xs text-[#a39db9] tabular-nums">
              {order.user?.steamId || order.id.slice(0, 8)}
            </p>
            {showRaffle && (
              <p className="mt-0.5 truncate text-xs font-medium text-accent">
                {order.raffle.name}
              </p>
            )}
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4 lg:items-center lg:gap-5">
          <div>
            <p className="text-[11px] font-medium text-[#8e88a6]">
              {t("admin.rafflePurchases.columnOrder")}
            </p>
            <p className="mt-0.5 font-mono text-xs font-medium text-[#d4cfe6] tabular-nums">
              #{order.id.slice(0, 8)}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-medium text-[#8e88a6]">
              {t("admin.rafflePurchases.columnTotal")}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-emerald-400 tabular-nums">
              ${order.totalPrice.toFixed(2)} USD
            </p>
            {arsSettlement !== null && (
              <p className="text-xs font-medium text-emerald-300/85 tabular-nums">
                {formatArs(arsSettlement)} ARS
              </p>
            )}
          </div>

          <div>
            <p className="text-[11px] font-medium text-[#8e88a6]">
              {t("admin.rafflePurchases.columnChances")}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-white tabular-nums">
              <Ticket className="h-3.5 w-3.5 text-accent" />
              {order.ticketsCount}
            </p>
          </div>

          <div>
            <p className="mb-1 text-[11px] font-medium text-[#8e88a6]">
              {t("admin.rafflePurchases.columnStatus")}
            </p>
            <AdminBadge tone={getOrderStatusTone(order.status)} dot>
              {getOrderStatusLabel(order.status, t)}
            </AdminBadge>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-2.5 text-xs text-[#8e88a6] lg:border-t-0 lg:pt-0">
          <span className="lg:hidden">{new Date(order.createdAt).toLocaleDateString()}</span>
          <span className="inline-flex items-center gap-1 font-medium text-[#9e98b6] group-hover:text-white transition-colors">
            <span>{t("admin.rafflePurchases.orderView")}</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>

      <div className="mt-3 hidden items-center justify-between border-t border-white/[0.05] pt-2.5 text-xs text-[#8e88a6] lg:flex">
        <span className="tabular-nums">{new Date(order.createdAt).toLocaleString()}</span>
        <span className="font-medium text-[#b8b2cd]">{order.paymentMethod || "—"}</span>
      </div>
    </Link>
  );
}

function formatArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
