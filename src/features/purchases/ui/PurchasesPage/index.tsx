"use client";

import { PaymentProofModal } from "@/shared/components/PaymentProofModal";

import { PurchaseOrderCard } from "./PurchaseOrderCard";
import { PurchasesHeader } from "./PurchasesHeader";
import { PurchasesEmpty, PurchasesError, PurchasesLoading } from "./PurchasesStates";
import { usePurchases } from "./usePurchases";

export function PurchasesPage() {
  const {
    activeTab,
    error,
    expandedOrders,
    fetchOrders,
    filteredOrders,
    loading,
    locale,
    orders,
    selectedProof,
    setActiveTab,
    setSelectedProof,
    t,
    toggleOrderExpand,
  } = usePurchases();

  return (
    <div className="max-w-6xl mx-auto px-6 pt-28 pb-20 text-white min-h-screen font-sans">
      <PurchasesHeader
        activeTab={activeTab}
        loading={loading}
        onRefresh={fetchOrders}
        onTabChange={setActiveTab}
        t={t}
      />

      {error && (
        <PurchasesError error={error} loading={loading} onRetry={fetchOrders} t={t} />
      )}

      {loading && orders.length === 0 ? (
        <PurchasesLoading t={t} />
      ) : filteredOrders.length === 0 ? (
        <PurchasesEmpty activeTab={activeTab} t={t} />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order, index) => (
            <PurchaseOrderCard
              key={order.id}
              expanded={!!expandedOrders[order.id]}
              index={index}
              locale={locale}
              onOpenProof={setSelectedProof}
              onToggle={() => toggleOrderExpand(order.id)}
              order={order}
              t={t}
            />
          ))}
        </div>
      )}

      <PaymentProofModal
        open={!!selectedProof}
        onClose={() => setSelectedProof(null)}
        proofUrl={selectedProof?.url || null}
        proof={selectedProof?.proof || null}
        title={selectedProof?.title || t("purchases.paymentProof")}
      />
    </div>
  );
}
