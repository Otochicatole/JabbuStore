import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Loader2, Search } from 'lucide-react';
import { Order } from '../../domain/types';
import { BACKEND_URL } from '@/shared/lib/api';
import { OrderDetailRow } from './OrderDetailRow';
import { AdminSelect } from '@/shared/components/AdminSelect';

export function PurchasesTab() {
  const router = useRouter();
  const updatingStatusRef = useRef<Set<string>>(new Set());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros interactivos
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // State for dynamically resolved historical skin details (floats and patterns)
  const [resolvedItemsMap, setResolvedItemsMap] = useState<Record<string, { float: number | null, pattern: number | null, rarity?: string, exterior?: string }>>({});

  const getUnknownErrorMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;

  const getErrorMessage = async (response: Response, fallback: string) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json().catch(() => null);
      return data?.error || data?.message || fallback;
    }

    const text = await response.text().catch(() => '');
    return text || fallback;
  };

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
      if (!response.ok) throw new Error('Error al cargar las órdenes.');
      const data: Order[] = await response.json();
      const filtered = data.filter(o => o.type === 'BUY');
      setOrders(filtered);
      resolveMissingItemDetails(filtered);
    } catch (err: unknown) {
      console.error(err);
      setError(getUnknownErrorMessage(err, 'Error al cargar órdenes.'));
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

    console.log(`[Admin Purchases] Resolving missing details for ${missingAssetIds.size} assets...`);

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
    const newResolutions: Record<string, { float: number | null, pattern: number | null, rarity?: string, exterior?: string }> = {};

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
    if (updatingStatusRef.current.has(orderId)) return;

    // Actualización optimista local en memoria para evitar un parpadeo de recarga de red (sin Loader2)
    const originalOrders = [...orders];
    updatingStatusRef.current.add(orderId);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

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
      if (response.status === 401 || response.status === 403) {
        const message = await getErrorMessage(response, 'Tu sesión de admin expiró o no tenés permisos.');
        if (response.status === 401) router.push('/admin/login');
        throw new Error(message);
      }

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Error actualizando estado.'));
      }

      const updatedOrder: Order = await response.json();
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                ...updatedOrder,
                user: order.user,
                items: updatedOrder.items ?? order.items,
              }
            : order,
        ),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error actualizando estado.';
      alert(message);
      // Revertir si falla
      setOrders(originalOrders);
    } finally {
      updatingStatusRef.current.delete(orderId);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchOrders();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-3">
            Solicitudes de Compra
          </h2>
          <p className="text-xs text-[#84849b] mt-1 font-medium">Revisa las compras generadas por los usuarios y aprueba sus trades.</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loadingOrders}
          className="flex items-center justify-center gap-2 h-10 px-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[3px] text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer shrink-0 w-full sm:w-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin text-accent' : ''}`} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-[3px] text-sm">
          {error}
        </div>
      )}

      {/* 🔍 BARRA DE FILTROS PREMIUM */}
      <div className="bg-[#110f1e]/30 border border-white/5 p-4 rounded-[3px] flex flex-col md:flex-row items-center gap-4">
        {/* Búsqueda por Texto */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#84849b]" />
          <input
            type="text"
            placeholder="Buscar por ID de Orden, cliente, SteamID o skins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/2 hover:bg-white/4 focus:bg-[#0f0d1e] border border-white/10 focus:border-accent/40 rounded-[3px] text-xs text-white placeholder-white/25 focus:outline-none transition-all font-mono"
          />
        </div>

        {/* Filtro por Estado */}
        <AdminSelect
          value={statusFilter}
          onChange={setStatusFilter}
          className="w-full md:w-52"
          options={[
            { value: 'all', label: 'Todos los Estados' },
            { value: 'PENDING_PAYMENT', label: 'Pending Payment' },
            { value: 'PAID', label: 'Paid' },
            { value: 'TRADE_PENDING', label: 'Trade Pending' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'CANCELLED', label: 'Cancelled' },
          ]}
        />

        {/* Filtro por Método de Pago */}
        <AdminSelect
          value={paymentFilter}
          onChange={setPaymentFilter}
          className="w-full md:w-56"
          options={[
            { value: 'all', label: 'Todos los Métodos' },
            { value: 'mercado_pago', label: 'Mercado Pago' },
            { value: 'paypal', label: 'PayPal' },
            { value: 'nowpayments', label: 'NowPayments (Crypto)' },
          ]}
        />
      </div>

      {/* Renderizado Condicional */}
      {loadingOrders ? (
        <div className="flex justify-center py-20 bg-[#110f1e]/40 border border-white/5 rounded-[3px]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (() => {
        // Filtrar órdenes en memoria de forma ultra rápida
        const filteredOrders = orders.filter(order => {
          // 1. Filtro de Búsqueda de Texto
          if (searchTerm.trim() !== '') {
            const cleanSearch = searchTerm.toLowerCase().trim();
            const orderIdMatch = order.id.toLowerCase().includes(cleanSearch);
            const userNameMatch = order.user?.name?.toLowerCase().includes(cleanSearch);
            const userSteamIdMatch = order.user?.steamId?.toLowerCase().includes(cleanSearch);
            const itemsMatch = order.items?.some(item => item.name.toLowerCase().includes(cleanSearch) || item.assetId.includes(cleanSearch));
            
            if (!orderIdMatch && !userNameMatch && !userSteamIdMatch && !itemsMatch) {
              return false;
            }
          }

          // 2. Filtro de Estado
          if (statusFilter !== 'all' && order.status !== statusFilter) {
            return false;
          }

          // 3. Filtro de Método de Pago
          if (paymentFilter !== 'all' && order.paymentMethod !== paymentFilter) {
            return false;
          }

          return true;
        });

        if (filteredOrders.length === 0) {
          return (
            <div className="text-center py-20 bg-[#110f1e]/40 rounded-2xl border border-white/5">
              <p className="text-[#84849b] font-bold">No se encontraron órdenes que coincidan con los filtros.</p>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <OrderDetailRow 
                key={order.id} 
                order={order} 
                onUpdateStatus={updateOrderStatus} 
                resolvedItemsMap={resolvedItemsMap}
              />
            ))}
          </div>
        );
      })()}
    </div>
  );
}
