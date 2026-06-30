import { AlertCircle, Loader2 } from "lucide-react";

import type { TranslationParams } from "@/shared/i18n/types";

type Translate = (key: string, params?: TranslationParams) => string;

export function TicketsAuthLoading({ t }: { t: Translate }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen pt-28 text-white font-sans">
      <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
      <p className="text-xs text-[#8984a1] font-bold uppercase tracking-widest">
        {t("common.loading")}
      </p>
    </div>
  );
}

export function TicketsLoginRequired() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20 text-white min-h-screen font-sans flex flex-col justify-center items-center">
      <div className="text-center py-20 px-8 bg-[#110f1e]/40 border border-white/5 rounded-2xl max-w-md w-full backdrop-blur-sm">
        <AlertCircle className="w-12 h-12 text-accent/80 mx-auto mb-4" />
        <h2 className="text-lg font-black uppercase tracking-tight text-white mb-2">
          Inicia Sesion Requerido
        </h2>
        <p className="text-sm text-[#8984a1] mb-6">
          Por favor, inicia sesion con tu cuenta de Steam para acceder al centro de soporte y revisar tus tickets.
        </p>
      </div>
    </div>
  );
}
