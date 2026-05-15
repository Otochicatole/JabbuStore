"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Package, CheckCircle, Clock, XCircle } from "lucide-react";
import { BACKEND_URL } from "@/shared/lib/api";

export default function UserPurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/marketplace/user/purchases`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPurchases(data);
        }
      } catch (e) {
        console.error("Error fetching purchases", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, []);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'paid':
      case 'trade_accepted': return <CheckCircle className="text-green-500 w-5 h-5" />;
      case 'pending_payment':
      case 'trade_pending':
      case 'trade_sent': return <Clock className="text-yellow-500 w-5 h-5" />;
      default: return <XCircle className="text-red-500 w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-white min-h-screen">
      <h1 className="text-3xl font-black mb-8 uppercase tracking-tighter">
        Mis <span className="text-accent">Compras</span>
      </h1>

      {loading ? (
        <div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-20 bg-card border border-white/5 rounded-2xl">
          <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-[#84849b] font-bold">Aún no has realizado ninguna compra.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <motion.div 
              key={purchase.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-white/5 rounded-2xl p-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center p-2">
                  <img src={purchase.listing?.iconUrl || '/skin.webp'} alt="Skin" className="object-contain" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">ID: {purchase.listing?.skinId || 'Skin'}</h3>
                  <p className="text-xs text-gray-400">Fecha: {new Date(purchase.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="text-xl font-black text-accent">${purchase.finalPrice.toFixed(2)}</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(purchase.status)}
                  <span className="text-xs font-bold uppercase">{purchase.status.replace('_', ' ')}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
