"use client";

import { Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

import { CreateTicketForm } from "./CreateTicketForm";
import { TicketChatPortal } from "./TicketChatPortal";
import { TicketPageHeader } from "./TicketPageHeader";
import { TicketsAuthLoading, TicketsLoginRequired } from "./TicketsAuthStates";
import { TicketsError, TicketsListPanel } from "./TicketsListPanel";
import { useUserTickets } from "./useUserTickets";

export function UserTicketsPage() {
  return (
    <Suspense fallback={<TicketsSuspenseFallback />}>
      <UserTicketsPageContent />
    </Suspense>
  );
}

function UserTicketsPageContent() {
  const tickets = useUserTickets();

  if (tickets.authLoading) {
    return <TicketsAuthLoading t={tickets.t} />;
  }

  if (!tickets.profile) {
    return <TicketsLoginRequired />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-20 text-white min-h-screen font-sans relative">
      <div className="absolute top-20 left-1/4 -z-10 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
      <div className="absolute bottom-20 right-1/4 -z-10 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />

      <TicketPageHeader
        loading={tickets.loading}
        onNewTicket={tickets.handleNewTicketClick}
        onRefresh={() => tickets.loadTickets()}
        t={tickets.t}
      />

      {tickets.error && <TicketsError error={tickets.error} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <TicketsListPanel
          filteredTickets={tickets.filteredTickets}
          loading={tickets.loading}
          locale={tickets.locale}
          selectedTicketId={tickets.selected?.id}
          statusFilter={tickets.statusFilter}
          ticketsCount={tickets.tickets.length}
          onSelectTicket={tickets.handleSelectTicket}
          onStatusFilterChange={tickets.setStatusFilter}
          t={tickets.t}
        />

        <AnimatePresence mode="wait">
          {tickets.showCreateForm && (
            <CreateTicketForm
              creating={tickets.creating}
              formError={tickets.formError}
              message={tickets.message}
              orderOptions={tickets.orderOptions}
              orders={tickets.orders}
              ordersLoading={tickets.ordersLoading}
              selectedOrderId={tickets.selectedOrderId}
              subject={tickets.subject}
              onClose={tickets.handleCloseCreateForm}
              onMessageChange={tickets.setMessage}
              onOrderChange={tickets.setSelectedOrderId}
              onSubmit={tickets.handleCreateTicket}
              onSubjectChange={tickets.setSubject}
              t={tickets.t}
            />
          )}
        </AnimatePresence>
      </div>

      {tickets.selected && (
        <TicketChatPortal
          selected={tickets.selected}
          onClose={tickets.handleCloseChat}
          onTicketUpdated={() => tickets.loadTickets(true)}
          t={tickets.t}
        />
      )}
    </div>
  );
}

function TicketsSuspenseFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen pt-28 text-white font-sans">
      <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
      <p className="text-xs text-[#8984a1] font-bold uppercase tracking-widest">Cargando...</p>
    </div>
  );
}
