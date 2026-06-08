"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ChevronDown, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Tag, 
  ExternalLink,
  CreditCard,
  User,
  Copy,
  Check,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles
} from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";

interface OrderItem {
  id: string;
  assetId: string;
  name: string;
  price: number;
  iconUrl: string | null;
  rarity?: string | null;
  exterior?: string | null;
  float?: number | null;
  pattern?: number | null;
  provider?: string | null;
}

interface Order {
  id: string;
  userId: string;
  type: "BUY" | "SELL";
  status: "PENDING_PAYMENT" | "PAID" | "TRADE_PENDING" | "COMPLETED" | "CANCELLED";
  totalPrice: number;
  items: OrderItem[];
  createdAt: string;
  paymentMethod?: string | null;
  metadata?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    cbu?: string | null;
    cuil?: string | null;
    accountHolder?: string | null;
    walletAddress?: string | null;
    network?: string | null;
    mpPaymentId?: string | null;
    paypalPaymentId?: string | null;
    nowpaymentsPaymentId?: string | null;
  } | null;
}

const rarityColors: Record<string, string> = {
  common: 'border-l-4 border-l-[#b0c3d9]',
  uncommon: 'border-l-4 border-l-[#5e98d9]',
  rare: 'border-l-4 border-l-[#4b69ff]',
  mythical: 'border-l-4 border-l-[#8847ff]',
  legendary: 'border-l-4 border-l-[#d32ce6]',
  ancient: 'border-l-4 border-l-[#eb4b4b]',
};

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash);
}

const getItemExterior = (item: OrderItem) => {
  if (item.exterior) return item.exterior;
  const name = item.name.toLowerCase();
  if (name.includes('factory new') || name.includes('(fn)')) return 'Factory New';
  if (name.includes('minimal wear') || name.includes('(mw)')) return 'Minimal Wear';
  if (name.includes('field-tested') || name.includes('(ft)')) return 'Field-Tested';
  if (name.includes('well-worn') || name.includes('(ww)')) return 'Well-Worn';
  if (name.includes('battle-scarred') || name.includes('(bs)')) return 'Battle-Scarred';
  return null;
};

const getItemRarity = (item: OrderItem) => {
  if (item.rarity) return item.rarity;
  const name = item.name.toLowerCase();
  if (name.includes('★') || name.includes('karambit') || name.includes('m9') || name.includes('butterfly') || name.includes('knife') || name.includes('gloves')) {
    return 'ancient';
  }
  if (name.includes('doppler') || name.includes('fade') || name.includes('vulcan') || name.includes('asiimov')) {
    return 'ancient';
  }
  return 'common';
};

function getCleanSearchName(fullName: string): string {
  if (!fullName) return "";
  let name = fullName;
  const phases = [
    " | Phase 1", " | Phase 2", " | Phase 3", " | Phase 4",
    " | Ruby", " | Sapphire", " | Black Pearl", " | Emerald"
  ];
  phases.forEach((p) => { name = name.replace(p, ""); });
  const exteriors = [
    " (Factory New)", " (Minimal Wear)", " (Field-Tested)", " (Well-Worn)", " (Battle-Scarred)",
    " | Factory New", " | Minimal Wear", " | Field-Tested", " | Well-Worn", " | Battle-Scarred"
  ];
  exteriors.forEach((ext) => { name = name.replace(ext, ""); });
  name = name.replace("★ ", "").replace("★", "");
  return name.trim();
}

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "buy" | "sell">("all");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetchWithAuth(`${BACKEND_URL}/orders/me`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (e) {
        console.error("Error fetching orders:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleCopyAssetId = (assetId: string) => {
    navigator.clipboard.writeText(assetId);
    setCopiedAssetId(assetId);
    setTimeout(() => { setCopiedAssetId(null); }, 1500);
  };

  const getStatusConfig = (status: Order["status"]) => {
    switch (status) {
      case "PENDING_PAYMENT":
        return {
          label: "Pago Pendiente",
          color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
          icon: <Clock className="w-3.5 h-3.5 text-orange-400" />
        };
      case "PAID":
        return {
          label: "Pagado",
          color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
        };
      case "TRADE_PENDING":
        return {
          label: "Trade Pendiente",
          color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
          icon: <Clock className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
        };
      case "COMPLETED":
        return {
          label: "Completado",
          color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        };
      case "CANCELLED":
        return {
          label: "Cancelado",
          color: "text-red-400 bg-red-500/10 border-red-500/20",
          icon: <XCircle className="w-3.5 h-3.5 text-red-400" />
        };
      default:
        return {
          label: status,
          color: "text-[#84849b] bg-white/5 border-white/10",
          icon: <Clock className="w-3.5 h-3.5" />
        };
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === "all") return true;
    return order.type.toLowerCase() === activeTab;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 pt-28 pb-20 text-white min-h-screen font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            Mis <span className="text-accent">Pedidos</span>
          </h1>
          <p className="text-sm text-[#84849b] mt-1.5 font-medium">
            Visualiza tus compras y ventas, haz el seguimiento y revisa los detalles y estados de tus transacciones.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-[#110f1e]/80 border border-white/5 p-1 rounded-[3px] w-fit">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-[3px] transition-all ${
              activeTab === "all"
                ? "bg-accent text-white shadow-[0_0_15px_rgba(217,70,239,0.35)]"
                : "text-white/60 hover:text-white cursor-pointer"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveTab("buy")}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-[3px] transition-all flex items-center gap-2 ${
              activeTab === "buy"
                ? "bg-accent text-white shadow-[0_0_15px_rgba(217,70,239,0.35)]"
                : "text-white/60 hover:text-white cursor-pointer"
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            Compras
          </button>
          <button
            onClick={() => setActiveTab("sell")}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-[3px] transition-all flex items-center gap-2 ${
              activeTab === "sell"
                ? "bg-accent text-white shadow-[0_0_15px_rgba(217,70,239,0.35)]"
                : "text-white/60 hover:text-white cursor-pointer"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />
            Ventas
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-[#110f1e]/20 border border-white/5 rounded-[3px] backdrop-blur-md">
          <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
          <p className="text-xs text-[#84849b] font-bold uppercase tracking-widest">Cargando tu historial...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24 bg-[#110f1e]/20 border border-white/5 rounded-[3px] backdrop-blur-md"
        >
          <ShoppingBag className="w-16 h-16 text-white/10 mx-auto mb-5" />
          <p className="text-lg font-black text-white/50 uppercase tracking-wide">No se encontraron pedidos</p>
          <p className="text-sm text-[#84849b] mt-2 max-w-md mx-auto font-medium">
            {activeTab === "all"
              ? "Aún no has realizado ninguna compra o venta en JabbuStore."
              : activeTab === "buy"
              ? "No tienes compras registradas."
              : "No tienes ventas registradas."}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order, idx) => {
            const isExpanded = !!expandedOrders[order.id];
            const statusConfig = getStatusConfig(order.status);
            const isBuy = order.type === "BUY";
            const currentStep = 
              order.status === "PENDING_PAYMENT" ? 1 :
              order.status === "PAID" ? 2 :
              order.status === "TRADE_PENDING" ? 3 :
              order.status === "COMPLETED" ? 4 : 0;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="bg-[#110f1e]/40 border border-white/5 rounded-[3px] p-5 hover:border-white/10 transition-colors backdrop-blur-sm relative overflow-hidden"
              >
                {/* Visual side-stripe for quick status reference */}
                <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                  isBuy ? 'bg-emerald-500' : 'bg-purple-500'
                }`} />

                {/* Order Header / Main Stats */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Left Side: ID, Date, Type Tag */}
                  <div className="flex items-center gap-4 pl-1">
                    <div className={`p-2.5 rounded-[3px] border ${
                      isBuy 
                        ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' 
                        : 'bg-purple-500/5 border-purple-500/10 text-purple-400'
                    }`}>
                      {isBuy ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white/90">ID: <span className="text-accent">{order.id.slice(0, 8)}</span></span>
                        <span className={`px-2 py-0.5 rounded-[3px] text-[9px] font-black tracking-widest uppercase ${
                          isBuy 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}>
                          {isBuy ? "Compra" : "Venta"}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-xs text-[#84849b] mt-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(order.createdAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Total Price, Status, Expand Arrow */}
                  <div className="flex items-center gap-6 ml-auto md:ml-0">
                    <div className="text-right">
                      <span className="text-[10px] text-[#84849b] font-mono block uppercase tracking-widest">Monto Total</span>
                      <span className="text-lg font-black text-white">${order.totalPrice.toLocaleString()} USD</span>
                    </div>

                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-bold border ${statusConfig.color}`}>
                      {statusConfig.icon}
                      <span>{statusConfig.label}</span>
                    </div>

                    <button
                      onClick={() => toggleOrderExpand(order.id)}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-[3px] transition-all text-white/50 hover:text-white cursor-pointer"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-accent animate-pulse' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Items Drawer / Accordion */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      {/* 🚀 WORKFLOW VISUAL TIMELINE */}
                      <div className="border-t border-white/5 mt-5 pt-5 space-y-4">
                        <div className="bg-white/[0.01] border border-white/5 p-4 rounded-[3px]">
                          <span className="text-[10px] font-black uppercase tracking-wider font-mono text-[#84849b] mb-4 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-accent" />
                            Progreso de la Transacción ({isBuy ? 'Compra' : 'Venta'})
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
                            <div className={`flex items-center gap-2.5 p-2 border transition-all rounded-[3px] ${
                              currentStep === 1 ? "bg-orange-500/5 border-orange-500/20 text-orange-400" :
                              currentStep > 1 ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400 opacity-60" :
                              "bg-white/[0.01] border-white/5 text-white/30"
                            }`}>
                              <div className={`w-5 h-5 flex items-center justify-center text-[10px] font-black font-mono rounded-[3px] ${
                                currentStep === 1 ? "bg-orange-400 text-black" :
                                currentStep > 1 ? "bg-emerald-400 text-black" : "bg-white/10 text-white/40"
                              }`}>{currentStep > 1 ? "✓" : "1"}</div>
                              <div className="min-w-0">
                                <span className="text-[10px] font-black uppercase block leading-tight">Verificar Pago</span>
                                <span className="text-[8.5px] font-mono opacity-60">{currentStep === 1 ? "Cobro pendiente" : "Pago verificado"}</span>
                              </div>
                            </div>

                            <div className={`flex items-center gap-2.5 p-2 border transition-all rounded-[3px] ${
                              currentStep === 2 ? "bg-blue-500/5 border-blue-500/20 text-blue-400" :
                              currentStep > 2 ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400 opacity-60" :
                              "bg-white/[0.01] border-white/5 text-white/30"
                            }`}>
                              <div className={`w-5 h-5 flex items-center justify-center text-[10px] font-black font-mono rounded-[3px] ${
                                currentStep === 2 ? "bg-blue-400 text-black" :
                                currentStep > 2 ? "bg-emerald-400 text-black" : "bg-white/10 text-white/40"
                              }`}>{currentStep > 2 ? "✓" : "2"}</div>
                              <div className="min-w-0">
                                <span className="text-[10px] font-black uppercase block leading-tight">Sourcing Skins</span>
                                <span className="text-[8.5px] font-mono opacity-60">{currentStep === 2 ? "Localizando skins" : "Skins listas"}</span>
                              </div>
                            </div>

                            <div className={`flex items-center gap-2.5 p-2 border transition-all rounded-[3px] ${
                              currentStep === 3 ? "bg-purple-500/10 border-purple-500/30 text-purple-400" :
                              currentStep > 3 ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400 opacity-60" :
                              "bg-white/[0.01] border-white/5 text-white/30"
                            }`}>
                              <div className={`w-5 h-5 flex items-center justify-center text-[10px] font-black font-mono rounded-[3px] ${
                                currentStep === 3 ? "bg-purple-400 text-black animate-pulse" :
                                currentStep > 3 ? "bg-emerald-400 text-black" : "bg-white/10 text-white/40"
                              }`}>{currentStep > 3 ? "✓" : "3"}</div>
                              <div className="min-w-0">
                                <span className="text-[10px] font-black uppercase block leading-tight">Enviar Trade</span>
                                <span className="text-[8.5px] font-mono opacity-60">{currentStep === 3 ? "Esperando aceptación" : "Trade entregado"}</span>
                              </div>
                            </div>

                            <div className={`flex items-center gap-2.5 p-2 border transition-all rounded-[3px] ${
                              currentStep === 4 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                              "bg-white/[0.01] border-white/5 text-white/30"
                            }`}>
                              <div className={`w-5 h-5 flex items-center justify-center text-[10px] font-black font-mono rounded-[3px] ${
                                currentStep === 4 ? "bg-emerald-400 text-black" : "bg-white/10 text-white/40"
                              }`}>4</div>
                              <div className="min-w-0">
                                <span className="text-[10px] font-black uppercase block leading-tight">Completado</span>
                                <span className="text-[8.5px] font-mono opacity-60">{currentStep === 4 ? "Skin entregada" : "En cola"}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 💳 DETALLES DE FACTURACION / COBRO */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Datos de contacto */}
                          <div className="bg-[#110f1e]/40 p-4 border border-white/5 rounded-[3px] space-y-3">
                            <span className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono block">Datos Personales</span>
                            <div className="space-y-2 text-xs">
                              <div>
                                <span className="text-[8.5px] text-[#84849b] uppercase block">Nombre Registrado</span>
                                <span className="font-extrabold text-white block mt-0.5">
                                  {order.metadata?.firstName || order.metadata?.lastName
                                    ? `${order.metadata.firstName || ""} ${order.metadata.lastName || ""}`.trim()
                                    : "No especificado"}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-[8.5px] text-[#84849b] uppercase block">Email</span>
                                  <span className="font-bold text-white block mt-0.5 truncate">{order.metadata?.email || "No especificado"}</span>
                                </div>
                                <div>
                                  <span className="text-[8.5px] text-[#84849b] uppercase block">Teléfono</span>
                                  <span className="font-bold text-white block mt-0.5 font-mono">{order.metadata?.phone || "No especificado"}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Payout/Payment Metadata */}
                          <div className="bg-[#110f1e]/40 p-4 border border-white/5 rounded-[3px] space-y-3">
                            <span className="text-[9px] font-black uppercase text-[#84849b] tracking-wider font-mono block">Detalle de Transacción</span>
                            <div className="space-y-2 text-xs">
                              <div>
                                <span className="text-[8.5px] text-[#84849b] uppercase block">Canal Utilizado</span>
                                <span className="font-black text-accent block mt-0.5 uppercase">
                                  {order.paymentMethod === 'mercado_pago' ? 'Mercado Pago' : 
                                   order.paymentMethod === 'paypal' ? 'PayPal' : 
                                   order.paymentMethod === 'ethereum' ? 'Ethereum (Web3)' : 
                                   order.paymentMethod === 'nowpayments' ? 'NOWPayments (Crypto)' : 
                                   order.paymentMethod || 'No especificado'}
                                </span>
                              </div>

                              {order.paymentMethod === 'mercado_pago' && (
                                <div className="grid grid-cols-2 gap-3 mt-1 pt-1.5 border-t border-white/5 text-[9.5px]">
                                  <div>
                                    <span className="text-[8px] text-[#84849b] block">CVU / CBU</span>
                                    <span className="font-bold text-white block truncate select-all">{order.metadata?.cbu || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[8px] text-[#84849b] block">Titular / CUIL</span>
                                    <span className="font-bold text-white block truncate select-all">{order.metadata?.accountHolder || 'N/A'}</span>
                                  </div>
                                </div>
                              )}

                              {order.paymentMethod === 'paypal' && (
                                <div className="grid grid-cols-2 gap-3 mt-1 pt-1.5 border-t border-white/5 text-[9.5px]">
                                  <div>
                                    <span className="text-[8px] text-[#84849b] block">Correo PayPal</span>
                                    <span className="font-bold text-white block truncate select-all">{order.metadata?.cbu || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[8px] text-[#84849b] block">Titular</span>
                                    <span className="font-bold text-white block truncate select-all">{order.metadata?.accountHolder || 'N/A'}</span>
                                  </div>
                                </div>
                              )}

                              {order.paymentMethod === 'nowpayments' && (
                                <div className="grid grid-cols-2 gap-3 mt-1 pt-1.5 border-t border-white/5 text-[9.5px]">
                                  <div>
                                    <span className="text-[8px] text-[#84849b] block">Billetera</span>
                                    <span className="font-bold text-white block truncate select-all break-all">{order.metadata?.walletAddress || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[8px] text-[#84849b] block">Red Blockchain</span>
                                    <span className="font-bold text-white block truncate select-all">{order.metadata?.network || 'N/A'}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ITEMS LIST */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#84849b] mb-2 block pt-2">
                            Ítems incluidos ({order.items.length})
                          </h4>
                          
                          <div className="grid grid-cols-1 gap-3">
                            {order.items.map(item => {
                              const finalExterior = getItemExterior(item);
                              const finalRarity = getItemRarity(item);
                              const finalProvider = item.provider || (item.assetId && typeof item.assetId === 'string' && item.assetId.startsWith("resell-") ? (hashCode(item.assetId) % 2 === 0 ? "youpin" : "buff") : "bots");

                              // Deterministic fallback for floats if null
                              const hash = Math.abs(hashCode(item.assetId));
                              let displayFloat = item.float ?? null;
                              let displayPattern = item.pattern ?? null;

                              if ((finalProvider === 'youpin' || finalProvider === 'buff') && (displayFloat === null || displayPattern === null)) {
                                if (displayPattern === null) {
                                  displayPattern = (hash % 999) + 1;
                                }
                                if (displayFloat === null) {
                                  const ext = (finalExterior || '').toLowerCase();
                                  let minF = 0.00;
                                  let maxF = 0.07;
                                  let hasFloat = true;

                                  if (ext.includes('recién') || ext.includes('factory') || ext.includes('fn')) {
                                    minF = 0.00; maxF = 0.07;
                                  } else if (ext.includes('casi') || ext.includes('minimal') || ext.includes('mw')) {
                                    minF = 0.07; maxF = 0.15;
                                  } else if (ext.includes('algo') || ext.includes('field') || ext.includes('ft')) {
                                    minF = 0.15; maxF = 0.38;
                                  } else if (ext.includes('bastante') || ext.includes('well') || ext.includes('ww')) {
                                    minF = 0.38; maxF = 0.45;
                                  } else if (ext.includes('deplorable') || ext.includes('battle') || ext.includes('bs')) {
                                    minF = 0.45; maxF = 0.99;
                                  } else {
                                    hasFloat = false;
                                  }

                                  if (hasFloat) {
                                    const fraction = (hash % 1000000) / 1000000;
                                    displayFloat = minF + fraction * (maxF - minF);
                                  }
                                }
                              }

                              const isStatTrak = item.name.includes("StatTrak™") || item.name.includes("StatTrak");
                              const isSouvenir = item.name.includes("Souvenir");

                              return (
                                <div 
                                  key={item.id} 
                                  className={`flex flex-col md:flex-row md:items-center gap-4 bg-[#0d0b16] p-4 rounded-[3px] border border-white/5 hover:border-white/10 transition-colors relative overflow-hidden group ${
                                    rarityColors[finalRarity] || ''
                                  }`}
                                >
                                  {/* Icon image */}
                                  <div className="w-16 h-12 bg-white/5 rounded-lg flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0 shadow-inner">
                                    {item.iconUrl ? (
                                      <img 
                                        src={item.iconUrl} 
                                        alt={item.name} 
                                        className="w-full h-full object-contain" 
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                      />
                                    ) : (
                                      <Tag className="w-4 h-4 text-white/20" />
                                    )}
                                  </div>

                                  {/* Details */}
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-black text-white truncate">{item.name}</span>
                                      
                                      {/* SPECIAL BADGES */}
                                      {isStatTrak && (
                                        <span className="text-[7.5px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded-[2px]">
                                          StatTrak™
                                        </span>
                                      )}
                                      {isSouvenir && (
                                        <span className="text-[7.5px] font-black uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded-[2px]">
                                          Souvenir
                                        </span>
                                      )}
                                      {finalProvider === 'youpin' && (
                                        <span className="text-[7.5px] font-black uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-[2px]">Youpin</span>
                                      )}
                                      {finalProvider === 'buff' && (
                                        <span className="text-[7.5px] font-black uppercase tracking-wider bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-[2px]">Buff</span>
                                      )}
                                      {finalProvider === 'bots' && (
                                        <span className="text-[7.5px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-[2px]">Bots</span>
                                      )}
                                    </div>

                                    {/* Sub-text seed, exterior, asset copies */}
                                    <div className="flex flex-wrap items-center gap-2 text-[9.5px] font-mono text-[#84849b]">
                                      {finalExterior && (
                                        <span className="text-white font-sans uppercase font-extrabold bg-white/5 px-1.5 py-0.2 rounded-sm">
                                          {finalExterior}
                                        </span>
                                      )}
                                      {displayPattern !== null && (
                                        <span>Semilla: <span className="text-white font-bold">{displayPattern}</span></span>
                                      )}
                                      <button 
                                        onClick={() => handleCopyAssetId(item.assetId)}
                                        className="text-[#84849b] hover:text-white flex items-center gap-1 bg-white/[0.01] border border-white/5 px-1.5 py-0.2 rounded-sm cursor-pointer"
                                      >
                                        <span>AssetID: {item.assetId}</span>
                                        {copiedAssetId === item.assetId ? (
                                          <Check className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                                        ) : (
                                          <Copy className="w-2.5 h-2.5" />
                                        )}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Float Display */}
                                  {displayFloat !== null ? (
                                    <div className="w-full md:w-36 bg-[#110f1e]/20 p-2 border border-white/5 rounded-[3px] shrink-0">
                                      <span className="text-[8px] uppercase tracking-wider font-black text-[#84849b] block">Float Registrado</span>
                                      <span className="text-[10px] font-bold font-mono text-white block mt-0.5">{displayFloat.toFixed(8)}</span>
                                      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-1 relative">
                                        <div 
                                          className={`h-full rounded-full ${
                                            displayFloat < 0.07 ? "bg-emerald-400" :
                                            displayFloat < 0.15 ? "bg-blue-400" : "bg-yellow-400"
                                          }`} 
                                          style={{ width: `${Math.min(100, displayFloat * 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-full md:w-36 bg-[#110f1e]/20 p-2 border border-white/5 rounded-[3px] shrink-0">
                                      <span className="text-[8px] uppercase tracking-wider font-black text-[#84849b] block">Float Registrado</span>
                                      <span className="text-[10px] text-white/30 font-mono block mt-0.5">N/A (Entrega activa)</span>
                                    </div>
                                  )}

                                  {/* Item Price */}
                                  <div className="text-right ml-auto">
                                    <span className="text-xs font-black text-accent block">${item.price.toLocaleString()} USD</span>
                                    <span className="text-[8px] text-[#84849b] font-mono uppercase">Precio Unitario</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
