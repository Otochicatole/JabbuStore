import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Loader2, Tag } from 'lucide-react';
import { Order } from '../../domain/types';
import { BACKEND_URL } from '@/shared/lib/api';
import { OrderDetailRow } from './OrderDetailRow';

export function ListingsTab() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for dynamically resolved historical skin details (floats and patterns)
  const [resolvedItemsMap, setResolvedItemsMap] = useState<Record<string, { float: number | null; pattern: number | null; rarity?: string; exterior?: string }>>({});

  const fetchOrders = async () => {
    setLoadingOrders(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/orders/all`, {
        headers: {
          'X-Tunnel-Skip-AntiPhishing-Page': 'true',
        },
        credentials: 'include'
      });
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!response.ok) throw new Error('Error al cargar las órdenes de venta.');
      const data: Order[] = await response.json();
      const filtered = data.filter(o => o.type === 'SELL');
      setOrders(filtered);
      resolveMissingItemDetails(filtered);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cargar órdenes de venta.');
    } finally {
      setLoadingOrders(false);
    }
  };

  const resolveMissingItemDetails = async (ordersList: Order[]) => {
    const missingAssetIds = new Set<string>();
    ordersList.forEach(order => {
      order.items?.forEach(item => {
        if ((item.float === null || item.float === undefined) && !resolvedItemsMap[item.assetId]) {
          missingAssetIds.add(item.assetId);
        }
      });
    });

    if (missingAssetIds.size === 0) return;

    console.log(`[Admin Listings] Resolving missing details for ${missingAssetIds.size} assets...`);

    const fetchPromises = Array.from(missingAssetIds).map(async (assetId) => {
      try {
        const response = await fetch(`${BACKEND_URL}/admin/marketplace/items/details/${assetId}`, {
          headers: {
            'X-Tunnel-Skip-AntiPhishing-Page': 'true',
          },
          credentials: 'include'
        });
        if (response.ok) {
          const details = await response.json();
          return { assetId, details };
        }
      } catch (err) {
        console.error(`Error resolving details for asset ${assetId}:`, err);
      }
      return null;
    });

    const results = await Promise.all(fetchPromises);
    const newResolutions: Record<string, { float: number | null; pattern: number | null; rarity?: string; exterior?: string }> = {};

    results.forEach(res => {
      if (res && res.details) {
        newResolutions[res.assetId] = {
          float: res.details.float,
          pattern: res.details.pattern,
          rarity: res.details.rarity,
          exterior: res.details.exterior
        };
      }
    });

    if (Object.keys(newResolutions).length > 0) {
      setResolvedItemsMap(prev => ({
        ...prev,
        ...newResolutions
      }));
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Tunnel-Skip-AntiPhishing-Page': 'true',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Error actualizando estado.');
      await fetchOrders(); // Refresh orders
    } catch (err: any) {
      alert(err.message);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-3">
            <Tag className="w-5 h-5 text-accent" />
            Órdenes de Venta
          </h2>
          <p className="text-xs text-[#84849b] mt-1 font-medium">Solicitudes de venta de los usuarios. Cada tarjeta agrupa todos los items de una orden.</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loadingOrders}
          className="flex items-center gap-2 h-10 px-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin text-accent' : ''}`} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loadingOrders ? (
        <div className="flex justify-center py-20 bg-[#110f1e]/40 border border-white/5 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-[#110f1e]/40 rounded-2xl border border-white/5">
          <p className="text-[#84849b] font-bold">No hay órdenes de venta creadas todavía.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <OrderDetailRow 
              key={order.id} 
              order={order} 
              onUpdateStatus={updateOrderStatus} 
              resolvedItemsMap={resolvedItemsMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}
