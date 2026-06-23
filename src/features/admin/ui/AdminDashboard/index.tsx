"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { AdminDashboardProps } from '../../domain/types';
import { InventoryTab } from './InventoryTab';
import { PurchasesTab } from './PurchasesTab';
import { ListingsTab } from './ListingsTab';
import { BotsTab } from './BotsTab';
import { MarketCatalog } from '@/features/market/ui/MarketCatalog';
import { AdminTicketsTab } from '@/features/tickets/ui/AdminTicketsTab';

export function AdminDashboard({ initialItems }: AdminDashboardProps) {
  const searchParams = useSearchParams();
  const currentTab = (searchParams.get('tab') as 'inventory' | 'market' | 'purchases' | 'listings' | 'tickets' | 'bots' | 'settings') || 'inventory';

  return (
    <div className="min-h-screen bg-[#070510] text-white">
      {/* Main Container */}
      <main className="w-full px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8">
        {currentTab === 'inventory' && (
          <InventoryTab initialItems={initialItems} />
        )}

        {currentTab === 'market' && (
          <MarketCatalog />
        )}

        {currentTab === 'purchases' && (
          <PurchasesTab />
        )}

        {currentTab === 'listings' && (
          <ListingsTab />
        )}

        {currentTab === 'tickets' && (
          <AdminTicketsTab />
        )}

        {currentTab === 'settings' && (
          <div className="w-full min-h-[calc(100vh-180px)] rounded-2xl overflow-hidden bg-[#110f1e]/20 border border-white/5">
            <iframe src="/admin/panel/settings" className="w-full h-full min-h-[calc(100vh-180px)] bg-transparent" />
          </div>
        )}

        {currentTab === 'bots' && (
          <BotsTab />
        )}
      </main>
    </div>
  );
}
export default AdminDashboard;
