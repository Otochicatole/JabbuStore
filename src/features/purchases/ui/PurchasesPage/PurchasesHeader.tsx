import { ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";

import type { PurchaseTab, Translate } from "./helpers";

interface PurchasesHeaderProps {
  mode: "buy" | "sell";
  loading: boolean;
  onRefresh: () => void;
  t: Translate;
}

export function PurchasesHeader({
  mode,
  loading,
  onRefresh,
  t,
}: PurchasesHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
          {mode === "buy" ? t("purchases.title") : t("listings.title")}
        </h1>
        <p className="text-sm text-[#84849b] mt-1.5 font-medium">
          {mode === "buy" ? t("purchases.description") : t("listings.description")}
        </p>
      </div>

      <div className="flex flex-col sm:items-end gap-3 shrink-0 w-full md:w-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full justify-end">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center justify-center gap-2 h-10 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[3px] text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer w-full sm:w-auto"
          >
            <Loader2 className={`w-3.5 h-3.5 ${loading ? "animate-spin text-accent" : ""}`} />
            {t("common.refresh")}
          </button>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-[3px] transition-all flex items-center justify-center gap-1.5 text-center ${
        active
          ? "bg-accent text-white shadow-[0_0_15px_rgba(217,70,239,0.35)]"
          : "text-white/60 hover:text-white cursor-pointer"
      }`}
    >
      {children}
    </button>
  );
}
