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
  ExternalLink 
} from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";

interface OrderItem {
  id: string;
  assetId: string;
  name: string;
  price: number;
  iconUrl: string | null;
}

interface Order {
  id: string;
  userId: string;
  type: "BUY" | "SELL";
  status: "PENDING_PAYMENT" | "PAID" | "TRADE_PENDING" | "COMPLETED" | "CANCELLED";
  totalPrice: number;
  items: OrderItem[];
  createdAt: string;
}

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "buy" | "sell">("all");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

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
          icon: <Clock className="w-3.5 h-3.5 text-purple-400" />
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
            Visualiza tus compras y ventas, haz el seguimiento y revisa los estados de tus transacciones.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-[#110f1e]/80 border border-white/5 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
              activeTab === "all"
                ? "bg-accent text-white shadow-[0_0_15px_rgba(217,70,239,0.35)]"
                : "text-white/60 hover:text-white"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveTab("buy")}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "buy"
                ? "bg-accent text-white shadow-[0_0_15px_rgba(217,70,239,0.35)]"
                : "text-white/60 hover:text-white"
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            Compras
          </button>
          <button
            onClick={() => setActiveTab("sell")}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "sell"
                ? "bg-accent text-white shadow-[0_0_15px_rgba(217,70,239,0.35)]"
                : "text-white/60 hover:text-white"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />
            Ventas
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-[#110f1e]/20 border border-white/5 rounded-3xl backdrop-blur-md">
          <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
          <p className="text-xs text-[#84849b] font-bold uppercase tracking-widest">Cargando tu historial...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24 bg-[#110f1e]/20 border border-white/5 rounded-3xl backdrop-blur-md"
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

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="bg-[#110f1e]/40 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors backdrop-blur-sm"
              >
                {/* Order Header / Main Stats */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Left Side: ID, Date, Type Tag */}
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl border ${
                      isBuy 
                        ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' 
                        : 'bg-purple-500/5 border-purple-500/10 text-purple-400'
                    }`}>
                      {isBuy ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white/90">ID: {order.id.slice(0, 8)}...</span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase ${
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
                      <span className="text-lg font-black text-white">${order.totalPrice.toFixed(2)} USD</span>
                    </div>

                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${statusConfig.color}`}>
                      {statusConfig.icon}
                      <span>{statusConfig.label}</span>
                    </div>

                    <button
                      onClick={() => toggleOrderExpand(order.id)}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white/50 hover:text-white"
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
                      <div className="border-t border-white/5 mt-5 pt-5 space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#84849b] mb-2">
                          Items en este pedido ({order.items.length})
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {order.items.map(item => (
                            <div 
                              key={item.id} 
                              className="flex items-center gap-3 bg-[#0d0b16] p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                            >
                              <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0">
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
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-bold text-white block truncate">{item.name}</span>
                                <span className="text-[9px] text-[#84849b] font-mono truncate block">Asset ID: {item.assetId}</span>
                              </div>
                              <span className="text-xs font-black text-accent ml-2">${item.price.toFixed(2)}</span>
                            </div>
                          ))}
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
