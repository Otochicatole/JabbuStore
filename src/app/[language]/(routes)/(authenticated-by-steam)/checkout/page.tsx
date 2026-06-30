"use client";

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { CheckoutContent } from '@/features/checkout/ui/CheckoutContent';

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center pt-24 bg-[#070510]">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
