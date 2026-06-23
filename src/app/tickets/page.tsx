"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  MessageSquare,
  Plus,
  Calendar,
  AlertCircle,
  Inbox,
  X,
  RefreshCw,
  Ticket,
} from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { getTicketSocket } from "@/features/tickets/infrastructure/ticketSocket";
import type { OrderTicket } from "@/features/tickets/domain/types";
import { TicketChat } from "@/features/tickets/ui/TicketChat";
import { AdminSelect } from "@/shared/components/AdminSelect";

interface Order {
  id: string;
  createdAt: string;
  status: string;
  type: "BUY" | "SELL";
  totalPrice: number;
}

function UserTicketsPageContent() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTicketId = searchParams.get("ticket");
  const requestedOrderId = searchParams.get("orderId");

  // Auth and profile state
  const [profile, setProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Tickets and orders state
  const [tickets, setTickets] = useState<OrderTicket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<OrderTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED">("ALL");
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Check login
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetchWithAuth(`${BACKEND_URL}/users/me`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (e) {
        console.error("Error fetching user profile", e);
      } finally {
        setAuthLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Fetch orders for dropdown
  const loadOrders = useCallback(async () => {
    if (!profile) return;
    setOrdersLoading(true);
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/orders/me`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Error loading user orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  }, [profile]);

  // Fetch tickets list
  const loadTickets = useCallback(async (silent = false) => {
    if (!profile) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/tickets/me`, {
        headers: { "X-Ticket-Actor": "USER" },
      });
      if (!response.ok) throw new Error(t("tickets.error.load"));
      const data: OrderTicket[] = await response.json();
      setTickets(data);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("tickets.error.load"));
    } finally {
      setLoading(false);
    }
  }, [profile, t]);

  useEffect(() => {
    if (profile) {
      loadTickets();
      loadOrders();
    }
  }, [profile, loadTickets, loadOrders]);

  // Effect to select ticket from query params
  useEffect(() => {
    if (requestedTicketId && tickets.length > 0) {
      const found = tickets.find((t) => t.id === requestedTicketId);
      if (found) {
        setSelected(found);
      }
    } else if (!requestedTicketId) {
      setSelected(null);
    }
  }, [requestedTicketId, tickets]);

  // Effect to open create form if orderId is in query params
  useEffect(() => {
    if (requestedOrderId) {
      setShowCreateForm(true);
      setSelectedOrderId(requestedOrderId);
    }
  }, [requestedOrderId]);

  // Socket integration for ticket updates
  const loadTicketsRef = useRef(loadTickets);
  useEffect(() => {
    loadTicketsRef.current = loadTickets;
  }, [loadTickets]);

  useEffect(() => {
    if (!profile) return;
    let socketRef: any = null;
    let cancelled = false;

    const handleUpdate = () => {
      loadTicketsRef.current(true);
    };

    const connect = async () => {
      try {
        const socket = await getTicketSocket("USER");
        if (cancelled) return;
        socketRef = socket;
        socket.on("ticket:updated", handleUpdate);
      } catch {
        console.error("Could not connect to live tickets socket");
      }
    };
    connect();

    return () => {
      cancelled = true;
      if (socketRef) {
        socketRef.off("ticket:updated", handleUpdate);
      }
    };
  }, [profile]);

  // Handle ticket selection
  const handleSelectTicket = (ticket: OrderTicket) => {
    setSelected(ticket);
    const params = new URLSearchParams(window.location.search);
    params.set("ticket", ticket.id);
    params.delete("orderId");
    router.replace(`/tickets?${params.toString()}`);
  };

  // Close ticket chat modal
  const handleCloseChat = () => {
    setSelected(null);
    const params = new URLSearchParams(window.location.search);
    params.delete("ticket");
    router.replace(`/tickets?${params.toString()}`);
  };

  // Open ticket creation form
  const handleNewTicketClick = () => {
    setShowCreateForm(true);
    setFormError(null);
    if (orders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(orders[0].id);
    }
  };

  // Submit new ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setFormError("Debes seleccionar una orden válida.");
      return;
    }
    if (subject.trim().length < 3 || subject.trim().length > 120) {
      setFormError("El asunto debe tener entre 3 y 120 caracteres.");
      return;
    }
    if (!message.trim() || message.trim().length > 2000) {
      setFormError("El mensaje no puede estar vacío ni superar los 2000 caracteres.");
      return;
    }

    setCreating(true);
    setFormError(null);
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/tickets`, {
        method: "POST",
        headers: { "X-Ticket-Actor": "USER" },
        body: JSON.stringify({
          orderId: selectedOrderId,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error === "OPEN_TICKET_LIMIT" ? t("tickets.error.limit") : t("tickets.error.create"));
      }

      setSubject("");
      setMessage("");
      setShowCreateForm(false);
      
      // Clear orderId from query params
      const params = new URLSearchParams(window.location.search);
      params.delete("orderId");
      router.replace(`/tickets?${params.toString()}`);

      await loadTickets(true);
      if (data) {
        handleSelectTicket(data);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : t("tickets.error.create"));
    } finally {
      setCreating(false);
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter === "ALL") return true;
    return ticket.status === statusFilter;
  });

  // Map orders to AdminSelect options format
  const orderOptions = orders.map((order) => ({
    value: order.id,
    label: `${order.type === "BUY" ? "Compra" : "Venta"} #${order.id.slice(0, 8)} — $${order.totalPrice.toLocaleString()} USD`,
  }));

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-28 text-white font-sans">
        <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
        <p className="text-xs text-[#8984a1] font-bold uppercase tracking-widest">{t("common.loading")}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20 text-white min-h-screen font-sans flex flex-col justify-center items-center">
        <div className="text-center py-20 px-8 bg-[#110f1e]/40 border border-white/5 rounded-2xl max-w-md w-full backdrop-blur-sm">
          <AlertCircle className="w-12 h-12 text-accent/80 mx-auto mb-4" />
          <h2 className="text-lg font-black uppercase tracking-tight text-white mb-2">Inicia Sesión Requerido</h2>
          <p className="text-sm text-[#8984a1] mb-6">
            Por favor, inicia sesión con tu cuenta de Steam para acceder al centro de soporte y revisar tus tickets.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-20 text-white min-h-screen font-sans relative">
      {/* Background radial glow */}
      <div className="absolute top-20 left-1/4 -z-10 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
      <div className="absolute bottom-20 right-1/4 -z-10 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <Ticket className="w-8 h-8 text-accent animate-pulse" />
            {t("nav.tickets")}
          </h1>
          <p className="text-sm text-[#8984a1] mt-1.5 font-medium">
            Revisa y administra tus consultas de soporte asociadas a compras o ventas en curso.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => loadTickets()}
            disabled={loading}
            className="flex items-center justify-center gap-2 h-10 px-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl text-xs font-bold text-white transition-all duration-300 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-accent" : ""}`} />
            <span className="hidden sm:inline">{t("common.refresh")}</span>
          </button>
          
          <button
            type="button"
            onClick={handleNewTicketClick}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-black uppercase text-white shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:bg-accent/90 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <Plus className="h-4 w-4" />
            {t("tickets.openTicket")}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3.5 rounded-xl text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Main Area: Split Form / List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT/MAIN SPAN: Tickets List */}
        <div className="order-2 lg:order-1 lg:col-span-2 rounded-2xl border border-white/5 bg-[#110f1e]/40 overflow-hidden min-h-[380px] flex flex-col backdrop-blur-md shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
          
          {/* Ticket List Filter */}
          <div className="flex bg-[#110f1e]/90 border-b border-white/5 p-4 shrink-0 gap-4 items-center justify-between flex-wrap z-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8984a1]">Lista de tickets</span>
            <div className="flex bg-[#0d0b16] border border-white/5 p-1 rounded-full">
              {(["ALL", "OPEN", "CLOSED"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-1.5 text-[8.5px] font-black uppercase tracking-wider rounded-full transition-all duration-300 text-center cursor-pointer ${
                    statusFilter === status
                      ? "bg-accent text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  {status === "ALL"
                    ? "Todos"
                    : status === "OPEN"
                    ? t("tickets.status.open")
                    : t("tickets.status.closed")}
                </button>
              ))}
            </div>
          </div>

          {loading && tickets.length === 0 ? (
            <div className="flex items-center justify-center py-24 flex-1">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-24 px-6 flex-1 flex flex-col justify-center items-center relative z-10">
              <div className="absolute w-48 h-48 bg-accent/5 rounded-full blur-3xl -z-10" />
              <Inbox className="w-16 h-16 text-white/10 mb-4 animate-pulse" />
              <p className="text-xs font-black uppercase tracking-widest text-white/50">
                {t("tickets.noTickets")}
              </p>
              <p className="text-[11px] text-[#8984a1] mt-2 max-w-xs mx-auto leading-relaxed">
                No tienes consultas registradas bajo este filtro en este momento.
              </p>
            </div>
          ) : (
            <div className="p-4 sm:p-5 max-h-[600px] overflow-y-auto custom-scrollbar flex flex-col gap-3.5 z-10">
              {filteredTickets.map((ticket) => {
                const isSelected = selected?.id === ticket.id;
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => handleSelectTicket(ticket)}
                    className={`w-full cursor-pointer p-4 text-left transition-all duration-300 rounded-xl border flex items-center justify-between gap-4 relative overflow-hidden group backdrop-blur-sm
                      ${
                        isSelected
                          ? "bg-[#211c33]/65 border-accent/40 shadow-[0_4px_25px_rgba(217,70,239,0.12)] scale-[1.01]"
                          : "bg-[#211c33]/15 border-white/5 hover:border-white/10 hover:bg-[#211c33]/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:translate-x-1"
                      }`}
                  >
                    {/* Visual left bar marker */}
                    <div className={`absolute top-0 bottom-0 left-0 w-1.5 transition-all duration-300 ${
                      isSelected ? "bg-accent" : "bg-transparent group-hover:bg-white/15"
                    }`} />

                    <div className="min-w-0 flex-1 space-y-2.5 pl-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-xs sm:text-sm font-black tracking-wide transition-colors ${isSelected ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                          {ticket.subject}
                        </span>
                        {ticket.unreadCount > 0 && (
                          <span className="rounded-full bg-accent px-2 py-0.5 text-[8px] font-black text-white shrink-0 shadow-[0_0_12px_rgba(217,70,239,0.5)] animate-pulse">
                            {ticket.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono text-white/40">
                        <span className={`px-2 py-0.5 rounded-[4px] border text-[8px] font-bold uppercase tracking-wider ${
                          ticket.order?.type === "BUY" 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.05)]" 
                            : "bg-purple-500/10 border-purple-500/20 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.05)]"
                        }`}>
                          {ticket.order?.type === "BUY" ? "Compra" : "Venta"}
                        </span>
                        <span>·</span>
                        <span className="font-semibold text-white/50 bg-white/5 px-1.5 py-0.5 rounded select-all">#{ticket.orderId.slice(0, 8)}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1.5 text-white/35 font-sans">
                          <Calendar className="w-3 h-3 text-[#8984a1]/60" />
                          {new Date(ticket.createdAt).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span
                        className={`rounded-full border px-3 py-1 text-[8.5px] font-black uppercase tracking-wider transition-all duration-300 ${
                          ticket.status === "OPEN"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                            : "border-white/10 bg-white/5 text-white/30"
                        }`}
                      >
                        {ticket.status === "OPEN" ? t("tickets.status.open") : t("tickets.status.closed")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT SPAN: Inline Create Ticket Form */}
        <AnimatePresence mode="wait">
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="order-1 lg:order-2 lg:col-span-1 rounded-2xl border border-white/10 bg-[#211c33]/40 p-6 space-y-5 shadow-2xl backdrop-blur-md relative overflow-hidden"
            >
              {/* Form border accent lines */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent/0 via-accent/40 to-accent/0" />

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  {t("tickets.openTicket")}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    // Clear query param
                    const params = new URLSearchParams(window.location.search);
                    params.delete("orderId");
                    router.replace(`/tickets?${params.toString()}`);
                  }}
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

              <form onSubmit={handleCreateTicket} className="space-y-4">
                {/* Order Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#8984a1]">
                    Orden Relacionada
                  </label>
                  {ordersLoading ? (
                    <div className="flex items-center gap-2 py-2 text-xs text-white/55">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                      <span>Cargando tus órdenes...</span>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="p-3 bg-orange-500/5 border border-orange-500/15 rounded-xl text-[10px] text-orange-300 font-bold uppercase tracking-wider flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                      <p>No tienes compras ni ventas en tu historial para abrir un ticket.</p>
                    </div>
                  ) : (
                    <AdminSelect
                      value={selectedOrderId}
                      onChange={setSelectedOrderId}
                      options={orderOptions}
                      className="w-full"
                      buttonClassName="w-full px-4 py-3 bg-white/[0.02] border border-white/5 hover:border-white/10 focus:border-accent/40 rounded-xl text-xs text-white outline-none transition-all duration-300 flex items-center justify-between gap-2 cursor-pointer font-bold"
                      menuClassName="absolute left-0 top-full mt-2 w-full bg-[#110f1e] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-40 backdrop-blur-xl"
                      optionClassName="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    />
                  )}
                </div>

                {/* Subject */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#8984a1]">
                    Asunto
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value.slice(0, 120))}
                    placeholder={t("tickets.subjectPlaceholder")}
                    className="w-full px-4 py-3 bg-white/[0.02] border border-white/5 hover:border-white/10 focus:border-accent/40 rounded-xl text-xs text-white placeholder-white/20 outline-none transition-all duration-300"
                    required
                  />
                </div>

                {/* Message */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#8984a1]">
                    Mensaje Inicial
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
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
          )}
        </AnimatePresence>
      </div>

      {/* FULLSCREEN CHAT PORTAL (MODAL) */}
      {selected && createPortal(
        <div className="fixed inset-0 z-[120] flex h-dvh flex-col bg-[#070510]">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#0f0d1e] px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-[9.5px] font-mono text-white/40">
                Referencia: <span className="text-white select-all">#{selected.orderId}</span> · <span className={selected.order?.type === "BUY" ? "text-emerald-400" : "text-purple-400"}>{selected.order?.type === "BUY" ? "Compra" : "Venta"}</span>
              </p>
              <h2 className="truncate text-sm font-black text-white sm:text-base">{selected.subject}</h2>
            </div>
            <button
              type="button"
              onClick={handleCloseChat}
              className="shrink-0 cursor-pointer rounded-full bg-white/10 p-2.5 text-white hover:bg-white/15 transition-all duration-300"
              aria-label={t("common.close")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Chat Body */}
          <div className="min-h-0 flex-1">
            <TicketChat
              ticket={selected}
              actor="USER"
              onTicketUpdated={() => loadTickets(true)}
              fullscreen
            />
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

export default function UserTicketsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen pt-28 text-white font-sans">
        <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
        <p className="text-xs text-[#8984a1] font-bold uppercase tracking-widest">Cargando...</p>
      </div>
    }>
      <UserTicketsPageContent />
    </Suspense>
  );
}
