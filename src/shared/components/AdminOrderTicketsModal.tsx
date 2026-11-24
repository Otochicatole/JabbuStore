"use client";

import React, { useEffect, useState } from "react";
import { MessageSquare, Plus, Loader2, MessageCircle } from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import { AdminBadge, AdminButton, AdminModal } from "@/features/admin/ui/AdminShell";

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
  const localizePath = useLocalizedPath();
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
          setShowCreate(data.length === 0);
        } else {
          setError(t("admin.tickets.errorLoad"));
        }
      } catch (err) {
        console.error(err);
        setError(t("admin.tickets.errorConnection"));
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [isOpen, orderId, t]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim().length < 3 || subject.trim().length > 120) {
      setError(t("admin.tickets.subjectLengthError"));
      return;
    }
    if (!message.trim() || message.trim().length > 2000) {
      setError(t("admin.tickets.messageEmptyError"));
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Ticket-Actor": "ADMIN",
        },
        body: JSON.stringify({
          orderId,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t("admin.tickets.createError"));
      }

      window.location.href = `${localizePath("/admin/panel/tickets")}?ticket=${data.id}`;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("admin.tickets.genericError"));
      setCreating(false);
    }
  };

  return (
    <AdminModal
      open={isOpen}
      onClose={onClose}
      size="md"
      title={
        <span className="inline-flex items-center gap-2">
          <MessageCircle className="h-4.5 w-4.5 text-accent" />
          <span>{t("admin.tickets.modalTitle")}</span>
        </span>
      }
      subtitle={`${orderType === "BUY" ? t("admin.tickets.typeBuy") : t("admin.tickets.typeSell")} #${orderId.slice(0, 8)} · $${orderPrice.toFixed(2)} USD`}
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 p-3 text-xs font-medium text-rose-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="mb-2 h-7 w-7 animate-spin text-accent" />
            <p className="text-xs font-medium text-[#9e98b6]">{t("admin.tickets.loading")}</p>
          </div>
        ) : (
          <>
            {!showCreate && tickets.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[#9e98b6]">
                    {t("admin.tickets.existingTickets", { count: tickets.length })}
                  </span>
                  <AdminButton
                    type="button"
                    size="sm"
                    variant="primary"
                    icon={Plus}
                    onClick={() => {
                      setShowCreate(true);
                      setError(null);
                    }}
                  >
                    {t("admin.tickets.newTicket")}
                  </AdminButton>
                </div>

                <div className="space-y-2">
                  {tickets.map((tItem) => (
                    <div
                      key={tItem.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.07] bg-[#1a1630] p-3.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-medium text-white">
                            {tItem.subject}
                          </span>
                          <AdminBadge tone={tItem.status === "OPEN" ? "success" : "neutral"}>
                            {tItem.status === "OPEN"
                              ? t("tickets.status.open")
                              : t("tickets.status.closed")}
                          </AdminBadge>
                        </div>
                        <p className="mt-1 text-xs text-[#8e88a6]">
                          {t("admin.tickets.createdAt")}{" "}
                          {new Date(tItem.createdAt).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <AdminButton
                        type="button"
                        size="sm"
                        variant="success"
                        icon={MessageSquare}
                        onClick={() => {
                          window.location.href = `${localizePath("/admin/panel/tickets")}?ticket=${tItem.id}`;
                        }}
                      >
                        {t("admin.tickets.chat")}
                      </AdminButton>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showCreate && (
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#b8b2cd]">
                    {t("admin.tickets.openNewTicket")}
                  </span>
                  {tickets.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreate(false);
                        setError(null);
                      }}
                      className="text-xs font-medium text-accent hover:underline cursor-pointer"
                    >
                      {t("admin.tickets.viewExisting")}
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#b8b2cd]">
                    {t("admin.tickets.subject")}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t("admin.tickets.subjectPlaceholder")}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="h-9 w-full rounded-md border border-white/10 bg-[#0d0a18] px-3 text-sm text-white outline-none transition-colors focus:border-accent"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#b8b2cd]">
                    {t("admin.tickets.message")}
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder={t("admin.tickets.messagePlaceholder")}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full resize-none rounded-md border border-white/10 bg-[#0d0a18] p-3 text-sm text-white outline-none transition-colors focus:border-accent"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  {tickets.length > 0 && (
                    <AdminButton
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowCreate(false);
                        setError(null);
                      }}
                    >
                      {t("common.cancel")}
                    </AdminButton>
                  )}
                  <AdminButton
                    type="submit"
                    variant="primary"
                    loading={creating}
                    disabled={creating}
                  >
                    {creating ? t("admin.tickets.creating") : t("admin.tickets.createAndOpen")}
                  </AdminButton>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </AdminModal>
  );
}
