import { Layers } from "lucide-react";

import type { Order } from "@/features/purchases/types";

import { getCurrentPurchaseStep, type Translate } from "./helpers";

interface PurchaseTimelineProps {
  order: Order;
  t: Translate;
}

export function PurchaseTimeline({ order, t }: PurchaseTimelineProps) {
  const isBuy = order.type === "BUY";
  const currentStep = getCurrentPurchaseStep(order);
  const labels = isBuy
    ? [
        [t("purchases.step.verifyPayment"), currentStep === 1 ? t("purchases.step.paymentPending") : t("purchases.step.paymentVerified")],
        [t("purchases.step.sourcingSkins"), currentStep === 2 ? t("purchases.step.locatingSkins") : t("purchases.step.skinsReady")],
        [t("purchases.step.sendTrade"), currentStep === 3 ? t("purchases.step.awaitingAcceptance") : t("purchases.step.tradeDelivered")],
        [t("purchases.step.completed"), currentStep === 4 ? t("purchases.step.skinDelivered") : t("purchases.step.queued")],
      ]
    : [
        [t("purchases.step.reviewSell"), currentStep === 1 ? t("purchases.step.awaitingReview") : t("purchases.step.sellApproved")],
        [t("purchases.step.sendTrade"), currentStep === 2 ? t("purchases.step.awaitingTrade") : t("purchases.step.tradeReceived")],
        [t("purchases.step.processPayment"), currentStep === 3 ? t("purchases.step.paymentQueued") : t("purchases.step.paymentSent")],
        [t("purchases.step.completed"), currentStep === 4 ? t("purchases.step.sellCompleted") : t("purchases.step.queued")],
      ];

  return (
    <div className="bg-white/[0.01] border border-white/5 p-4 rounded-[3px]">
      <span className="text-[10px] font-black uppercase tracking-wider font-mono text-[#84849b] mb-4 flex items-center gap-1.5">
        <Layers className="w-3.5 h-3.5 text-accent" />
        {t("purchases.transactionProgress", {
          type: isBuy ? t("purchases.buy") : t("purchases.sell"),
        })}
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
        {labels.map(([title, description], index) => {
          const step = index + 1;
          const active = currentStep === step;
          const done = currentStep > step;

          return (
            <div
              key={title}
              className={`flex items-center gap-2.5 p-2 border transition-all rounded-[3px] ${
                active
                  ? "bg-accent/10 border-accent/30 text-accent"
                  : done
                    ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400 opacity-60"
                    : "bg-white/[0.01] border-white/5 text-white/30"
              }`}
            >
              <div
                className={`w-5 h-5 flex items-center justify-center text-[10px] font-black font-mono rounded-[3px] ${
                  active
                    ? "bg-accent text-white"
                    : done
                      ? "bg-emerald-400 text-black"
                      : "bg-white/10 text-white/40"
                }`}
              >
                {done ? "OK" : step}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase block leading-tight">
                  {title}
                </span>
                <span className="text-[8.5px] font-mono opacity-60">{description}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
