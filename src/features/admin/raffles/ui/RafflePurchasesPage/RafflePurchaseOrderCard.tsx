"use client";

import Link from "next/link";
import { ExternalLink, Ticket, UserRound } from "lucide-react";

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
  metadata: Record<string, unknown> | null;
  items: { id: string; name: string; iconUrl: string | null; price: number }[];
}

function getOrderStatusTone(status: string) {
  if (status === "COMPLETED") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  if (status === "CANCELLED") return "border-red-500/20 bg-red-500/10 text-red-400";
  if (status === "PAID") return "border-blue-500/20 bg-blue-500/10 text-blue-400";
  if (status === "TRADE_PENDING") return "border-purple-500/20 bg-purple-500/10 text-purple-400";
  return "border-orange-500/20 bg-orange-500/10 text-orange-400";
}

function getOrderStatusLabel(status: string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Pago pendiente";
    case "PAID":
      return "Pagado";
    case "TRADE_PENDING":
      return "Procesando";
    case "COMPLETED":
      return "Completado";
    case "CANCELLED":
      return "Cancelado";
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
  return (
    <div className="rounded-[3px] border border-white/5 bg-[#110f1e]/35 p-4 hover:border-white/10 transition-colors">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {order.user?.avatar ? (
            <img
              src={order.user.avatar}
              alt=""
              className="h-10 w-10 shrink-0 rounded-[3px] border border-white/10"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px] border border-white/10 bg-white/3 text-[#84849b]">
              <UserRound className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">
              {order.user?.name || "Usuario Steam"}
            </p>
            <p className="truncate text-[10px] font-mono text-accent">
              {order.user?.steamId || order.id}
            </p>
            {showRaffle && (
              <p className="truncate text-[10px] font-bold uppercase tracking-wider text-[#84849b] mt-0.5">
                {order.raffle.name}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:items-center lg:gap-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#84849b]">Orden</p>
            <p className="font-mono text-xs font-bold text-white/80">{order.id.slice(0, 8)}</p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#84849b]">Total</p>
            <p className="text-sm font-black text-emerald-400">${order.totalPrice.toFixed(2)}</p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#84849b]">Chances</p>
            <p className="text-sm font-black text-white flex items-center gap-1">
              <Ticket className="w-3 h-3 text-accent" />
              {order.ticketsCount}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#84849b]">Estado</p>
            <span
              className={`inline-flex rounded-[3px] border px-2 py-1 text-[9px] font-black uppercase tracking-wider ${getOrderStatusTone(order.status)}`}
            >
              {getOrderStatusLabel(order.status)}
            </span>
          </div>
        </div>

        <Link
          href={detailHref}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-wider transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Ver
        </Link>
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-[#84849b]">
        <span className="font-mono">{new Date(order.createdAt).toLocaleString()}</span>
        <span className="font-bold uppercase tracking-wider">{order.paymentMethod || "—"}</span>
      </div>
    </div>
  );
}
