"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Gift,
  Layers,
  Loader2,
  RefreshCw,
  Ticket,
  Upload,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminEmptyState,
  AdminHeader,
  AdminLoadingState,
  AdminSection,
  AdminStatusTabs,
} from "@/features/admin/ui/AdminShell";
import {
  OrderDetailPayoutDetails,
  getPaymentMethodLabel,
} from "@/features/admin/orders/ui/OrderDetailRow/OrderDetailPayoutDetails";
import { PaymentProofModal } from "@/shared/components/PaymentProofModal";
import type { Order } from "@/features/admin/domain/types";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import { useI18n } from "@/shared/i18n/I18nProvider";

type RaffleDetailTab = "overview" | "tickets" | "payment" | "buyer";

const STATUS_UPDATE_TIMEOUT_MS = 15000;

type RaffleOrderMetadata = NonNullable<Order["metadata"]> & Record<string, unknown>;

function normalizeOrderMetadata(metadata: unknown): RaffleOrderMetadata | null {
  if (!metadata) return null;
  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata);
      return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
        ? (parsed as RaffleOrderMetadata)
        : null;
    } catch {
      return null;
    }
  }
  if (typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as RaffleOrderMetadata;
  }
  return null;
}

interface RaffleOrderDetailResponse {
  raffle: {
    id: string;
    name: string;
    status: string;
    drawDate: string;
    ticketPrice: number;
    maxTickets: number | null;
    prizesCount: number;
  };
  order: {
    id: string;
    userId: string;
    status: string;
    totalPrice: number;
    paymentMethod: string | null;
    createdAt: string;
    metadata: RaffleOrderMetadata | null;
    ticketsCount: number;
  };
  buyer: {
    id: string;
    name: string | null;
    steamId: string | null;
    avatar: string | null;
    email: string | null;
    tradeUrl: string | null;
    chancesInThisOrder: number;
    chancesInRaffleTotal: number;
  };
  assignedTickets: number[];
}

interface RaffleOrderDetailPageProps {
  raffleId: string;
  orderId: string;
}

function getWorkflowStep(status: string): number {
  switch (status) {
    case "PENDING_PAYMENT":
      return 1;
    case "PAID":
      return 2;
    case "COMPLETED":
      return 3;
    default:
      return 0;
  }
}

function getStatusUpdateErrorMessage(err: unknown, t: (key: string) => string) {
  if (err instanceof DOMException && err.name === "AbortError")
    return t("admin.common.statusUpdateTimeout");
  if (err instanceof TypeError && err.message === "Failed to fetch")
    return t("admin.common.statusUpdateConnection");
  return err instanceof Error ? err.message : t("admin.common.statusUpdateError");
}

async function getErrorMessage(response: Response, fallback: string) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => null);
    return data?.error || data?.message || fallback;
  }
  const text = await response.text().catch(() => "");
  return text || fallback;
}

export function RaffleOrderDetailPage({ raffleId, orderId }: RaffleOrderDetailPageProps) {
  const { t } = useI18n();
  const router = useRouter();
  const localizePath = useLocalizedPath();
  const updatingStatusRef = useRef<Set<string>>(new Set());

  const [activeTab, setActiveTab] = useState<RaffleDetailTab>("overview");
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [copiedTickets, setCopiedTickets] = useState(false);
  const [detail, setDetail] = useState<RaffleOrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [proofOpen, setProofOpen] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofUploadError, setProofUploadError] = useState<string | null>(null);

  const handleCopyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 1500);
  };

  const handleCopyTickets = (tickets: number[]) => {
    navigator.clipboard.writeText(tickets.map((n) => `#${n}`).join(", "));
    setCopiedTickets(true);
    setTimeout(() => setCopiedTickets(false), 1500);
  };

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(
        `${BACKEND_URL}/raffles/admin/${raffleId}/orders/${orderId}`,
      );

      if (res.status === 401) {
        router.push(localizePath("/admin/login"));
        return;
      }

      if (!res.ok) {
        const msg = await getErrorMessage(res, t("admin.orders.loadError"));
        throw new Error(msg);
      }

      setDetail(await res.json());
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : t("admin.orders.loadError"));
    } finally {
      setLoading(false);
    }
  }, [localizePath, orderId, raffleId, router, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchDetail();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchDetail]);

  const updateOrderStatus = async (newStatus: string) => {
    if (!detail || updatingStatusRef.current.has(detail.order.id)) return;

    const original = detail;
    setStatusFeedback(null);
    updatingStatusRef.current.add(detail.order.id);
    setDetail((prev) =>
      prev ? { ...prev, order: { ...prev.order, status: newStatus } } : prev,
    );

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), STATUS_UPDATE_TIMEOUT_MS);

    try {
      const response = await fetch(`${BACKEND_URL}/orders/${detail.order.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify({ status: newStatus, botId: null }),
      });

      if (response.status === 401 || response.status === 403) {
        const message = await getErrorMessage(response, t("admin.common.adminSessionExpired"));
        if (response.status === 401) router.push(localizePath("/admin/login"));
        throw new Error(message);
      }

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, t("admin.common.statusUpdateError")));
      }

      await fetchDetail();
    } catch (err: unknown) {
      setStatusFeedback(getStatusUpdateErrorMessage(err, t));
      setDetail(original);
    } finally {
      window.clearTimeout(timeoutId);
      updatingStatusRef.current.delete(detail.order.id);
    }
  };

  const backHref = localizePath("/admin/panel/raffle-purchases");
  const orderMetadata = detail ? normalizeOrderMetadata(detail.order.metadata) : null;

  const orderForPayout: Order | null = detail
    ? {
        id: detail.order.id,
        userId: detail.order.userId,
        user: {
          name: detail.buyer.name,
          steamId: detail.buyer.steamId,
          avatar: detail.buyer.avatar,
          tradeUrl: detail.buyer.tradeUrl,
        },
        type: "BUY",
        status: detail.order.status,
        totalPrice: detail.order.totalPrice,
        items: [],
        createdAt: detail.order.createdAt,
        paymentMethod: detail.order.paymentMethod,
        metadata: orderMetadata
          ? {
              ...orderMetadata,
              email: orderMetadata.email ?? detail.buyer.email,
            }
          : null,
      }
    : null;

  const buyerProof = orderMetadata?.buyerPaymentProof;
  const buyerProofUrl = buyerProof
    ? `${BACKEND_URL}/orders/${detail?.order.id}/payment-proof/buyer`
    : null;

  const handleAdminProofUpload = async (file: File | null) => {
    if (!detail || !file) return;

    setUploadingProof(true);
    setProofUploadError(null);

    try {
      const formData = new FormData();
      formData.append("proof", file);

      const response = await fetchWithAuth(
        `${BACKEND_URL}/orders/${detail.order.id}/payment-proof/buyer`,
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || t("checkout.error.uploadProof"));
      }

      await fetchDetail();
    } catch (err: unknown) {
      setProofUploadError(
        err instanceof Error ? err.message : t("checkout.error.uploadProof"),
      );
    } finally {
      setUploadingProof(false);
    }
  };

  const currentStep = detail ? getWorkflowStep(detail.order.status) : 0;
  const isCancelled = detail?.order.status === "CANCELLED";
  const canCancel = detail?.order.status !== "CANCELLED";
  const canRestore =
    detail?.order.status === "CANCELLED" ||
    detail?.order.status === "COMPLETED" ||
    detail?.order.status === "PAID";
  const arsSettlement =
    detail?.order.metadata?.paymentQuote?.settlement?.currency === "ARS" &&
    typeof detail.order.metadata.paymentQuote.settlement.amount === "number"
      ? detail.order.metadata.paymentQuote.settlement.amount
      : null;

  const statusBadge =
    detail?.order.status === "PENDING_PAYMENT"
      ? { label: t("admin.rafflePurchases.statusPendingPayment"), tone: "warning" as const }
      : detail?.order.status === "PAID"
        ? { label: t("admin.rafflePurchases.statusPaid"), tone: "info" as const }
        : detail?.order.status === "COMPLETED"
          ? { label: t("admin.rafflePurchases.statusCompleted"), tone: "success" as const }
          : detail?.order.status === "CANCELLED"
            ? { label: t("admin.rafflePurchases.statusCancelled"), tone: "danger" as const }
            : {
                label: detail?.order.status?.replaceAll("_", " ") || "",
                tone: "neutral" as const,
              };

  const paymentMethodLabel = detail ? getPaymentMethodLabel(detail.order.paymentMethod, t) : "—";
  const tabs: { value: RaffleDetailTab; label: string; count?: number }[] = detail
    ? [
        { value: "overview", label: t("admin.orders.tabs.overview") },
        {
          value: "tickets",
          label: t("admin.rafflePurchases.assignedTickets"),
          count: detail.assignedTickets.length,
        },
        {
          value: "payment",
          label: t("admin.orders.tabs.payment"),
          count: buyerProof ? 1 : undefined,
        },
        { value: "buyer", label: t("admin.orders.tabs.buyer") },
      ]
    : [];

  return (
    <div className="space-y-5">
      <AdminHeader
        title={t("admin.rafflePurchases.orderDetailTitle")}
        description={`#${orderId}`}
        icon={Ticket}
        actions={
          <>
            <Link
              href={backHref}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-[#1c1833] px-3.5 text-xs sm:text-[13px] font-semibold text-white hover:bg-[#252042] transition-colors sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              {t("admin.rafflePurchases.backToOrders")}
            </Link>
            <AdminButton
              type="button"
              icon={RefreshCw}
              variant="secondary"
              loading={loading}
              onClick={fetchDetail}
            >
              {t("common.refresh")}
            </AdminButton>
          </>
        }
      />

      {statusFeedback && <AdminAlert>{statusFeedback}</AdminAlert>}

      {loading ? (
        <AdminLoadingState />
      ) : error ? (
        <AdminEmptyState title={error} />
      ) : !detail ? (
        <AdminEmptyState
          title={t("admin.rafflePurchases.orderNotFound")}
          description={t("admin.rafflePurchases.orderNotFoundDesc")}
        />
      ) : (
        <div className="space-y-4">
          {/* Persistent Operational Header + Always-Visible Status Controls */}
          <AdminSection className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <AdminBadge tone="accent">
                    <Ticket className="h-3.5 w-3.5" />
                    {t("admin.rafflePurchases.raffleContextTitle")}
                  </AdminBadge>
                  <AdminBadge tone={statusBadge.tone} dot>
                    {statusBadge.label}
                  </AdminBadge>
                  <button
                    type="button"
                    onClick={() => handleCopyOrderId(detail.order.id)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-[#0d0a18] px-2.5 py-0.5 font-mono text-xs text-[#c2bdd6] hover:border-white/20 hover:text-white transition-colors cursor-pointer tabular-nums"
                  >
                    <span>#{detail.order.id}</span>
                    {copiedOrderId ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3 text-[#8e88a6]" />
                    )}
                  </button>
                  <span className="font-mono text-xs text-[#8e88a6] tabular-nums">
                    {new Date(detail.order.createdAt).toLocaleString()}
                  </span>
                </div>

                <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                  {detail.raffle.name}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#9e98b6]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-accent" />
                    {new Date(detail.raffle.drawDate).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <Ticket className="h-3.5 w-3.5 text-accent" />
                    ${detail.raffle.ticketPrice.toFixed(2)} {t("admin.rafflePurchases.perChance")}
                  </span>
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <Gift className="h-3.5 w-3.5 text-accent" />
                    {detail.raffle.prizesCount} {t("raffles.prizes").toLowerCase()}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {buyerProof && (
                  <AdminButton
                    type="button"
                    variant="success"
                    size="sm"
                    icon={FileText}
                    onClick={() => setProofOpen(true)}
                  >
                    {t("purchases.viewProof")}
                  </AdminButton>
                )}
                <Link
                  href={localizePath(`/raffles/${detail.raffle.id}`)}
                  target="_blank"
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-[#1c1833] px-3 text-xs font-semibold text-white hover:bg-[#252042] transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t("admin.rafflePurchases.viewRaffle")}
                </Link>
              </div>
            </div>

            {/* Unified 3-column Key Summary Strip */}
            <div className="grid grid-cols-1 divide-y divide-white/[0.06] rounded-lg border border-white/[0.06] bg-[#1a1630] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="flex items-center gap-3 p-3.5">
                {detail.buyer.avatar ? (
                  <img
                    src={detail.buyer.avatar}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-md border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#0d0a18] text-[#9e98b6]">
                    <UserRound className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="block text-[11px] font-medium text-[#8e88a6]">
                    {t("admin.orders.buyer")}
                  </span>
                  <p className="truncate text-sm font-semibold text-white">
                    {detail.buyer.name || t("admin.common.unknownUser")}
                  </p>
                  <p className="truncate font-mono text-xs text-[#a39db9] tabular-nums">
                    {detail.buyer.steamId || "—"}
                  </p>
                </div>
              </div>

              <div className="p-3.5">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#8e88a6]">
                  <WalletCards className="h-3.5 w-3.5" />
                  {t("admin.orders.totalAmount")}
                </span>
                <p className="mt-1 text-base font-semibold text-emerald-400 tabular-nums">
                  ${detail.order.totalPrice.toFixed(2)} USD
                </p>
                <p className="mt-0.5 truncate text-xs text-[#b8b2cd] tabular-nums">
                  {arsSettlement !== null
                    ? `${formatArs(arsSettlement)} ARS · ${paymentMethodLabel}`
                    : paymentMethodLabel}
                </p>
              </div>

              <div className="p-3.5">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#8e88a6]">
                  <Ticket className="h-3.5 w-3.5" />
                  {t("admin.rafflePurchases.orderChances")}
                </span>
                <p className="mt-1 text-sm font-semibold text-white tabular-nums">
                  {detail.buyer.chancesInThisOrder} {t("admin.rafflePurchases.columnChances").toLowerCase()}{" "}
                  <span className="text-xs font-normal text-[#9e98b6]">
                    ({detail.buyer.chancesInRaffleTotal} total)
                  </span>
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  {buyerProof ? (
                    <button
                      type="button"
                      onClick={() => setProofOpen(true)}
                      className="font-medium text-emerald-300 hover:underline cursor-pointer"
                    >
                      {t("admin.orders.proofAttached")} · {t("common.view")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab("payment")}
                      className="text-[#9e98b6] hover:text-white hover:underline cursor-pointer"
                    >
                      {t("admin.orders.noBuyerProof")}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Always-Visible Manual Status Controls */}
            <div className="space-y-2.5 border-t border-white/[0.06] pt-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="text-xs font-semibold text-white">
                  {t("admin.orders.manualStatusChange")}
                </h4>
                <p className="text-xs text-[#9e98b6]">
                  {t("admin.rafflePurchases.markPaidHint")}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(detail.order.status === "PENDING_PAYMENT" || isCancelled) && (
                  <AdminButton
                    type="button"
                    size="sm"
                    variant="success"
                    icon={CreditCard}
                    onClick={() => updateOrderStatus("PAID")}
                  >
                    {t("admin.rafflePurchases.markPaid")}
                  </AdminButton>
                )}
                {canRestore && detail.order.status !== "PENDING_PAYMENT" && (
                  <AdminButton
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => updateOrderStatus("PENDING_PAYMENT")}
                  >
                    {t("admin.rafflePurchases.resetToPending")}
                  </AdminButton>
                )}
                <AdminButton
                  type="button"
                  size="sm"
                  variant="danger"
                  icon={XCircle}
                  disabled={!canCancel}
                  onClick={() => canCancel && updateOrderStatus("CANCELLED")}
                >
                  {t("admin.rafflePurchases.cancelOrder")}
                </AdminButton>
              </div>
            </div>
          </AdminSection>

          {/* Section Tabs */}
          <AdminStatusTabs
            items={tabs}
            value={activeTab}
            onChange={setActiveTab}
          />

          {/* Tab Panel Content */}
          {activeTab === "overview" && (
            <div role="tabpanel" className="space-y-4">
              <AdminSection className="space-y-4">
                {isCancelled ? (
                  <AdminAlert>{t("admin.rafflePurchases.orderCancelled")}</AdminAlert>
                ) : (
                  <>
                    <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                      <Layers className="h-4 w-4 text-accent" />
                      <p className="text-sm font-semibold text-white">
                        {t("purchases.transactionProgress", { type: t("raffles.tickets") })}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {[
                        { step: 1, label: t("admin.rafflePurchases.workflowPending"), icon: CreditCard },
                        { step: 2, label: t("admin.rafflePurchases.workflowPaid"), icon: WalletCards },
                        { step: 3, label: t("admin.rafflePurchases.workflowCompleted"), icon: Check },
                      ].map(({ step, label, icon: Icon }) => {
                        const done = currentStep > step;
                        const active = currentStep === step;
                        return (
                          <div
                            key={step}
                            className={`flex items-center gap-2.5 rounded-md border p-3 transition-colors ${
                              active
                                ? "border-accent/40 bg-accent/10 text-white"
                                : done
                                  ? "border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-200"
                                  : "border-white/[0.06] bg-[#1a1630] text-[#8e88a6]"
                            }`}
                          >
                            <div
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-semibold tabular-nums ${
                                done
                                  ? "bg-emerald-500 text-black"
                                  : active
                                    ? "bg-accent text-white"
                                    : "bg-white/[0.06] text-[#9e98b6]"
                              }`}
                            >
                              {done ? "✓" : step}
                            </div>
                            <span className="flex items-center gap-1.5 text-xs font-semibold">
                              <Icon className="h-3.5 w-3.5 shrink-0" />
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </AdminSection>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <AdminSection className="flex flex-col justify-between gap-3.5">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-white">
                        {t("admin.rafflePurchases.assignedTickets")}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setActiveTab("tickets")}
                        className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline cursor-pointer"
                      >
                        <span>
                          {t("admin.rafflePurchases.assignedTickets")} ({detail.assignedTickets.length})
                        </span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                    {detail.assignedTickets.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {detail.assignedTickets.slice(0, 14).map((n) => (
                          <span
                            key={n}
                            className="rounded-md border border-accent/25 bg-accent/12 px-2 py-0.5 font-mono text-xs font-semibold text-fuchsia-200 tabular-nums"
                          >
                            #{n}
                          </span>
                        ))}
                        {detail.assignedTickets.length > 14 && (
                          <button
                            type="button"
                            onClick={() => setActiveTab("tickets")}
                            className="rounded-md border border-white/10 bg-[#1a1630] px-2 py-0.5 text-xs font-medium text-[#c2bdd6] hover:text-white cursor-pointer"
                          >
                            +{detail.assignedTickets.length - 14}
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-[#9e98b6]">
                        {t("admin.rafflePurchases.markPaidHint")}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <AdminButton
                      type="button"
                      size="sm"
                      variant="secondary"
                      icon={Ticket}
                      onClick={() => setActiveTab("tickets")}
                    >
                      {t("admin.rafflePurchases.assignedTickets")}
                    </AdminButton>
                  </div>
                </AdminSection>

                <AdminSection className="flex flex-col justify-between gap-3.5">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-white">
                        {t("admin.orders.tabs.payment")}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setActiveTab("payment")}
                        className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline cursor-pointer"
                      >
                        <span>{t("admin.orders.billingDetails")}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-[#b8b2cd]">
                      {paymentMethodLabel}
                      {arsSettlement !== null ? ` · ${formatArs(arsSettlement)} ARS` : ""}
                    </p>
                    <p className="mt-1 text-xs text-[#9e98b6]">
                      {buyerProof
                        ? `${t("admin.orders.proofAttached")}: ${buyerProof.fileName || t("purchases.attachedFile")}`
                        : t("admin.orders.noBuyerProof")}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {buyerProof ? (
                      <AdminButton
                        type="button"
                        size="sm"
                        variant="success"
                        icon={FileText}
                        onClick={() => setProofOpen(true)}
                      >
                        {t("purchases.viewProof")}
                      </AdminButton>
                    ) : (
                      <AdminButton
                        type="button"
                        size="sm"
                        variant="secondary"
                        icon={Upload}
                        onClick={() => setActiveTab("payment")}
                      >
                        {t("checkout.uploadProof")}
                      </AdminButton>
                    )}
                    <AdminButton
                      type="button"
                      size="sm"
                      variant="secondary"
                      icon={UserRound}
                      onClick={() => setActiveTab("buyer")}
                    >
                      {t("admin.orders.tabs.buyer")}
                    </AdminButton>
                  </div>
                </AdminSection>
              </div>
            </div>
          )}

          {activeTab === "tickets" && (
            <div role="tabpanel">
              <AdminSection className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-accent" />
                    <h4 className="text-sm font-semibold text-white">
                      {t("admin.rafflePurchases.assignedTickets")} ({detail.assignedTickets.length})
                    </h4>
                  </div>

                  {detail.assignedTickets.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleCopyTickets(detail.assignedTickets)}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors cursor-pointer ${
                        copiedTickets
                          ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-300"
                          : "border-white/10 bg-[#1c1833] text-[#c2bdd6] hover:bg-[#252042] hover:text-white"
                      }`}
                    >
                      {copiedTickets ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>{t("admin.orders.copied")}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>{t("admin.orders.copy")}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {detail.assignedTickets.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {detail.assignedTickets.map((n) => (
                      <span
                        key={n}
                        className="rounded-md border border-accent/25 bg-accent/12 px-2.5 py-1 font-mono text-xs font-semibold text-fuchsia-200 tabular-nums"
                      >
                        #{n}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="py-6 text-center text-xs text-[#9e98b6]">
                    {t("admin.rafflePurchases.markPaidHint")}
                  </p>
                )}
              </AdminSection>
            </div>
          )}

          {activeTab === "payment" && orderForPayout && (
            <div role="tabpanel" className="space-y-4">
              <OrderDetailPayoutDetails
                order={orderForPayout}
                mode="payment"
                onOpenProofModal={() => setProofOpen(true)}
              />
              {!buyerProof && (
                <AdminSection>
                  <p className="mb-1.5 text-xs font-semibold text-white">
                    {t("admin.orders.buyerProofTitle")}
                  </p>
                  <p className="mb-3 text-xs text-[#9e98b6]">
                    {t("admin.rafflePurchases.uploadBuyerProofHint")}
                  </p>
                  <label className="block cursor-pointer rounded-lg border border-dashed border-white/15 bg-[#0e0b1a] p-4 transition-colors hover:border-accent/50">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                      className="sr-only"
                      disabled={uploadingProof}
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        event.target.value = "";
                        void handleAdminProofUpload(file);
                      }}
                    />
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-accent">
                      {uploadingProof ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {t("checkout.uploadProof")}
                    </span>
                  </label>
                  {proofUploadError && (
                    <p className="mt-2 text-xs font-medium text-rose-300">
                      {proofUploadError}
                    </p>
                  )}
                </AdminSection>
              )}
            </div>
          )}

          {activeTab === "buyer" && orderForPayout && (
            <div role="tabpanel">
              <OrderDetailPayoutDetails
                order={orderForPayout}
                mode="buyer"
                onOpenProofModal={() => setProofOpen(true)}
              />
            </div>
          )}

          {orderForPayout && (
            <PaymentProofModal
              open={proofOpen}
              onClose={() => setProofOpen(false)}
              proofUrl={buyerProofUrl}
              proof={buyerProof}
              title={t("admin.orders.buyerProof")}
            />
          )}
        </div>
      )}
    </div>
  );
}

function formatArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
