"use client";

import React, { Suspense } from 'react';
import { AdminDashboard } from '@/features/admin/ui/AdminDashboard';
import { StoreItem, AdminUser } from '@/features/admin/domain/types';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/shared/i18n/I18nProvider';

interface AdminDashboardClientProps {
  initialItems: StoreItem[];
  adminUser: AdminUser;
}

export function AdminDashboardClient({ initialItems, adminUser }: AdminDashboardClientProps) {
  const { t } = useI18n();
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] w-full">
        <Loader2 className="w-8 h-8 animate-spin text-accent mb-2" />
        <span className="text-xs text-[#84849b] font-black uppercase tracking-wider font-mono">{t("admin.common.loadingPanel")}</span>
      </div>
    }>
      <AdminDashboard initialItems={initialItems} adminUser={adminUser} />
    </Suspense>
  );
}
