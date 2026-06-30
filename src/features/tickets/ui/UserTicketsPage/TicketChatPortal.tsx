import { createPortal } from "react-dom";
import { X } from "lucide-react";

import type { OrderTicket } from "@/features/tickets/domain/types";
import { TicketChat } from "@/features/tickets/ui/TicketChat";
import type { TranslationParams } from "@/shared/i18n/types";

type Translate = (key: string, params?: TranslationParams) => string;

interface TicketChatPortalProps {
  selected: OrderTicket;
  onClose: () => void;
  onTicketUpdated: () => void;
  t: Translate;
}

export function TicketChatPortal({
  selected,
  onClose,
  onTicketUpdated,
  t,
}: TicketChatPortalProps) {
  return createPortal(
    <div className="fixed inset-0 z-[120] flex h-dvh flex-col bg-[#070510]">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#0f0d1e] px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-[9.5px] font-mono text-white/40">
            Referencia: <span className="text-white select-all">#{selected.orderId}</span> -{" "}
            <span className={selected.order?.type === "BUY" ? "text-emerald-400" : "text-purple-400"}>
              {selected.order?.type === "BUY" ? "Compra" : "Venta"}
            </span>
          </p>
          <h2 className="truncate text-sm font-black text-white sm:text-base">
            {selected.subject}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 cursor-pointer rounded-full bg-white/10 p-2.5 text-white hover:bg-white/15 transition-all duration-300"
          aria-label={t("common.close")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <TicketChat
          ticket={selected}
          actor="USER"
          onTicketUpdated={onTicketUpdated}
          fullscreen
        />
      </div>
    </div>,
    document.body,
  );
}
