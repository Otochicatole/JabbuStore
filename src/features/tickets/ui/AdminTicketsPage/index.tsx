"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, MessageSquare, RefreshCw, X } from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import type { OrderTicket, TicketStatus } from "../../domain/types";
import { getTicketSocket } from "../../infrastructure/ticketSocket";
import { TicketChat } from "../TicketChat";
import {
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminEmptyState,
  AdminHeader,
  AdminSearchInput,
  AdminStatusTabs,
} from "@/features/admin/ui/AdminShell";

export function AdminTicketsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const localizePath = useLocalizedPath();
  const searchParams = useSearchParams();
  const requestedTicketId = searchParams.get("ticket");

  const [tickets, setTickets] = useState<OrderTicket[]>([]);
  const [selected, setSelected] = useState<OrderTicket | null>(null);
  const [status, setStatus] = useState("OPEN");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status !== "ALL") params.set("status", status);
      if (search.trim()) params.set("search", search.trim());
      const response = await fetchWithAuth(`${BACKEND_URL}/tickets/admin?${params}`, {
        headers: { "X-Ticket-Actor": "ADMIN" },
      });
      if (!response.ok) throw new Error(t("tickets.error.load"));
      const data: OrderTicket[] = await response.json();
      setTickets(data);
    } catch (err: unknown) {
      if (!silent) {
        setError(err instanceof Error ? err.message : t("tickets.error.load"));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search, status, t]);

  const refreshTicketsSilently = useCallback(() => {
    void loadTickets(true);
  }, [loadTickets]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadTickets(false), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadTickets]);

  const loadTicketsRef = useRef(loadTickets);
  useEffect(() => {
    loadTicketsRef.current = loadTickets;
  }, [loadTickets]);

  useEffect(() => {
    let socketRef: Awaited<ReturnType<typeof getTicketSocket>> | null = null;
    let cancelled = false;

    const handleUpdate = () => {
      void loadTicketsRef.current(true);
    };

    const connect = async () => {
      try {
        const socket = await getTicketSocket("ADMIN");
        if (cancelled) return;
        socketRef = socket;
        socket.on("ticket:updated", handleUpdate);
      } catch (err) {
        console.warn("[AdminTicketsPage] Realtime socket unavailable:", err);
      }
    };
    void connect();

    return () => {
      cancelled = true;
      if (socketRef) {
        socketRef.off("ticket:updated", handleUpdate);
      }
    };
  }, []);

  const changeStatus = async (nextStatus: TicketStatus) => {
    if (!selected) return;
    setUpdating(true);
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/tickets/admin/${selected.id}/status`, {
        method: "PATCH",
        headers: { "X-Ticket-Actor": "ADMIN" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) throw new Error(t("tickets.error.status"));
      setSelected({ ...selected, status: nextStatus });
      await loadTickets(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("tickets.error.status"));
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const syncSelectedTicket = async () => {
      if (!requestedTicketId) {
        setSelected(null);
        return;
      }

      const found = tickets.find((item) => item.id === requestedTicketId);
      if (found) {
        setSelected((current) => {
          if (
            current &&
            current.id === found.id &&
            current.status === found.status &&
            current.updatedAt === found.updatedAt &&
            current.unreadCount === found.unreadCount
          ) {
            return current;
          }
          return found;
        });
        return;
      }

      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/tickets/${requestedTicketId}`, {
          headers: { "X-Ticket-Actor": "ADMIN" },
        });
        if (response.ok) {
          const data: OrderTicket = await response.json();
          setSelected((current) => {
            if (
              current &&
              current.id === data.id &&
              current.status === data.status &&
              current.updatedAt === data.updatedAt
            ) {
              return current;
            }
            return data;
          });
        }
      } catch (err) {
        console.error("Failed to fetch requested ticket:", err);
      }
    };

    void syncSelectedTicket();
  }, [requestedTicketId, tickets]);

  const handleSelectTicket = (ticket: OrderTicket) => {
    setSelected(ticket);
    const params = new URLSearchParams(window.location.search);
    params.set("ticket", ticket.id);
    router.replace(`${localizePath("/admin/panel/tickets")}?${params.toString()}`, {
      scroll: false,
    });
  };

  const closeTicket = useCallback(() => {
    setSelected(null);
    const params = new URLSearchParams(window.location.search);
    params.delete("ticket");
    router.replace(`${localizePath("/admin/panel/tickets")}?${params.toString()}`, {
      scroll: false,
    });
  }, [localizePath, router]);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTicket();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, closeTicket]);

  const statusTabs = useMemo(
    () => [
      { value: "OPEN", label: t("tickets.status.open") },
      { value: "CLOSED", label: t("tickets.status.closed") },
      { value: "ALL", label: t("tickets.status.all") },
    ],
    [t],
  );

  return (
    <div className="space-y-4">
      <AdminHeader
        title={t("tickets.adminTitle")}
        description={t("tickets.adminDescription")}
        icon={MessageSquare}
        actions={
          <AdminButton
            type="button"
            onClick={() => void loadTickets(false)}
            disabled={loading}
            loading={loading}
            icon={RefreshCw}
            variant="secondary"
          >
            {t("common.refresh")}
          </AdminButton>
        }
      />

      <div className="flex flex-col gap-2 rounded-lg border border-white/[0.07] bg-[#141124] p-1.5 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <AdminStatusTabs
          items={statusTabs}
          value={status}
          onChange={setStatus}
          className="border-0 bg-transparent p-0"
        />

        <AdminSearchInput
          value={search}
          onChange={setSearch}
          placeholder={t("tickets.searchPlaceholder")}
          className="lg:max-w-md"
        />
      </div>

      {error && <AdminAlert>{error}</AdminAlert>}

      {/* Master-Detail Workspace on Desktop, List + Sheet on Mobile */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Ticket Queue List */}
        <div className="flex h-[320px] lg:h-[clamp(440px,calc(100dvh-268px),700px)] min-w-0 flex-col overflow-hidden rounded-lg border border-white/[0.07] bg-[#141124]">
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-[#9e98b6]">
              {t("tickets.noTickets")}
            </div>
          ) : (
            <div className="min-h-0 flex-1 divide-y divide-white/[0.05] overflow-y-auto custom-scrollbar">
              {tickets.map((ticket) => {
                const isSelected = selected?.id === ticket.id;
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => handleSelectTicket(ticket)}
                    className={`w-full cursor-pointer p-4 text-left transition-colors ${
                      isSelected
                        ? "bg-accent/15 ring-1 ring-inset ring-accent/40"
                        : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-white">
                        {ticket.subject}
                      </span>
                      {ticket.unreadCount > 0 && (
                        <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white tabular-nums">
                          {ticket.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs text-[#9e98b6]">
                      {ticket.user?.name || t("admin.common.unknownUser")}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono text-[#8e88a6] tabular-nums">
                        {ticket.order.type} · #{ticket.orderId.slice(0, 8)}
                      </span>
                      <AdminBadge tone={ticket.status === "OPEN" ? "success" : "neutral"}>
                        {t(`tickets.status.${ticket.status.toLowerCase()}`)}
                      </AdminBadge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Inline Conversation Pane */}
        <div className="hidden lg:h-[clamp(440px,calc(100dvh-268px),700px)] min-w-0 flex-col overflow-hidden rounded-lg border border-white/[0.07] bg-[#141124] lg:flex">
          {selected ? (
            <>
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-[#1a1630] px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-mono text-xs text-[#9e98b6] tabular-nums">
                      {t("tickets.orderReference")}:{" "}
                      <span className="text-white">{selected.orderId}</span> · {selected.order.type}
                    </p>
                    <AdminBadge tone={selected.status === "OPEN" ? "success" : "neutral"}>
                      {t(`tickets.status.${selected.status.toLowerCase()}`)}
                    </AdminBadge>
                  </div>
                  <h3 className="mt-0.5 truncate text-base font-semibold text-white">
                    {selected.subject}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-[#9e98b6]">
                    {selected.user?.name || t("admin.common.unknownUser")} ·{" "}
                    {t("admin.tickets.steamIdLabel")} {selected.user?.steamId || "N/A"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <AdminButton
                    type="button"
                    size="sm"
                    variant={selected.status === "OPEN" ? "danger" : "success"}
                    disabled={updating}
                    loading={updating}
                    onClick={() => changeStatus(selected.status === "OPEN" ? "CLOSED" : "OPEN")}
                  >
                    {selected.status === "OPEN" ? t("tickets.close") : t("tickets.reopen")}
                  </AdminButton>
                  <button
                    type="button"
                    onClick={closeTicket}
                    aria-label={t("common.close")}
                    className="rounded-md border border-white/10 bg-[#141124] p-2 text-[#9e98b6] hover:text-white cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <TicketChat
                  ticket={selected}
                  actor="ADMIN"
                  onTicketUpdated={refreshTicketsSilently}
                  fillHeight
                  hideHeader
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <AdminEmptyState
                icon={MessageSquare}
                title={t("admin.tickets.selectHint")}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Sheet for Selected Ticket */}
      {selected &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[120] flex h-dvh flex-col bg-[#0b0914] lg:hidden">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-[#120f22] px-4 py-3">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <button
                  type="button"
                  onClick={closeTicket}
                  aria-label={t("common.close")}
                  className="rounded-md border border-white/10 bg-[#1c1833] p-2 text-white cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-[#9e98b6]">
                    #{selected.orderId.slice(0, 8)} · {selected.order.type}
                  </p>
                  <h2 className="truncate text-sm font-semibold text-white">
                    {selected.subject}
                  </h2>
                </div>
              </div>
              <AdminButton
                type="button"
                size="sm"
                variant={selected.status === "OPEN" ? "danger" : "success"}
                disabled={updating}
                onClick={() => changeStatus(selected.status === "OPEN" ? "CLOSED" : "OPEN")}
              >
                {selected.status === "OPEN" ? t("tickets.close") : t("tickets.reopen")}
              </AdminButton>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <TicketChat
                ticket={selected}
                actor="ADMIN"
                onTicketUpdated={refreshTicketsSilently}
                fullscreen
                hideHeader
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
