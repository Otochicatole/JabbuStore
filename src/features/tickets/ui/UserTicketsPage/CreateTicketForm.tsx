import { motion } from "framer-motion";
import { AlertCircle, Loader2, X } from "lucide-react";

import { AdminSelect } from "@/shared/components/AdminSelect";
import type { TranslationParams } from "@/shared/i18n/types";
import type { Order } from "@/features/tickets/types";

type Translate = (key: string, params?: TranslationParams) => string;

interface CreateTicketFormProps {
  creating: boolean;
  formError: string | null;
  message: string;
  orderOptions: { value: string; label: string }[];
  orders: Order[];
  ordersLoading: boolean;
  selectedOrderId: string;
  subject: string;
  onClose: () => void;
  onMessageChange: (value: string) => void;
  onOrderChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onSubjectChange: (value: string) => void;
  t: Translate;
}

export function CreateTicketForm({
  creating,
  formError,
  message,
  orderOptions,
  orders,
  ordersLoading,
  selectedOrderId,
  subject,
  onClose,
  onMessageChange,
  onOrderChange,
  onSubmit,
  onSubjectChange,
  t,
}: CreateTicketFormProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.25 }}
      className="order-1 lg:order-2 lg:col-span-1 rounded-2xl border border-white/10 bg-[#211c33]/40 p-6 space-y-5 shadow-2xl backdrop-blur-md relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent/0 via-accent/40 to-accent/0" />
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-wider text-white">
          {t("tickets.openTicket")}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {formError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-xl text-[11px] flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p>{formError}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-[#8984a1]">
            Orden Relacionada
          </label>
          {ordersLoading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-white/55">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
              <span>Cargando tus ordenes...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-3 bg-orange-500/5 border border-orange-500/15 rounded-xl text-[10px] text-orange-300 font-bold uppercase tracking-wider flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
              <p>No tienes compras ni ventas en tu historial para abrir un ticket.</p>
            </div>
          ) : (
            <AdminSelect
              value={selectedOrderId}
              onChange={onOrderChange}
              options={orderOptions}
              className="w-full"
              buttonClassName="w-full px-4 py-3 bg-white/[0.02] border border-white/5 hover:border-white/10 focus:border-accent/40 rounded-xl text-xs text-white outline-none transition-all duration-300 flex items-center justify-between gap-2 cursor-pointer font-bold"
              menuClassName="absolute left-0 top-full mt-2 w-full bg-[#110f1e] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-40 backdrop-blur-xl"
              optionClassName="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-[#8984a1]">
            Asunto
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value.slice(0, 120))}
            placeholder={t("tickets.subjectPlaceholder")}
            className="w-full px-4 py-3 bg-white/[0.02] border border-white/5 hover:border-white/10 focus:border-accent/40 rounded-xl text-xs text-white placeholder-white/20 outline-none transition-all duration-300"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-[#8984a1]">
            Mensaje Inicial
          </label>
          <textarea
            value={message}
            onChange={(e) => onMessageChange(e.target.value.slice(0, 2000))}
            placeholder={t("tickets.initialMessagePlaceholder")}
            rows={4}
            className="w-full resize-none px-4 py-3 bg-white/[0.02] border border-white/5 hover:border-white/10 focus:border-accent/40 rounded-xl text-xs text-white placeholder-white/20 outline-none transition-all duration-300"
            required
          />
        </div>

        <button
          type="submit"
          disabled={creating || orders.length === 0 || !selectedOrderId || subject.trim().length < 3 || !message.trim()}
          className="w-full py-3 bg-accent hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-black uppercase tracking-wider text-white rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(217,70,239,0.25)] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : t("tickets.create")}
        </button>
      </form>
    </motion.div>
  );
}
