"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Check,
  CreditCard,
  ExternalLink,
  Gift,
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
  AdminButton,
  AdminEmptyState,
  AdminHeader,
  AdminLoadingState,
  AdminSection,
} from "@/features/admin/ui/AdminShell";
import { OrderDetailPayoutDetails } from "@/features/admin/orders/ui/OrderDetailRow/OrderDetailPayoutDetails";
import { PaymentProofModal } from "@/shared/components/PaymentProofModal";
import type { Order } from "@/features/admin/domain/types";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";
import { useI18n } from "@/shared/i18n/I18nProvider";

const STATUS_UPDATE_TIMEOUT_MS = 15000;

function normalizeOrderMetadata(metadata: unknown): Record<string, any> | null {
  if (!metadata) return null;
  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata);
      return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
        ? (parsed as Record<string, any>)
        : null;
    } catch {
      return null;
    }
  }
  if (typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as Record<string, any>;
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
    metadata: Record<string, any> | null;
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

  const [detail, setDetail] = useState<RaffleOrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proofOpen, setProofOpen] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofUploadError, setProofUploadError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(
        `${BACKEND_URL}/raffles/admin/${raffleId}/orders/${orderId}`
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
    updatingStatusRef.current.add(detail.order.id);
    setDetail((prev) =>
      prev ? { ...prev, order: { ...prev.order, status: newStatus } } : prev
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
      alert(getStatusUpdateErrorMessage(err, t));
      setDetail(original);
    } finally {
      window.clearTimeout(timeoutId);
      updatingStatusRef.current.delete(detail.order.id);
    }
  };

  const backHref = localizePath(`/admin/panel/raffle-purchases/${raffleId}`);

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
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || t("checkout.error.uploadProof"));
      }

      await fetchDetail();
    } catch (err: unknown) {
      setProofUploadError(
        err instanceof Error ? err.message : t("checkout.error.uploadProof")
      );
    } finally {
      setUploadingProof(false);
    }
  };

  const currentStep = detail ? getWorkflowStep(detail.order.status) : 0;
  const isCancelled = detail?.order.status === "CANCELLED";
  const canCancel =
    detail?.order.status === "PENDING_PAYMENT" || detail?.order.status === "CANCELLED";

  return (
    <div className="space-y-6">
      <AdminHeader
        title={t("admin.rafflePurchases.orderDetailTitle")}
        description={orderId}
        actions={
          <>
            <Link
              href={backHref}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[3px] border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-white/10 sm:w-auto"
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

      {loading ? (
        <AdminLoadingState />
      ) : error ? (
        <AdminEmptyState title={error} />
      ) : !detail ? (
        <AdminEmptyState
          title="Orden no encontrada"
          description="La orden no existe o no pertenece a este sorteo."
        />
      ) : (
        <div className="space-y-5">
          {/* Raffle context */}
          <AdminSection className="border-accent/15 bg-accent/5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">
                  {t("admin.rafflePurchases.raffleContextTitle")}
                </p>
                <h2 className="text-lg font-black text-white">{detail.raffle.name}</h2>
                <div className="mt-3 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider text-[#84849b]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                    {new Date(detail.raffle.drawDate).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-accent" />
                    ${detail.raffle.ticketPrice.toFixed(2)} {t("admin.rafflePurchases.perChance")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-accent" />
                    {detail.raffle.prizesCount} {t("raffles.prizes").toLowerCase()}
                  </span>
                  <span className="rounded-[3px] border border-white/10 px-2 py-0.5 text-[9px]">
                    {detail.raffle.status}
                  </span>
                </div>
              </div>
              <Link
                href={localizePath(`/raffles/${detail.raffle.id}`)}
                target="_blank"
                className="inline-flex items-center gap-1.5 shrink-0 rounded-[3px] border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white hover:bg-white/10"
              >
                <ExternalLink className="w-3 h-3" />
                {t("admin.rafflePurchases.viewRaffle")}
              </Link>
            </div>
          </AdminSection>

          {/* Buyer + order summary */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AdminSection>
              <div className="flex items-start gap-4">
                {detail.buyer.avatar ? (
                  <img
                    src={detail.buyer.avatar}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-[3px] border border-white/10"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[3px] border border-white/10 bg-white/3 text-[#84849b]">
                    <UserRound className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#84849b] mb-1">
                    {t("admin.orders.buyer")}
                  </p>
                  <p className="truncate text-base font-black text-white">
                    {detail.buyer.name || t("admin.common.unknownUser")}
                  </p>
                  <p className="truncate font-mono text-xs text-accent">{detail.buyer.steamId || "—"}</p>
                  {detail.buyer.email && (
                    <p className="truncate text-[10px] text-[#84849b] mt-1">{detail.buyer.email}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-accent/20 bg-accent/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-accent">
                  <Ticket className="w-3 h-3" />
                  {t("admin.rafflePurchases.orderChances")}: {detail.buyer.chancesInThisOrder}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  <Ticket className="w-3 h-3" />
                  {t("admin.rafflePurchases.totalUserChances")}: {detail.buyer.chancesInRaffleTotal}
                </span>
              </div>
            </AdminSection>

            <AdminSection>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#84849b] mb-3">
                {t("admin.orders.totalAmount")}
              </p>
              <p className="text-2xl font-black text-emerald-400">
                ${detail.order.totalPrice.toFixed(2)} USD
              </p>
              <p className="mt-2 text-[10px] font-mono text-[#84849b]">
                {new Date(detail.order.createdAt).toLocaleString()}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/50">
                {detail.order.paymentMethod || "—"}
              </p>
            </AdminSection>
          </div>

          {/* 3-step workflow */}
          {!isCancelled && (
            <AdminSection>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#84849b] mb-4">
                {t("purchases.transactionProgress", { type: t("raffles.tickets") })}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { step: 1, label: t("admin.rafflePurchases.workflowPending"), icon: CreditCard },
                  { step: 2, label: t("admin.rafflePurchases.workflowPaid"), icon: WalletCards },
                  { step: 3, label: t("admin.rafflePurchases.workflowCompleted"), icon: Check },
                ].map(({ step, label, icon: Icon }) => (
                  <div
                    key={step}
                    className={`flex items-center gap-2.5 rounded-[3px] border p-3 transition-all ${
                      currentStep === step
                        ? "border-accent/30 bg-accent/10 text-accent"
                        : currentStep > step
                          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 opacity-70"
                          : "border-white/5 bg-white/1 text-white/30"
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] text-[10px] font-black ${
                        currentStep > step
                          ? "bg-emerald-400 text-black"
                          : currentStep === step
                            ? "bg-accent text-white"
                            : "bg-white/10 text-white/40"
                      }`}
                    >
                      {currentStep > step ? "✓" : step}
                    </div>
                    <div className="min-w-0">
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase">
                        <Icon className="h-3 w-3 shrink-0" />
                        {label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </AdminSection>
          )}

          {/* Actions */}
          {!isCancelled && (
            <AdminSection>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#84849b] mb-3">
                {t("admin.orders.manualStatusChange")}
              </p>
              <div className="flex flex-wrap gap-2">
                {detail.order.status === "PENDING_PAYMENT" && (
                  <button
                    type="button"
                    onClick={() => updateOrderStatus("PAID")}
                    className="inline-flex items-center gap-1.5 rounded-[3px] border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    {t("admin.rafflePurchases.markPaid")}
                  </button>
                )}
                {detail.order.status !== "PENDING_PAYMENT" && detail.order.status !== "CANCELLED" && (
                  <button
                    type="button"
                    onClick={() => updateOrderStatus("PENDING_PAYMENT")}
                    className="inline-flex items-center gap-1.5 rounded-[3px] border border-white/10 bg-white/5 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-[#84849b] hover:text-white cursor-pointer"
                  >
                    {t("admin.rafflePurchases.resetToPending")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => canCancel && updateOrderStatus("CANCELLED")}
                  disabled={!canCancel}
                  className={`inline-flex items-center gap-1.5 rounded-[3px] border px-4 py-2.5 text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                    detail.order.status === "CANCELLED"
                      ? "border-red-500/30 bg-red-500/10 text-red-400"
                      : canCancel
                        ? "border-white/10 bg-white/5 text-[#84849b] hover:text-red-400"
                        : "border-white/5 bg-white/1 text-white/20 cursor-not-allowed"
                  }`}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  {t("admin.rafflePurchases.cancelOrder")}
                </button>
              </div>
              <p className="mt-3 text-[10px] text-[#84849b]">
                {t("admin.rafflePurchases.markPaidHint")}
              </p>
            </AdminSection>
          )}

          {/* Assigned tickets */}
          {detail.assignedTickets.length > 0 && (
            <AdminSection>
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent mb-3">
                <Ticket className="h-3.5 w-3.5" />
                {t("admin.rafflePurchases.assignedTickets")}
              </p>
              <div className="flex flex-wrap gap-2">
                {detail.assignedTickets.map((n) => (
                  <span
                    key={n}
                    className="rounded-[3px] border border-accent/20 bg-accent/10 px-2.5 py-1 font-mono text-xs font-black text-accent"
                  >
                    #{n}
                  </span>
                ))}
              </div>
            </AdminSection>
          )}

          {/* Payment details */}
          {orderForPayout && (
            <>
              <OrderDetailPayoutDetails
                order={orderForPayout}
                onOpenProofModal={() => setProofOpen(true)}
              />
              {!buyerProof && (
                <AdminSection>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#84849b] mb-3">
                    {t("admin.orders.buyerProofTitle")}
                  </p>
                  <p className="text-[10px] text-[#84849b] mb-3">
                    {t("admin.rafflePurchases.uploadBuyerProofHint")}
                  </p>
                  <label className="block rounded-[3px] border border-dashed border-white/10 bg-white/2 p-4 transition-colors hover:border-accent/30 cursor-pointer">
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
                    <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-accent">
                      {uploadingProof ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      {t("checkout.uploadProof")}
                    </span>
                  </label>
                  {proofUploadError && (
                    <p className="mt-2 text-[10px] font-bold uppercase text-red-300">
                      {proofUploadError}
                    </p>
                  )}
                </AdminSection>
              )}
              <PaymentProofModal
                open={proofOpen}
                onClose={() => setProofOpen(false)}
                proofUrl={buyerProofUrl}
                proof={buyerProof}
                title={t("admin.orders.buyerProof")}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
