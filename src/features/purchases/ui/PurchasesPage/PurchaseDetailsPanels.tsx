import { FileText, MessageSquare } from "lucide-react";

import { BACKEND_URL } from "@/shared/lib/api";
import type { Order, SelectedProof } from "@/features/purchases/types";

import { getPaymentMethodLabel, isRaffleOrder, type Translate } from "./helpers";

interface PurchaseDetailsPanelsProps {
  isBuy: boolean;
  order: Order;
  onOpenProof: (proof: SelectedProof) => void;
  onOpenSupport: () => void;
  t: Translate;
}

export function PurchaseDetailsPanels({
  isBuy,
  order,
  onOpenProof,
  onOpenSupport,
  t,
}: PurchaseDetailsPanelsProps) {
  const visibleProof = isBuy ? order.metadata?.buyerPaymentProof : order.metadata?.adminPaymentProof;
  const visibleProofType = isBuy ? "buyer" : "admin";
  const visibleProofUrl = visibleProof
    ? `${BACKEND_URL}/orders/${order.id}/payment-proof/${visibleProofType}`
    : null;
  const isManualTransfer = order.paymentMethod === "manual_transfer";
  const isRaffle = isRaffleOrder(order);

  return (
    <>
      <PaymentInfoPanel order={order} t={t} />
      {isBuy && isManualTransfer && <ManualTransferPanel order={order} t={t} />}
      {order.bot && !isRaffle && <BotAccountPanel order={order} t={t} />}

      <div className="bg-[#110f1e]/40 p-4 border border-white/5 rounded-[3px]">
        <span className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono block mb-3">
          {t("purchases.paymentProof")}
        </span>
        {visibleProof && visibleProofUrl ? (
          <button
            type="button"
            onClick={() =>
              onOpenProof({
                url: visibleProofUrl,
                proof: visibleProof,
                title: isBuy ? t("purchases.yourPaymentProof") : t("purchases.receivedPaymentProof"),
              })
            }
            className="w-full sm:w-auto flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-[3px] hover:bg-emerald-500/15 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="min-w-0 text-left">
              <span className="block text-[10px] font-black uppercase tracking-wider">
                {t("purchases.viewProof")}
              </span>
              <span className="block text-[9px] text-emerald-100/70 truncate">
                {visibleProof.fileName || t("purchases.attachedFile")}
              </span>
            </span>
          </button>
        ) : (
          <p className="text-xs text-white/35 font-bold">
            {isBuy ? t("purchases.noBuyerProof") : t("purchases.noAdminProof")}
          </p>
        )}
      </div>

      <div className="bg-[#110f1e]/40 p-4 border border-white/5 rounded-[3px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono block mb-1">
            {t("tickets.support")}
          </span>
          <p className="text-xs text-white/35 font-bold">{t("tickets.orderHelp")}</p>
        </div>
        <button
          type="button"
          onClick={onOpenSupport}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-accent/10 hover:bg-accent/15 border border-accent/20 text-accent rounded-[3px] text-xs font-black uppercase transition-all cursor-pointer shrink-0"
        >
          <MessageSquare className="w-4 h-4 text-accent shrink-0" />
          <span>{t("tickets.openTicket")}</span>
        </button>
      </div>
    </>
  );
}

function PaymentInfoPanel({ order, t }: { order: Order; t: Translate }) {
  const paymentQuote = order.metadata?.paymentQuote;
  const arsQuote =
    paymentQuote?.settlement?.currency === "ARS" &&
    typeof paymentQuote.settlement.amount === "number"
      ? paymentQuote
      : null;

  return (
    <div className="bg-[#110f1e]/40 p-4 border border-white/5 rounded-[3px]">
      <span className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono block mb-3">
        {t("purchases.paymentDetails")}
      </span>
      <div className="text-[10px] text-[#84849b]">
        <span>{t("purchases.usedChannel")}</span>
        <span className="font-black text-accent block mt-0.5 uppercase">
          {getPaymentMethodLabel(order.paymentMethod, t)}
        </span>
      </div>

      {arsQuote && (
        <div className="mt-3 rounded-[3px] border border-accent/20 bg-accent/10 p-3 text-[9.5px]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[#84849b] uppercase block">{t("checkout.payInArs")}</span>
              <span className="font-black text-emerald-300">
                {formatArs(arsQuote.settlement?.amount || 0)} ARS
              </span>
            </div>
            <div>
              <span className="text-[#84849b] uppercase block">{t("checkout.baseAmount")}</span>
              <span className="font-bold text-white">
                ${Number(arsQuote.base?.amount || order.totalPrice).toFixed(2)} USD
              </span>
            </div>
            <div>
              <span className="text-[#84849b] uppercase block">{t("checkout.exchangeRate")}</span>
              <span className="font-bold text-white">
                {t(`checkout.rateKind.${arsQuote.rate?.kind || "blue"}`)} · {formatArs(arsQuote.rate?.value || 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {order.paymentMethod === "mercado_pago" && (
        <PaymentFields
          fields={[
            ["CVU / CBU", order.metadata?.cbu || "N/A"],
            [t("purchases.holderTaxId"), order.metadata?.accountHolder || "N/A"],
          ]}
        />
      )}

      {order.paymentMethod === "paypal" && (
        <PaymentFields
          fields={[
            [t("purchases.paypalEmail"), order.metadata?.cbu || "N/A"],
            [t("purchases.holder"), order.metadata?.accountHolder || "N/A"],
          ]}
        />
      )}

      {order.paymentMethod === "nowpayments" && (
        <PaymentFields
          fields={[
            [t("purchases.wallet"), order.metadata?.walletAddress || "N/A"],
            [t("purchases.blockchainNetwork"), order.metadata?.network || "N/A"],
          ]}
        />
      )}
    </div>
  );
}

function formatArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function PaymentFields({ fields }: { fields: [string, string][] }) {
  return (
    <div className="grid grid-cols-2 gap-3 mt-1 pt-1.5 border-t border-white/5 text-[9.5px]">
      {fields.map(([label, value]) => (
        <div key={label}>
          <span className="text-[8px] text-[#84849b] block">{label}</span>
          <span className="font-bold text-white block truncate select-all break-all">{value}</span>
        </div>
      ))}
    </div>
  );
}

function ManualTransferPanel({ order, t }: { order: Order; t: Translate }) {
  const snapshot = order.metadata?.manualTransferSnapshot;

  return (
    <div className="bg-emerald-500/10 p-4 border border-emerald-500/20 rounded-[3px]">
      <span className="text-[9px] font-black uppercase text-emerald-300 tracking-wider font-mono block mb-3">
        {t("paymentMethod.manual_transfer.name")}
      </span>
      <p className="text-[10px] text-emerald-100/70 font-bold uppercase tracking-wider mb-3">
        {t("purchases.manualTransferPending")}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
        {snapshot?.type === "crypto" ? (
          <>
            <ManualField className="sm:col-span-2" label="Wallet" value={snapshot.crypto?.address || "N/A"} />
            <ManualField label={t("purchases.network")} value={snapshot.crypto?.network || "N/A"} />
          </>
        ) : (
          <>
            <ManualField label="Alias" value={snapshot?.bank?.alias || "N/A"} />
            <ManualField label="CBU / CVU" value={snapshot?.bank?.cbu || "N/A"} />
            <ManualField className="sm:col-span-2" label={t("purchases.holder")} value={snapshot?.bank?.holder || "N/A"} />
          </>
        )}
      </div>
    </div>
  );
}

function ManualField({
  className = "",
  label,
  value,
}: {
  className?: string;
  label: string;
  value: string;
}) {
  return (
    <div className={className}>
      <span className="text-[#84849b] uppercase block">{label}</span>
      <span className="font-mono font-bold text-white break-all">{value}</span>
    </div>
  );
}

function BotAccountPanel({ order, t }: { order: Order; t: Translate }) {
  if (!order.bot) return null;
  const isBuy = order.type === "BUY";
  return (
    <div className="bg-[#110f1e]/40 p-4 border border-white/5 rounded-[3px]">
      <span className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono block mb-2">
        {isBuy
          ? (t("purchases.botAccountDetails") || "Cuenta oficial de envío (Bot)")
          : (t("purchases.botAccountReceiveDetails") || "Cuenta oficial de recepción (Bot)")}
      </span>
      <p className="text-[10px] text-white/50 mb-3 font-semibold">
        {isBuy
          ? (t("purchases.botAccountSecurityNote") || "Por tu seguridad, asegurate de que la oferta de intercambio provenga de esta cuenta:")
          : (t("purchases.botAccountSecurityNoteReceive") || "Por tu seguridad, realizá el intercambio únicamente con esta cuenta oficial:")}
      </p>
      <div className="grid grid-cols-2 gap-3 text-[9.5px]">
        <div>
          <span className="text-[8px] text-[#84849b] block uppercase">{t("purchases.botAccountName") || "Nombre del Bot"}</span>
          <span className="font-bold text-white block select-all">{order.bot.name}</span>
        </div>
        <div>
          <span className="text-[8px] text-[#84849b] block uppercase">{t("purchases.botAccountSteamId") || "Steam ID"}</span>
          <span className="font-mono font-bold text-accent block select-all">{order.bot.steamId}</span>
        </div>
      </div>
      {order.bot.tradeUrl && (
        <div className="mt-3 pt-2.5 border-t border-white/5">
          <a
            href={order.bot.tradeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            {t("purchases.botAccountTradeLink") || "Enlace de Trade del Bot"}
          </a>
        </div>
      )}
    </div>
  );
}
