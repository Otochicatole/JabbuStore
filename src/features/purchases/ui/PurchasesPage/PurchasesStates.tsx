import { motion } from "framer-motion";
import { Loader2, ShoppingBag, XCircle } from "lucide-react";

import type { PurchaseTab, Translate } from "./helpers";

export function PurchasesError({
  error,
  loading,
  onRetry,
  t,
}: {
  error: string;
  loading: boolean;
  onRetry: () => void;
  t: Translate;
}) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-[3px]">
      <div className="flex items-start gap-3">
        <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-red-200">
            {t("purchases.historyError")}
          </p>
          <p className="text-xs text-red-200/80 mt-1">{error}</p>
        </div>
      </div>
      <button
        onClick={onRetry}
        disabled={loading}
        className="h-9 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-[3px] text-[10px] font-black uppercase tracking-wider text-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t("skinGrid.retryConnection")}
      </button>
    </div>
  );
}

export function PurchasesLoading({ t }: { t: Translate }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 bg-[#110f1e]/20 border border-white/5 rounded-[3px] backdrop-blur-md">
      <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
      <p className="text-xs text-[#84849b] font-bold uppercase tracking-widest">
        {t("purchases.loading")}
      </p>
    </div>
  );
}

export function PurchasesEmpty({ mode, t }: { mode: "buy" | "sell"; t: Translate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-24 bg-[#110f1e]/20 border border-white/5 rounded-[3px] backdrop-blur-md"
    >
      <ShoppingBag className="w-16 h-16 text-white/10 mx-auto mb-5" />
      <p className="text-lg font-black text-white/50 uppercase tracking-wide">
        {mode === "buy" ? t("purchases.noOrders") : t("listings.empty")}
      </p>
      <p className="text-sm text-[#84849b] mt-2 max-w-md mx-auto font-medium">
        {mode === "buy" ? t("purchases.noBuys") : t("purchases.noSells")}
      </p>
    </motion.div>
  );
}
