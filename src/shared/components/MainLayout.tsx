"use client";

import { Suspense, useState } from "react";
import { Navbar } from "@/shared/components/Navbar";
import { CartProvider } from "@/features/cart/context/CartContext";
import { InventoryProvider } from "@/features/inventory/context/InventoryContext";
import { FilterProvider } from "@/features/filters/context/FilterContext";
import { CartSidebar } from "@/features/cart/ui/CartSidebar";
import { useParams, usePathname } from "next/navigation";
import { I18nProvider } from "@/shared/i18n/I18nProvider";
import { TicketNotificationProvider } from "@/features/tickets/ui/TicketNotificationProvider";
import { NotificationProvider } from "@/features/notifications/context/NotificationContext";
import { ProfileCompletionModal } from "@/shared/components/ProfileCompletionModal";
import { DEFAULT_LOCALE, isLocale, stripLocaleFromPathname } from "@/shared/i18n/routing";
import { ActiveRafflesWidget } from "@/features/raffles/ui/ActiveRafflesWidget";
import { CurrencyProvider } from "@/features/currency/context/CurrencyContext";

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const params = useParams<{ language?: string }>();
  const pathname = usePathname();
  const locale = isLocale(params?.language) ? params.language : DEFAULT_LOCALE;
  const normalizedPathname = stripLocaleFromPathname(pathname);
  const isAdminRoute = normalizedPathname.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <I18nProvider initialLocale={locale}>
        <Suspense fallback={null}>
          <CartProvider>
            <FilterProvider>
              <InventoryProvider>
                <div className="min-h-screen min-w-0 bg-background overflow-x-hidden">
                  {children}
                </div>
              </InventoryProvider>
            </FilterProvider>
          </CartProvider>
        </Suspense>
      </I18nProvider>
    );
  }

  return (
    <I18nProvider initialLocale={locale}>
      <Suspense fallback={null}>
        <CurrencyProvider>
        <CartProvider>
          <FilterProvider>
            <InventoryProvider>
              <NotificationProvider actor="USER" enabled>
                <TicketNotificationProvider actor="USER" enabled>
                  <div className="min-h-screen min-w-0 overflow-x-hidden">
                    <Navbar onOpenCart={() => setIsCartOpen(true)} />
                    <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
                    <ProfileCompletionModal />
                    <ActiveRafflesWidget />
                    {children}
                  </div>
                </TicketNotificationProvider>
              </NotificationProvider>
            </InventoryProvider>
          </FilterProvider>
        </CartProvider>
        </CurrencyProvider>
      </Suspense>
    </I18nProvider>
  );
};
