"use client";

import React from "react";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface AlertConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error" | "confirm";
  onConfirm: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function AlertConfirmModal({
  isOpen,
  title,
  message,
  type = "info",
  onConfirm,
  onCancel,
  confirmLabel = "Aceptar",
  cancelLabel = "Cancelar",
}: AlertConfirmModalProps) {
  if (!isOpen) return null;

  const isConfirm = type === "confirm";

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-6 h-6 text-emerald-400" />;
      case "error":
        return <AlertCircle className="w-6 h-6 text-rose-500" />;
      case "warning":
        return <AlertCircle className="w-6 h-6 text-amber-500" />;
      case "confirm":
        return <AlertCircle className="w-6 h-6 text-indigo-400" />;
      default:
        return <Info className="w-6 h-6 text-accent" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-sm overflow-hidden bg-card border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/90 font-sans text-white flex flex-col gap-4"
        >
          <div className="flex items-start gap-4">
            <div className="shrink-0 p-2 bg-white/5 rounded-xl border border-white/5">
              {getIcon()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                {title}
              </h3>
              <p className="text-xs text-[#84849b] font-bold leading-relaxed mt-2 whitespace-pre-wrap">
                {message}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 border-t border-white/5 pt-4">
            {isConfirm && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 hover:bg-white/5 border border-white/10 rounded-[3px] text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-all cursor-pointer"
              >
                {cancelLabel}
              </button>
            )}
            <button
              type="button"
              onClick={onConfirm}
              className={`px-5 py-2.5 rounded-[3px] text-[10px] font-black uppercase tracking-widest text-white transition-all cursor-pointer ${
                type === "error"
                  ? "bg-rose-600 hover:bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                  : type === "confirm"
                    ? "bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                    : "bg-accent hover:bg-accent/90 shadow-[0_0_15px_rgba(217,70,239,0.3)]"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
