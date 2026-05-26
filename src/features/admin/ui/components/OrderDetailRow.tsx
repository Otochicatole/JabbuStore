import React, { useState } from 'react';
import { Copy, Check, ChevronDown } from 'lucide-react';
import { Order } from '../../domain/types';
import { rarityColors, getItemRarity, getItemExterior, hashCode } from './utils';

interface OrderDetailRowProps {
  order: Order;
  onUpdateStatus: (orderId: string, newStatus: string) => Promise<void>;
  resolvedItemsMap: Record<string, { float: number | null; pattern: number | null; rarity?: string; exterior?: string }>;
}

export function OrderDetailRow({ order, onUpdateStatus, resolvedItemsMap }: OrderDetailRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyTradeLink = (tradeLink: string) => {
    navigator.clipboard.writeText(tradeLink);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="bg-[#110f1e]/40 border border-white/5 rounded-xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
        <div>
          <span className="text-[10px] text-[#84849b] font-mono block">Order ID</span>
          <span className="font-mono font-bold text-sm">{order.id}</span>
        </div>
        <div>
          <span className="text-[10px] text-[#84849b] font-mono block">Comprador</span>
          <div className="flex items-center gap-2">
            {order.user?.avatar && (
              <img src={order.user.avatar} className="w-5 h-5 rounded-sm" alt="avatar" />
            )}
            <span className="text-sm font-bold">{order.user?.name || 'Usuario desconocido'}</span>
            <span className="text-[10px] text-accent font-mono">({order.user?.steamId})</span>
          </div>
        </div>
        <div>
          <span className="text-[10px] text-[#84849b] font-mono block">Total</span>
          <span className="text-emerald-400 font-black text-lg">${order.totalPrice.toLocaleString()} USD</span>
        </div>
        <div>
          <span className="text-[10px] text-[#84849b] font-mono block">Estado</span>
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
            order.status === 'PENDING_PAYMENT' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
            order.status === 'PAID' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
            order.status === 'TRADE_PENDING' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
            order.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {order.status}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[#84849b] font-mono block mb-1">Acciones (Admin)</span>
          <div className="flex gap-2">
            <button 
              onClick={() => onUpdateStatus(order.id, 'PAID')}
              className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
            >
              Pagado
            </button>
            <button 
              onClick={() => onUpdateStatus(order.id, 'TRADE_PENDING')}
              className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
            >
              Trade
            </button>
            <button 
              onClick={() => onUpdateStatus(order.id, 'COMPLETED')}
              className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
            >
              Completar
            </button>
            <button 
              onClick={() => onUpdateStatus(order.id, 'CANCELLED')}
              className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* Sección Detallada de Cliente y Facturación/Cobro */}
      <div className="mb-6 bg-white/[0.01] border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-white/5">
          <div className="w-1.5 h-4 bg-accent rounded-full animate-pulse" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#84849b] font-mono">
            Detalles del Cliente y Facturación / Cobro
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Columna 1: Datos Personales */}
          <div className="space-y-3">
            <h5 className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono">
              Datos del Cliente
            </h5>
            <div className="space-y-2 bg-white/[0.01] p-3 rounded-xl border border-white/5">
              <div>
                <span className="text-[9px] text-[#84849b] uppercase block font-semibold">Nombre Completo</span>
                <span className="font-bold text-white block mt-0.5">
                  {order.metadata?.firstName || order.metadata?.lastName
                    ? `${order.metadata.firstName || ''} ${order.metadata.lastName || ''}`.trim()
                    : order.user?.name || 'No especificado'}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-[#84849b] uppercase block font-semibold">Email</span>
                <span className="font-bold text-white block mt-0.5 break-all">
                  {order.metadata?.email || 'No especificado'}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-[#84849b] uppercase block font-semibold">Teléfono</span>
                <span className="font-bold text-white block mt-0.5 font-mono">
                  {order.metadata?.phone || 'No especificado'}
                </span>
              </div>
            </div>
          </div>

          {/* Columna 2: Método y Datos de Pago/Cobro */}
          <div className="space-y-3">
            <h5 className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono">
              Método de Pago / Payout
            </h5>
            <div className="space-y-2 bg-white/[0.01] p-3 rounded-xl border border-white/5 min-h-[120px]">
              <div>
                <span className="text-[9px] text-[#84849b] uppercase block font-semibold">Canal Elegido</span>
                <span className="font-bold text-accent block mt-0.5 uppercase tracking-wide">
                  {order.paymentMethod === 'mercado_pago' ? 'Mercado Pago' : 
                   order.paymentMethod === 'paypal' ? 'PayPal' : 
                   order.paymentMethod === 'ethereum' ? 'Ethereum (Web3)' : 
                   order.paymentMethod === 'binance' ? 'Binance Pay' : 
                   order.paymentMethod || 'No especificado'}
                </span>
              </div>

              {order.paymentMethod === 'mercado_pago' && (
                <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5">
                  <div>
                    <span className="text-[9px] text-[#84849b] block">CBU / CVU / Alias</span>
                    <span className="font-bold font-mono text-[10px] text-white block select-all break-all">{order.metadata?.cbu || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#84849b] block">Titular</span>
                    <span className="font-bold text-white block">{order.metadata?.accountHolder || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#84849b] block">CUIL / CUIT</span>
                    <span className="font-bold font-mono text-[10px] text-white block select-all">{order.metadata?.cuil || 'N/A'}</span>
                  </div>
                </div>
              )}

              {order.paymentMethod === 'paypal' && (
                <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5">
                  <div>
                    <span className="text-[9px] text-[#84849b] block">Correo PayPal</span>
                    <span className="font-bold font-mono text-[10px] text-white block select-all break-all">{order.metadata?.cbu || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#84849b] block">Titular</span>
                    <span className="font-bold text-white block">{order.metadata?.accountHolder || 'N/A'}</span>
                  </div>
                </div>
              )}

              {(order.paymentMethod === 'ethereum' || order.paymentMethod === 'binance') && (
                <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5">
                  <div>
                    <span className="text-[9px] text-[#84849b] block">Dirección / Wallet</span>
                    <span className="font-bold font-mono text-[10px] text-white block select-all break-all">{order.metadata?.walletAddress || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#84849b] block">Red Blockchain</span>
                    <span className="font-bold text-white block">{order.metadata?.network || 'N/A'}</span>
                  </div>
                </div>
              )}

              {!order.paymentMethod && (
                <p className="text-[10px] text-white/35 italic mt-2">Sin datos de cobro adicionales.</p>
              )}
            </div>
          </div>

          {/* Columna 3: Steam Trade Link */}
          <div className="space-y-3">
            <h5 className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono">
              Steam Trade Link
            </h5>
            <div className="space-y-3 bg-white/[0.01] p-3 rounded-xl border border-white/5 min-h-[120px] flex flex-col justify-between font-sans">
              <div>
                <span className="text-[9px] text-[#84849b] uppercase block font-semibold">URL de Intercambio</span>
                <span className="font-mono text-[10px] text-white/80 block mt-1 break-all select-all leading-normal">
                  {order.user?.tradeUrl || 'Sin Trade URL registrado en el perfil'}
                </span>
              </div>
              
              {order.user?.tradeUrl && (
                <button
                  onClick={() => order.user.tradeUrl && handleCopyTradeLink(order.user.tradeUrl)}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    copied
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                      : 'bg-white/5 border-white/5 text-[#84849b] hover:text-white hover:bg-white/10 hover:border-white/10 active:scale-95'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 animate-pulse" />
                      <span>Copiado Exitosamente</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Tradelink</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <details className="group">
        <summary className="text-[10px] text-[#84849b] font-black uppercase tracking-widest cursor-pointer hover:text-white transition-colors flex items-center justify-between font-sans">
          <span>Ítems de la orden ({order.items.length})</span>
          <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-3 mt-3">
          {order.items.map(item => {
            const resolvedDetails = resolvedItemsMap[item.assetId] || {};
            const finalFloat = item.float !== null && item.float !== undefined ? item.float : (resolvedDetails.float !== undefined ? resolvedDetails.float : null);
            const finalPattern = item.pattern !== null && item.pattern !== undefined ? item.pattern : (resolvedDetails.pattern !== undefined ? resolvedDetails.pattern : null);
            const finalRarity = item.rarity || resolvedDetails.rarity || getItemRarity(item);
            const finalExterior = item.exterior || resolvedDetails.exterior || getItemExterior(item);
            const finalProvider = item.provider || (item.assetId && typeof item.assetId === 'string' && item.assetId.startsWith("resell-") ? (hashCode(item.assetId) % 2 === 0 ? "youpin" : "buff") : "bots");

            return (
              <div 
                key={item.id} 
                className={`flex flex-col sm:flex-row sm:items-center gap-4 bg-[#110f1e] p-4 rounded-xl border border-white/5 relative overflow-hidden group ${
                  rarityColors[finalRarity] || ''
                }`}
              >
                {/* Icon image */}
                <div className="w-16 h-12 relative bg-white/[0.01] border border-white/[0.02] rounded-lg p-1.5 flex items-center justify-center flex-shrink-0">
                  {item.iconUrl ? (
                    <img src={item.iconUrl} className="w-full h-full object-contain drop-shadow-md" alt={item.name} />
                  ) : (
                    <span className="text-[8px] text-[#84849b] font-mono">No Image</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-extrabold text-white block truncate">{item.name}</span>
                    {finalProvider === 'youpin' && (
                      <span className="text-[8px] font-black uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-mono">Youpin</span>
                    )}
                    {finalProvider === 'buff' && (
                      <span className="text-[8px] font-black uppercase tracking-wider bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-mono">Buff</span>
                    )}
                    {finalProvider === 'bots' && (
                      <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">Bots</span>
                    )}
                    {finalProvider === 'user' && (
                      <span className="text-[8px] font-black uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-mono">Usuario</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[9px] font-mono">
                    {finalExterior && (
                      <span className="text-white/80 font-sans uppercase tracking-wider font-bold bg-white/5 px-1.5 py-0.5 rounded-sm">
                        {finalExterior}
                      </span>
                    )}
                    {finalPattern !== null && finalPattern !== undefined && (
                      <span className="text-[#84849b] bg-white/[0.02] px-1.5 py-0.5 rounded-sm border border-white/5">
                        Semilla: <span className="text-white font-bold">{finalPattern}</span>
                      </span>
                    )}
                    <span className="text-[#84849b] bg-white/[0.02] px-1.5 py-0.5 rounded-sm border border-white/5">
                      AssetID: <span className="text-white font-semibold select-all">{item.assetId}</span>
                    </span>
                  </div>
                </div>

                {/* Float display */}
                {finalFloat !== null && finalFloat !== undefined ? (
                  <div className="sm:w-32 flex-shrink-0">
                    <span className="text-[9px] uppercase tracking-wider font-black text-[#84849b] font-mono block">Float</span>
                    <span className="text-[10px] font-bold font-mono text-white block mt-0.5">
                      {finalFloat.toFixed(8)}
                    </span>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-1 relative">
                      <div 
                        className="h-full bg-accent rounded-full animate-pulse" 
                        style={{ width: `${Math.min(100, finalFloat * 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="sm:w-32 flex-shrink-0">
                    <span className="text-[9px] uppercase tracking-wider font-black text-white/20 font-mono block">Float</span>
                    <span className="text-[10px] text-white/35 font-mono block mt-0.5">N/A</span>
                  </div>
                )}

                {/* Price */}
                <div className="text-right flex-shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                  <span className="text-[9px] uppercase tracking-wider font-black text-[#84849b] font-mono block sm:hidden">Precio</span>
                  <div>
                    <span className="text-sm sm:text-base font-black text-accent">${item.price.toLocaleString()}</span>
                    <span className="text-[9px] text-[#84849b] font-bold block">USD</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
