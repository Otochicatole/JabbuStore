"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import type { TicketActor } from "../../domain/types";

interface TicketNotificationContextValue {
  setActiveTicketId: (ticketId: string | null) => void;
}

const TicketNotificationContext = createContext<TicketNotificationContextValue>({
  setActiveTicketId: () => undefined,
});

export function useTicketNotificationContext() {
  return useContext(TicketNotificationContext);
}

export function TicketNotificationProvider({
  actor,
  enabled,
  children,
}: {
  actor: TicketActor;
  enabled: boolean;
  children: React.ReactNode;
}) {
  // Retained only for compatibility with TicketChat interface
  const setActiveTicketId = useCallback((ticketId: string | null) => {
    void ticketId;
    void actor;
    void enabled;
  }, [actor, enabled]);

  const value = useMemo(
    () => ({ setActiveTicketId }),
    [setActiveTicketId],
  );

  return (
    <TicketNotificationContext.Provider value={value}>
      {children}
    </TicketNotificationContext.Provider>
  );
}
