"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { getTicketSocket } from "@/features/tickets/infrastructure/ticketSocket";
import type { OrderTicket } from "@/features/tickets/domain/types";
import type { Order } from "@/features/tickets/types";

export type TicketStatusFilter = "ALL" | "OPEN" | "CLOSED";

export function useUserTickets() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTicketId = searchParams.get("ticket");
  const requestedOrderId = searchParams.get("orderId");

  const [profile, setProfile] = useState<unknown>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tickets, setTickets] = useState<OrderTicket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<OrderTicket | null>(null);
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
    fetchProfile();
  }, []);

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
      if (!silent) setLoading(true);
      setError(null);
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/tickets/me`, {
          headers: { "X-Ticket-Actor": "USER" },
        });
        if (!response.ok) throw new Error(t("tickets.error.load"));
        setTickets(await response.json());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t("tickets.error.load"));
      } finally {
        setLoading(false);
      }
    },
    [profile, t],
  );

  useEffect(() => {
    if (profile) {
      const timeoutId = window.setTimeout(() => {
        loadTickets();
        loadOrders();
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [profile, loadTickets, loadOrders]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (requestedTicketId && tickets.length > 0) {
        const found = tickets.find((ticket) => ticket.id === requestedTicketId);
        if (found) setSelected(found);
      } else if (!requestedTicketId) {
        setSelected(null);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [requestedTicketId, tickets]);

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
    const handleUpdate = () => loadTicketsRef.current(true);

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
      socketRef?.off("ticket:updated", handleUpdate);
    };
  }, [profile]);

  const handleSelectTicket = (ticket: OrderTicket) => {
    setSelected(ticket);
    const params = new URLSearchParams(window.location.search);
    params.set("ticket", ticket.id);
    params.delete("orderId");
    router.replace(`/tickets?${params.toString()}`);
  };

  const handleCloseChat = () => {
    setSelected(null);
    const params = new URLSearchParams(window.location.search);
    params.delete("ticket");
    router.replace(`/tickets?${params.toString()}`);
  };

  const handleNewTicketClick = () => {
    setShowCreateForm(true);
    setFormError(null);
    if (orders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(orders[0].id);
    }
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
    const params = new URLSearchParams(window.location.search);
    params.delete("orderId");
    router.replace(`/tickets?${params.toString()}`);
  };

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
