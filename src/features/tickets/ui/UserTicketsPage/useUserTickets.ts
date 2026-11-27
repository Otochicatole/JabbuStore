"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { getTicketSocket } from "@/features/tickets/infrastructure/ticketSocket";
import type { OrderTicket } from "@/features/tickets/domain/types";
import type { Order } from "@/features/tickets/types";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";

export type TicketStatusFilter = "ALL" | "OPEN" | "CLOSED";

function syncUserTicketParamsShallow(
  basePath: string,
  mutator: (params: URLSearchParams) => void,
) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  mutator(params);
  const query = params.toString();
  window.history.replaceState(window.history.state, "", query ? `${basePath}?${query}` : basePath);
}

export function useUserTickets() {
  const { t, locale } = useI18n();
  const localizePath = useLocalizedPath();
  const searchParams = useSearchParams();
  const requestedTicketId = searchParams.get("ticket");
  const requestedOrderId = searchParams.get("orderId");

  const [profile, setProfile] = useState<unknown>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tickets, setTickets] = useState<OrderTicket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(() => requestedTicketId);
  const [fallbackTicket, setFallbackTicket] = useState<OrderTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatusFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchSeqRef = useRef(0);
  const prevExternalTicketIdRef = useRef<string | null>(requestedTicketId);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetchWithAuth(`${BACKEND_URL}/users/me`);
        if (res.ok) {
          setProfile(await res.json());
        }
      } catch (e) {
        console.error("Error fetching user profile", e);
      } finally {
        setAuthLoading(false);
      }
    };
    void fetchProfile();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const nextTicket = new URLSearchParams(window.location.search).get("ticket");
      prevExternalTicketIdRef.current = nextTicket;
      setSelectedId(nextTicket);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (requestedTicketId === prevExternalTicketIdRef.current) return;
    prevExternalTicketIdRef.current = requestedTicketId;
    const timeoutId = window.setTimeout(() => {
      setSelectedId(requestedTicketId);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [requestedTicketId]);

  const loadOrders = useCallback(async () => {
    if (!profile) return;
    setOrdersLoading(true);
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/orders/me`);
      if (response.ok) {
        setOrders(await response.json());
      }
    } catch (err) {
      console.error("Error loading user orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  }, [profile]);

  const loadTickets = useCallback(
    async (silent = false) => {
      if (!profile) return;
      const seq = ++fetchSeqRef.current;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/tickets/me`, {
          headers: { "X-Ticket-Actor": "USER" },
        });
        if (!response.ok) throw new Error(t("tickets.error.load"));
        const data: OrderTicket[] = await response.json();
        if (seq !== fetchSeqRef.current) return;
        setTickets(data);
      } catch (err: unknown) {
        if (seq !== fetchSeqRef.current) return;
        if (!silent) {
          setError(err instanceof Error ? err.message : t("tickets.error.load"));
        }
      } finally {
        if (!silent && seq === fetchSeqRef.current) {
          setLoading(false);
        }
      }
    },
    [profile, t],
  );

  useEffect(() => {
    if (profile) {
      const timeoutId = window.setTimeout(() => {
        void loadTickets(false);
        void loadOrders();
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [profile, loadTickets, loadOrders]);

  useEffect(() => {
    if (requestedOrderId) {
      const timeoutId = window.setTimeout(() => {
        setShowCreateForm(true);
        setSelectedOrderId(requestedOrderId);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [requestedOrderId]);

  const loadTicketsRef = useRef(loadTickets);
  useEffect(() => {
    loadTicketsRef.current = loadTickets;
  }, [loadTickets]);

  useEffect(() => {
    if (!profile) return;
    let socketRef: Awaited<ReturnType<typeof getTicketSocket>> | null = null;
    let cancelled = false;
    const handleUpdate = () => void loadTicketsRef.current(true);
    const handleReadState = (payload?: { ticketId?: string; actor?: string }) => {
      if (!payload?.ticketId || payload.actor !== "USER") return;
      setTickets((prev) =>
        prev.some((item) => item.id === payload.ticketId && item.unreadCount > 0)
          ? prev.map((item) =>
              item.id === payload.ticketId ? { ...item, unreadCount: 0 } : item,
            )
          : prev,
      );
    };

    const connect = async () => {
      try {
        const socket = await getTicketSocket("USER");
        if (cancelled) return;
        socketRef = socket;
        socket.on("ticket:updated", handleUpdate);
        socket.on("ticket:read_state", handleReadState);
      } catch {
        console.error("Could not connect to live tickets socket");
      }
    };

    void connect();
    return () => {
      cancelled = true;
      socketRef?.off("ticket:updated", handleUpdate);
      socketRef?.off("ticket:read_state", handleReadState);
    };
  }, [profile]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return (
      tickets.find((ticket) => ticket.id === selectedId) ??
      (fallbackTicket?.id === selectedId ? fallbackTicket : null)
    );
  }, [fallbackTicket, selectedId, tickets]);

  const handleSelectTicket = useCallback(
    (ticket: OrderTicket) => {
      const cleanTicket = ticket.unreadCount > 0 ? { ...ticket, unreadCount: 0 } : ticket;
      setSelectedId(ticket.id);
      setFallbackTicket(cleanTicket);
      if (ticket.unreadCount > 0) {
        setTickets((prev) =>
          prev.map((item) => (item.id === ticket.id ? { ...item, unreadCount: 0 } : item)),
        );
      }
      syncUserTicketParamsShallow(localizePath("/tickets"), (params) => {
        params.set("ticket", ticket.id);
        params.delete("orderId");
      });
    },
    [localizePath],
  );

  const handleCloseChat = useCallback(() => {
    setSelectedId(null);
    setFallbackTicket(null);
    syncUserTicketParamsShallow(localizePath("/tickets"), (params) => {
      params.delete("ticket");
    });
  }, [localizePath]);

  const handleNewTicketClick = () => {
    setShowCreateForm(true);
    setFormError(null);
    if (orders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(orders[0].id);
    }
  };

  const handleCloseCreateForm = useCallback(() => {
    setShowCreateForm(false);
    syncUserTicketParamsShallow(localizePath("/tickets"), (params) => {
      params.delete("orderId");
    });
  }, [localizePath]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setFormError("Debes seleccionar una orden valida.");
      return;
    }
    if (subject.trim().length < 3 || subject.trim().length > 120) {
      setFormError("El asunto debe tener entre 3 y 120 caracteres.");
      return;
    }
    if (!message.trim() || message.trim().length > 2000) {
      setFormError("El mensaje no puede estar vacio ni superar los 2000 caracteres.");
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
        throw new Error(
          data?.error === "OPEN_TICKET_LIMIT"
            ? t("tickets.error.limit")
            : t("tickets.error.create"),
        );
      }

      setSubject("");
      setMessage("");
      handleCloseCreateForm();
      await loadTickets(true);
      if (data) handleSelectTicket(data);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : t("tickets.error.create"));
    } finally {
      setCreating(false);
    }
  };

  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        if (statusFilter === "ALL") return true;
        return ticket.status === statusFilter;
      }),
    [statusFilter, tickets],
  );

  const orderOptions = useMemo(
    () =>
      orders.map((order) => ({
        value: order.id,
        label: `${order.type === "BUY" ? "Compra" : "Venta"} #${order.id.slice(0, 8)} - $${order.totalPrice.toLocaleString()} USD`,
      })),
    [orders],
  );

  return {
    authLoading,
    creating,
    error,
    filteredTickets,
    formError,
    handleCloseChat,
    handleCloseCreateForm,
    handleCreateTicket,
    handleNewTicketClick,
    handleSelectTicket,
    loadTickets,
    loading,
    locale,
    message,
    orderOptions,
    orders,
    ordersLoading,
    profile,
    selected,
    selectedOrderId,
    setMessage,
    setSelectedOrderId,
    setStatusFilter,
    setSubject,
    showCreateForm,
    statusFilter,
    subject,
    t,
    tickets,
  };
}
