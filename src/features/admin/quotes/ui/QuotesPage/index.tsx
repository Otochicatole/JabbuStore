"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  DollarSign,
  ExternalLink,
  User as UserIcon,
  Send,
  RefreshCw,
} from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { AlertConfirmModal } from "@/shared/components/AlertConfirmModal";
import { useI18n } from "@/shared/i18n/I18nProvider";
import {
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminEmptyState,
  AdminHeader,
  AdminLoadingState,
  AdminSearchInput,
  AdminSection,
  AdminStatusTabs,
  AdminToolbar,
} from "@/features/admin/ui/AdminShell";

interface QuoteItem {
  id: string;
  assetId: string;
  name: string;
  price: number | null;
  iconUrl: string | null;
  rarity: string | null;
  exterior: string | null;
  float: number | null;
  pattern: number | null;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  steamId: string | null;
  avatar: string | null;
}

interface Quote {
  id: string;
  status: "PENDING" | "QUOTED" | "ACCEPTED" | "CANCELLED";
  items: QuoteItem[];
  user: User;
  createdAt: string;
  updatedAt: string;
}

export function QuotesPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({});

  const [pricesInput, setPricesInput] = useState<Record<string, Record<string, string>>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error" | "confirm";
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: () => {},
  });

  const showAlert = (
    title: string,
    message: string,
    type: "info" | "success" | "warning" | "error" = "info",
  ) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
    });
  };

  const showConfirm = (title: string, message: string, onYes: () => void) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: "confirm",
      onConfirm: () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        onYes();
      },
      onCancel: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
    });
  };

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/quotes/admin/all`, {
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      });

      if (res.status === 401 || res.status === 403) {
        router.push("/admin/login");
        return;
      }

      if (!res.ok) {
        throw new Error("Error al obtener la lista de cotizaciones.");
      }

      const data = (await res.json()) as Quote[];
      setQuotes(data);

      const initialInputs: Record<string, Record<string, string>> = {};
      data.forEach((q: Quote) => {
        initialInputs[q.id] = {};
        q.items.forEach((item) => {
          initialInputs[q.id][item.assetId] = item.price !== null ? item.price.toString() : "";
        });
      });
      setPricesInput(initialInputs);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchQuotes();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchQuotes]);

  const toggleExpand = (id: string) => {
    setExpandedQuotes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePriceChange = (quoteId: string, assetId: string, val: string) => {
    setPricesInput((prev) => ({
      ...prev,
      [quoteId]: {
        ...prev[quoteId],
        [assetId]: val,
      },
    }));
  };

  const handleSubmitQuote = async (quoteId: string, e: React.FormEvent) => {
    e.preventDefault();
    const inputs = pricesInput[quoteId];
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote) return;

    const prices: { assetId: string; price: number }[] = [];
    for (const item of quote.items) {
      const val = inputs[item.assetId];
      const parsed = parseFloat(val);
      if (isNaN(parsed) || parsed < 0) {
        showAlert(
          "Precio Inválido",
          `Por favor, ingresa un precio válido para el ítem: ${item.name}`,
          "warning",
        );
        return;
      }
      prices.push({ assetId: item.assetId, price: parsed });
    }

    setSubmittingId(quoteId);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/quotes/admin/${quoteId}/quote`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prices }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data?.error || "Error al enviar la cotización.");
      }

      const updated = (await res.json()) as Quote;
      setQuotes((prev) => prev.map((q) => (q.id === quoteId ? updated : q)));
      showAlert("Cotización Enviada", "¡Cotización enviada exitosamente al usuario!", "success");
      setExpandedQuotes((prev) => ({ ...prev, [quoteId]: false }));
    } catch (err: unknown) {
      showAlert(
        "Error",
        err instanceof Error ? err.message : "Error al enviar la cotización.",
        "error",
      );
    } finally {
      setSubmittingId(null);
    }
  };

  const handleCancelQuote = async (quoteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm(
      "Rechazar Cotización",
      "¿Estás seguro de que deseas rechazar/cancelar esta cotización desde administración?",
      async () => {
        setCancellingId(quoteId);
        try {
          const res = await fetchWithAuth(`${BACKEND_URL}/quotes/admin/${quoteId}/cancel`, {
            method: "POST",
          });

          if (!res.ok) {
            const data = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(data?.error || "Error al cancelar la cotización.");
          }

          const updated = (await res.json()) as Quote;
          setQuotes((prev) =>
            prev.map((q) => (q.id === quoteId ? { ...q, status: updated.status } : q)),
          );
          showAlert(
            "Cotización Cancelada",
            "La solicitud de cotización ha sido rechazada/cancelada correctamente.",
            "success",
          );
          setExpandedQuotes((prev) => ({ ...prev, [quoteId]: false }));
        } catch (err: unknown) {
          showAlert(
            "Error",
            err instanceof Error ? err.message : "Error al cancelar la cotización.",
            "error",
          );
        } finally {
          setCancellingId(null);
        }
      },
    );
  };

  const getStatusConfig = (status: Quote["status"]) => {
    switch (status) {
      case "PENDING":
        return { label: t("admin.quotes.statusPending"), tone: "warning" as const, icon: Clock };
      case "QUOTED":
        return { label: t("admin.quotes.statusQuoted"), tone: "info" as const, icon: DollarSign };
      case "ACCEPTED":
        return {
          label: t("admin.quotes.statusAcceptedBought"),
          tone: "success" as const,
          icon: CheckCircle,
        };
      case "CANCELLED":
        return { label: t("admin.quotes.statusCancelled"), tone: "danger" as const, icon: XCircle };
    }
  };

  const searchFiltered = useMemo(() => {
    const qLower = searchTerm.toLowerCase().trim();
    if (!qLower) return quotes;
    return quotes.filter(
      (q) =>
        q.id.toLowerCase().includes(qLower) ||
        (q.user.name && q.user.name.toLowerCase().includes(qLower)) ||
        (q.user.email && q.user.email.toLowerCase().includes(qLower)) ||
        (q.user.steamId && q.user.steamId.includes(qLower)),
    );
  }, [quotes, searchTerm]);

  const statusTabs = useMemo(() => {
    const countOf = (st: Quote["status"]) =>
      searchFiltered.filter((q) => q.status === st).length;
    return [
      { value: "all", label: t("admin.quotes.filterAll"), count: searchFiltered.length },
      { value: "PENDING", label: t("admin.quotes.filterPending"), count: countOf("PENDING") },
      { value: "QUOTED", label: t("admin.quotes.filterQuoted"), count: countOf("QUOTED") },
      { value: "ACCEPTED", label: t("admin.quotes.filterAccepted"), count: countOf("ACCEPTED") },
      { value: "CANCELLED", label: t("admin.quotes.filterCancelled"), count: countOf("CANCELLED") },
    ];
  }, [searchFiltered, t]);

  const filteredQuotes = useMemo(() => {
    if (statusFilter === "all") return searchFiltered;
    return searchFiltered.filter((q) => q.status === statusFilter);
  }, [searchFiltered, statusFilter]);

  return (
    <div className="space-y-5">
      <AdminHeader
        title={t("admin.quotes.title")}
        description={t("admin.quotes.intro")}
        icon={DollarSign}
        actions={
          <AdminButton
            type="button"
            onClick={fetchQuotes}
            disabled={loading}
            loading={loading}
            icon={RefreshCw}
            variant="secondary"
          >
            {t("admin.quotes.refreshList")}
          </AdminButton>
        }
      />

      {error && <AdminAlert>{error}</AdminAlert>}

      <AdminStatusTabs
        items={statusTabs}
        value={statusFilter}
        onChange={setStatusFilter}
      />

      <AdminToolbar>
        <AdminSearchInput
          placeholder={t("admin.quotes.searchPlaceholder")}
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </AdminToolbar>

      {loading && quotes.length === 0 ? (
        <AdminLoadingState label={t("admin.quotes.loadingServer")} />
      ) : filteredQuotes.length === 0 ? (
        <AdminEmptyState icon={DollarSign} title={t("admin.quotes.noMatchingQuotes")} />
      ) : (
        <div className="space-y-3">
          {filteredQuotes.map((quote) => {
            const isExpanded = !!expandedQuotes[quote.id];
            const badge = getStatusConfig(quote.status);
            const StatusIcon = badge.icon;
            const totalQuoted = quote.items.reduce((sum, item) => sum + (item.price ?? 0), 0);
            const liveFormTotal = quote.items.reduce((sum, item) => {
              const parsed = parseFloat(pricesInput[quote.id]?.[item.assetId] ?? "");
              return sum + (isNaN(parsed) || parsed < 0 ? 0 : parsed);
            }, 0);
            const isQuoteEditable = quote.status === "PENDING" || quote.status === "QUOTED";

            return (
              <AdminSection key={quote.id} padded={false} className="overflow-hidden">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleExpand(quote.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleExpand(quote.id);
                    }
                  }}
                  aria-expanded={isExpanded}
                  className="flex cursor-pointer flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-5 hover:bg-white/[0.02] transition-colors select-none"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#1c1833]">
                      {quote.user.avatar ? (
                        <Image src={quote.user.avatar} alt="Avatar" fill className="object-cover" />
                      ) : (
                        <UserIcon className="h-4.5 w-4.5 text-[#9e98b6]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-white tabular-nums">
                          {t("admin.quotes.quoteId")} #{quote.id.slice(0, 8)}
                        </span>
                        <AdminBadge tone={badge.tone}>
                          <StatusIcon className="h-3 w-3" />
                          {badge.label}
                        </AdminBadge>
                      </div>

                      <p className="mt-1 truncate text-xs text-[#9e98b6]">
                        {t("admin.quotes.user")}{" "}
                        <span className="font-medium text-white">
                          {quote.user.name || "Steam User"}
                        </span>
                        {" · "}
                        {quote.user.email || "Sin email"}
                        {" · "}
                        <span className="tabular-nums">
                          {quote.items.length} {t("admin.quotes.item")}
                          {quote.items.length === 1 ? "" : "s"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex w-full items-center justify-between gap-4 border-t border-white/[0.06] pt-3 sm:w-auto sm:justify-end sm:border-t-0 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <span className="block text-[11px] text-[#8e88a6]">
                        {t("admin.quotes.totalRequestedQuoted")}
                      </span>
                      <span className="text-sm font-semibold text-white tabular-nums">
                        {quote.status === "PENDING" && quote.items.every((i) => i.price === null)
                          ? t("admin.quotes.statusPending")
                          : `$${totalQuoted.toLocaleString()} USD`}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {isQuoteEditable && (
                        <AdminButton
                          type="button"
                          size="sm"
                          variant="danger"
                          icon={Trash2}
                          loading={cancellingId === quote.id}
                          disabled={cancellingId === quote.id}
                          onClick={(e) => handleCancelQuote(quote.id, e)}
                        >
                          {t("admin.quotes.reject")}
                        </AdminButton>
                      )}

                      <ChevronDown
                        className={`h-4 w-4 text-[#9e98b6] transition-transform duration-150 ${
                          isExpanded ? "rotate-180 text-white" : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="space-y-5 border-t border-white/[0.07] bg-[#100d1e] p-4 sm:p-5">
                    {/* User Info */}
                    <div className="flex flex-col justify-between gap-4 rounded-lg border border-white/[0.06] bg-[#17142b] p-4 md:flex-row md:items-center">
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-semibold text-[#b8b2cd]">
                          {t("admin.quotes.userInfo")}
                        </h4>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs text-[#9e98b6] sm:grid-cols-3">
                          <p>
                            {t("admin.quotes.name")}{" "}
                            <span className="font-medium text-white">{quote.user.name || "N/A"}</span>
                          </p>
                          <p>
                            {t("admin.quotes.email")}{" "}
                            <span className="font-medium text-white">{quote.user.email || "N/A"}</span>
                          </p>
                          <p>
                            {t("admin.quotes.steamId")}{" "}
                            <span className="font-mono font-medium text-white tabular-nums">
                              {quote.user.steamId || "N/A"}
                            </span>
                          </p>
                        </div>
                      </div>

                      {quote.user.steamId && (
                        <a
                          href={`https://steamcommunity.com/profiles/${quote.user.steamId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-white/10 bg-[#1c1833] px-3 text-xs font-medium text-white hover:bg-[#252042] transition-colors"
                        >
                          <span>{t("admin.quotes.steamProfile")}</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>

                    {/* Items Quoting Form */}
                    <form onSubmit={(e) => handleSubmitQuote(quote.id, e)} className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-semibold text-[#b8b2cd]">
                          {t("admin.quotes.itemsToQuote")}
                        </h4>
                        <span className="text-xs font-semibold text-emerald-400 tabular-nums">
                          {t("admin.quotes.quotedTotal")}: ${liveFormTotal.toFixed(2)} USD
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {quote.items.map((item) => {
                          const inputValue = pricesInput[quote.id]?.[item.assetId] ?? "";

                          return (
                            <div
                              key={item.id}
                              className="flex flex-col justify-between gap-3 rounded-lg border border-white/[0.06] bg-[#17142b] p-3 sm:flex-row sm:items-center"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#0d0a18] p-1">
                                  {item.iconUrl ? (
                                    <Image
                                      src={item.iconUrl}
                                      alt={item.name}
                                      fill
                                      className="object-contain p-1"
                                    />
                                  ) : (
                                    <DollarSign className="h-4 w-4 text-[#746e8d]" />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <h5 className="truncate text-sm font-semibold text-white">
                                    {item.name}
                                  </h5>
                                  <p className="mt-0.5 text-xs text-[#9e98b6] tabular-nums">
                                    {item.exterior || "Exterior no especificado"}
                                    {item.float !== null && ` · Float: ${item.float.toFixed(6)}`}
                                    {item.pattern !== null && ` · Seed: ${item.pattern}`}
                                  </p>
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
                                <span className="text-xs font-medium text-[#9e98b6]">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  disabled={!isQuoteEditable || submittingId === quote.id}
                                  value={inputValue}
                                  onChange={(e) =>
                                    handlePriceChange(quote.id, item.assetId, e.target.value)
                                  }
                                  className="h-9 w-28 rounded-md border border-white/10 bg-[#0d0a18] px-3 text-right font-mono text-sm font-medium text-white outline-none transition-colors placeholder:text-[#746e8d] focus:border-accent disabled:opacity-50"
                                  required
                                />
                                <span className="text-xs font-medium text-[#9e98b6]">USD</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {isQuoteEditable && (
                        <div className="flex justify-end border-t border-white/[0.06] pt-4">
                          <AdminButton
                            type="submit"
                            variant="primary"
                            icon={Send}
                            loading={submittingId === quote.id}
                            disabled={submittingId === quote.id}
                          >
                            {t("admin.quotes.sendQuote")}
                          </AdminButton>
                        </div>
                      )}
                    </form>
                  </div>
                )}
              </AdminSection>
            );
          })}
        </div>
      )}

      <AlertConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
      />
    </div>
  );
}
export default QuotesPage;
