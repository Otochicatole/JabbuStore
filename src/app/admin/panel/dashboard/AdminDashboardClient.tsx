"use client";

import React from 'react';
import { AdminDashboard } from '@/features/admin/ui/AdminDashboard';
import { StoreItem, AdminUser } from '@/features/admin/domain/types';

interface AdminDashboardClientProps {
  initialItems: StoreItem[];
  adminUser: AdminUser;
}

export function AdminDashboardClient({ initialItems, adminUser }: AdminDashboardClientProps) {
  return <AdminDashboard initialItems={initialItems} adminUser={adminUser} />;
}
