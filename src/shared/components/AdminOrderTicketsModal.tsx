"use client";

import React, { useEffect, useState } from "react";
import { X, MessageSquare, Plus, Loader2, MessageCircle } from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";

interface AdminOrderTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderType: string;
  orderPrice: number;
}

interface Ticket {
  id: string;
  subject: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  updatedAt: string;
}

export function AdminOrderTicketsModal({
  isOpen,
  onClose,
  orderId,
  orderType,
  orderPrice,
}: AdminOrderTicketsModalProps) {
  const { t } = useI18n();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/tickets/admin?orderId=${orderId}`);
        if (response.ok) {
          const data = await response.json();
          setTickets(data);
          // If no tickets exist, automatically show create form
          setShowCreate(data.length === 0);
        } else {
          setError(t("admin.tickets.errorLoad") || "Error al cargar los tickets de esta orden.");
        }
      } catch (err) {
        console.error(err);
        setError(t("admin.tickets.errorConnection") || "Error al conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [isOpen, orderId, t]);

  if (!isOpen) return null;

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim().length < 3 || subject.trim().length > 120) {
      setError(t("admin.tickets.subjectLengthError") || "El asunto debe tener entre 3 y 120 caracteres.");
      return;
    }
    if (!message.trim() || message.trim().length > 2000) {
      setError(t("admin.tickets.messageEmptyError") || "El mensaje no puede estar vacío.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/tickets`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Ticket-Actor": "ADMIN"
        },
        body: JSON.stringify({
          orderId,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t("admin.tickets.createError") || "Error al crear el ticket.");
      }

      // Redirect to the chat page for this ticket
      window.location.href = `/admin/panel/tickets?ticket=${data.id}`;
    } catch (err: any) {
      setError(err.message || t("admin.tickets.genericError") || "Ocurrió un error al crear el ticket.");
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-lg bg-[#0c0a15] border border-white/10 rounded-[3px] shadow-2xl p-6 sm:p-7 text-white z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-accent" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                {t("admin.tickets.modalTitle") || "Soporte / Chat de Orden"}
              </h3>
              <p className="text-[10px] text-[#84849b] font-mono mt-0.5">
                {orderType === "BUY" ? (t("admin.tickets.typeBuy") || "Compra") : (t("admin.tickets.typeSell") || "Venta")} #{orderId.slice(0, 8)} - ${orderPrice.toFixed(2)} USD
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-bold rounded-[3px]">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-accent mb-2" />
              <p className="text-xs text-[#84849b] font-bold uppercase tracking-wider">{t("admin.tickets.loading") || "Cargando tickets..."}</p>
            </div>
          ) : (
            <>
              {/* Existing tickets list */}
              {!showCreate && tickets.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-[#84849b] tracking-wider font-mono">
                      {t("admin.tickets.existingTickets", { count: tickets.length }) || `Tickets existentes (${tickets.length})`}
                    </span>
                    <button
                      onClick={() => {
                        setShowCreate(true);
                        setError(null);
                      }}
                      className="px-2.5 py-1 bg-accent/15 border border-accent/30 text-accent rounded-[3px] text-[10px] font-black uppercase tracking-wider hover:bg-accent/25 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> {t("admin.tickets.newTicket") || "Nuevo Ticket"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {tickets.map((tItem) => (
                      <div 
                        key={tItem.id} 
                        className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-[3px] transition-all"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-bold text-white/90 truncate block">
                              {tItem.subject}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded-[3px] text-[8px] font-black tracking-wider uppercase ${
                              tItem.status === "OPEN" 
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                : "bg-white/10 text-white/40 border border-white/10"
                            }`}>
                              {tItem.status === "OPEN" ? (t("tickets.status.open") || "Abierto") : (t("tickets.status.closed") || "Cerrado")}
                            </span>
                          </div>
                          <span className="text-[9px] text-[#84849b] font-mono">
                            {t("admin.tickets.createdAt")} {new Date(tItem.createdAt).toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            window.location.href = `/admin/panel/tickets?ticket=${tItem.id}`;
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/20 text-white text-[10px] font-black uppercase rounded-[3px] transition-all cursor-pointer flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          {t("admin.tickets.chat")}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Create new ticket form */}
              {showCreate && (
                <form onSubmit={handleCreateTicket} className="space-y-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase text-[#84849b] tracking-wider font-mono">
                      {t("admin.tickets.openNewTicket") || "Abrir Nuevo Ticket de Soporte"}
                    </span>
                    {tickets.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreate(false);
                          setError(null);
                        }}
                        className="text-[10px] font-bold text-accent hover:underline cursor-pointer"
                      >
                        {t("admin.tickets.viewExisting") || "Ver tickets existentes"}
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black tracking-wider text-[#84849b]">
                      {t("admin.tickets.subject") || "Asunto"}
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder={t("admin.tickets.subjectPlaceholder") || "Ej. Problema con la cotización / transferencia"}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full h-10 bg-black/40 border border-white/10 hover:border-white/20 focus:border-accent/40 rounded-[3px] text-xs px-3 text-white outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black tracking-wider text-[#84849b]">
                      {t("admin.tickets.message") || "Primer Mensaje / Detalles"}
                    </label>
                    <textarea 
                      required
                      rows={4}
                      placeholder={t("admin.tickets.messagePlaceholder") || "Escribe el mensaje detallado para el usuario aquí..."}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-accent/40 rounded-[3px] text-xs p-3 text-white outline-none transition-colors resize-none"
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={creating}
                      className="flex-1 h-11 bg-accent text-white text-xs font-black uppercase tracking-widest rounded-[3px] transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t("admin.tickets.creating") || "Creando..."}
                        </>
                      ) : (
                        t("admin.tickets.createAndOpen") || "Crear y Abrir Chat"
                      )}
                    </button>
                    {tickets.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreate(false);
                          setError(null);
                        }}
                        className="h-11 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-[3px] text-xs font-black uppercase transition-all cursor-pointer"
                      >
                        {t("common.cancel") || "Cancelar"}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
