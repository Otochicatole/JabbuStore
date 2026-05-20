"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "@/features/cart/context/CartContext";
import { useInventory } from "@/features/inventory/context/InventoryContext";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { 
  CreditCard, 
  Wallet, 
  Coins, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  ArrowLeft,
  DollarSign
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface CheckoutItem {
  assetId: string;
  name: string;
  price: number;
  iconUrl: string | null;
}

const PAYMENT_METHODS = [
  {
    id: "mercado_pago",
    name: "Mercado Pago / Banco",
    description: "Recibe o paga con transferencia, saldo o tarjetas",
    icon: <CreditCard className="w-5 h-5 text-sky-400" />,
    badge: "ARS / CBU / Alias",
    color: "from-sky-500/10 to-sky-500/5 hover:border-sky-500/30 border-white/5"
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Recibe o paga saldo en USD o EUR",
    icon: <Wallet className="w-5 h-5 text-indigo-400" />,
    badge: "USD / PayPal Mail",
    color: "from-indigo-500/10 to-indigo-500/5 hover:border-indigo-500/30 border-white/5"
  },
  {
    id: "ethereum",
    name: "Ethereum (Web3 Wallet)",
    description: "Simula depósito o cobro criptográfico",
    icon: <Coins className="w-5 h-5 text-purple-400" />,
    badge: "ETH / USDT (ERC20)",
    color: "from-purple-500/10 to-purple-500/5 hover:border-purple-500/30 border-white/5"
  },
  {
    id: "binance",
    name: "Binance Pay",
    description: "Simula transacciones vía Binance ID o Pay ID",
    icon: <Coins className="w-5 h-5 text-yellow-400" />,
    badge: "USDT / Binance ID",
    color: "from-yellow-500/10 to-yellow-500/5 hover:border-yellow-500/30 border-white/5"
  }
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { items: cartItems, total: cartTotal, clearCart } = useCart();
  const { selectedItems: sellItems, totalValue: sellTotal, clearSellList } = useInventory();

  const checkoutType = searchParams.get("type") === "sell" ? "sell" : "buy";
  
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // Form input states
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cbu: "",
    cuil: "",
    accountHolder: "",
    walletAddress: "",
    network: "ERC20"
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reset payout fields when payment method changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      cbu: "",
      cuil: "",
      accountHolder: "",
      walletAddress: "",
      network: selectedMethod === "ethereum" ? "ERC20" : selectedMethod === "binance" ? "BinancePay" : "ERC20"
    }));
    setFormErrors({});
  }, [selectedMethod]);

  // Validate items against the backend on mount
  useEffect(() => {
    const validateCheckout = async () => {
      setLoading(true);
      setError(null);
      try {
        let payload: any = {};
        if (checkoutType === "buy") {
          if (cartItems.length === 0) {
            setError("Tu carrito está vacío. Agrega skins para comprar.");
            setLoading(false);
            return;
          }
          payload = {
            type: "BUY",
            itemIds: cartItems.map(i => i.skin.id)
          };
        } else {
          if (sellItems.length === 0) {
            setError("No has seleccionado skins para vender.");
            setLoading(false);
            return;
          }
          payload = {
            type: "SELL",
            items: sellItems.map(i => ({
              assetId: i.id,
              requestedPrice: i.price
            }))
          };
        }

        const res = await fetchWithAuth(`${BACKEND_URL}/orders/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || `Error ${res.status} al validar productos.`);
        }

        setItems(data.items);
        setTotalPrice(data.totalPrice);
      } catch (err: any) {
        console.error("Validation error:", err);
        setError(err.message || "Ocurrió un error inesperado al validar tus productos.");
      } finally {
        setLoading(false);
      }
    };

    validateCheckout();
  }, [checkoutType, cartItems, sellItems]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Basic personal details required for both checkout types
    if (!formData.firstName.trim()) errors.firstName = "El nombre es obligatorio.";
    if (!formData.lastName.trim()) errors.lastName = "El apellido es obligatorio.";
    if (!formData.email.trim()) {
      errors.email = "El correo electrónico es obligatorio.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Correo electrónico no válido.";
    }
    if (!formData.phone.trim()) errors.phone = "El teléfono es obligatorio.";

    // Conditional payout details required ONLY for sell checkouts
    if (checkoutType === "sell" && selectedMethod) {
      if (selectedMethod === "mercado_pago") {
        if (!formData.cbu.trim()) errors.cbu = "El CBU/CVU o Alias es obligatorio.";
        if (!formData.accountHolder.trim()) errors.accountHolder = "El nombre del titular es obligatorio.";
        if (!formData.cuil.trim()) errors.cuil = "El CUIL/CUIT es obligatorio.";
      } else if (selectedMethod === "paypal") {
        if (!formData.cbu.trim()) errors.cbu = "La dirección de correo de PayPal es obligatoria.";
        if (!formData.accountHolder.trim()) errors.accountHolder = "El titular de la cuenta es obligatorio.";
      } else if (selectedMethod === "ethereum") {
        if (!formData.walletAddress.trim()) errors.walletAddress = "La dirección de billetera Ethereum (Web3) es obligatoria.";
      } else if (selectedMethod === "binance") {
        if (!formData.walletAddress.trim()) errors.walletAddress = "El ID de Binance (Pay ID) o dirección de depósito es obligatorio.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSimulatePayment = () => {
    if (!selectedMethod) return;
    if (!validateForm()) {
      // Scroll smoothly to form section if not filled
      const formSection = document.getElementById("checkout-form-section");
      if (formSection) {
        formSection.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    setIsSimulating(true);
    setSimulationStep(1);

    // Step 1: Connecting (1000ms)
    setTimeout(() => {
      setSimulationStep(2);
      
      // Step 2: Validating/Mining (1000ms)
      setTimeout(() => {
        setSimulationStep(3);

        // Step 3: Completing database transaction (1000ms)
        setTimeout(async () => {
          try {
            let res;
            const metadataPayload = {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              cbu: formData.cbu || null,
              cuil: formData.cuil || null,
              accountHolder: formData.accountHolder || null,
              walletAddress: formData.walletAddress || null,
              network: formData.network || null
            };

            if (checkoutType === "buy") {
              res = await fetchWithAuth(`${BACKEND_URL}/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  itemIds: items.map(i => i.assetId),
                  paymentMethod: selectedMethod,
                  metadata: metadataPayload
                })
              });
            } else {
              res = await fetchWithAuth(`${BACKEND_URL}/orders/sell`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  items: items.map(i => ({
                    assetId: i.assetId,
                    requestedPrice: i.price
                  })),
                  paymentMethod: selectedMethod,
                  metadata: metadataPayload
                })
              });
            }

            const data = await res.json();
            if (!res.ok) {
              throw new Error(data?.error || "Error al registrar el pedido final.");
            }

            // If BUY order, we auto-simulate mark as PAID
            if (checkoutType === "buy") {
              await fetchWithAuth(`${BACKEND_URL}/orders/${data.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "PAID" })
              });
            }

            setCreatedOrderId(data.id);
            setIsSuccess(true);
            
            // Clear context states
            if (checkoutType === "buy") {
              clearCart();
            } else {
              clearSellList();
            }

          } catch (err: any) {
            console.error("Submit order error:", err);
            setError(err.message || "La simulación falló al registrar la orden.");
            setIsSimulating(false);
          }
        }, 1000);
      }, 1000);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
        <p className="text-xs text-[#84849b] font-bold uppercase tracking-widest">Validando precios con el servidor...</p>
      </div>
    );
  }

  if (error && !isSimulating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 bg-background px-6">
        <div className="p-8 rounded-3xl bg-red-500/5 border border-red-500/10 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-black text-white uppercase tracking-wider mb-2">Error de Validación</h2>
          <p className="text-sm text-[#84849b] mb-6">{error}</p>
          <Link href={checkoutType === "buy" ? "/buy" : "/sell"} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-xs font-black uppercase text-white tracking-widest transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver a la Tienda
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 bg-background px-6">
        <div className="p-10 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 text-center max-w-lg shadow-2xl shadow-black/40">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-6 animate-bounce" />
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
            {checkoutType === "buy" ? "¡Pago Simulado Exitoso!" : "¡Venta Listada con Éxito!"}
          </h2>
          <p className="text-sm text-emerald-400/90 font-bold uppercase tracking-wider mb-2">
            ID del Pedido: {createdOrderId?.slice(0, 8)}...
          </p>
          <p className="text-xs text-[#84849b] max-w-sm mx-auto leading-relaxed mb-8">
            {checkoutType === "buy" 
              ? "Tu transacción ha sido procesada de manera correcta. El bot de Steam iniciará el envío de tus Skins en breve."
              : "Tus skins han sido ingresadas correctamente en el Marketplace y la transacción está en cola para su validación."
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => router.push("/purchases")} className="px-6 py-3 rounded-xl bg-accent text-white text-xs font-black uppercase tracking-widest transition-all hover:shadow-[0_0_25px_rgba(217,70,239,0.4)]">
              Ver Mis Pedidos
            </button>
            <button onClick={() => router.push("/")} className="px-6 py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 text-white/60 hover:text-white text-xs font-black uppercase tracking-widest transition-all">
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 pt-28 pb-20 text-white min-h-screen font-sans">
      
      {/* Header */}
      <div className="mb-10">
        <Link href={checkoutType === "buy" ? "/buy" : "/sell"} className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-white transition-colors uppercase tracking-widest mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a {checkoutType === "buy" ? "Comprar" : "Vender"}
        </Link>
        <h1 className="text-3xl font-black uppercase tracking-tight">
          Checkout de <span className="text-accent">{checkoutType === "buy" ? "Compra" : "Venta"}</span>
        </h1>
        <p className="text-sm text-[#84849b] mt-1">Verifica tus artículos y proporciona tus datos para simular la transacción.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Forms & Payment Methods */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Card 1: Payment Methods */}
          <section className="bg-card border border-white/5 rounded-3xl p-6 md:p-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-accent rounded-full" />
              1. Selecciona Método de Pago / Cobro
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PAYMENT_METHODS.map((method) => {
                const isSelected = selectedMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`
                      text-left flex flex-col justify-between p-5 rounded-2xl border bg-gradient-to-br transition-all duration-300 relative overflow-hidden group cursor-pointer
                      ${method.color}
                      ${isSelected ? 'border-accent shadow-[0_0_25px_rgba(217,70,239,0.15)] ring-1 ring-accent' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 group-hover:border-white/10 transition-colors">
                        {method.icon}
                      </div>
                      <span className="text-[9px] font-black tracking-widest bg-white/5 px-2 py-0.5 rounded text-white/60">
                        {method.badge}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase text-white tracking-wider mb-1">{method.name}</h3>
                      <p className="text-[10px] text-[#84849b] font-medium leading-relaxed">{method.description}</p>
                    </div>
                    
                    {/* Selected Indicator */}
                    {isSelected && (
                      <span className="absolute top-4 right-4 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Card 2: Billing & Payout details form [NEW] */}
          {selectedMethod && (
            <section id="checkout-form-section" className="bg-card border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 scroll-mt-24">
              <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                <span className="w-1.5 h-4 bg-accent rounded-full" />
                2. {checkoutType === "buy" ? "Datos Personales y de Facturación" : "Datos Personales y Cuenta de Pago"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">Nombre</label>
                  <input
                    type="text"
                    placeholder="Ej. Juan"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`w-full px-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors ${formErrors.firstName ? 'border-red-500/50' : 'border-white/8'}`}
                  />
                  {formErrors.firstName && <span className="text-[10px] text-red-400 font-bold uppercase">{formErrors.firstName}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">Apellido</label>
                  <input
                    type="text"
                    placeholder="Ej. Pérez"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`w-full px-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors ${formErrors.lastName ? 'border-red-500/50' : 'border-white/8'}`}
                  />
                  {formErrors.lastName && <span className="text-[10px] text-red-400 font-bold uppercase">{formErrors.lastName}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors ${formErrors.email ? 'border-red-500/50' : 'border-white/8'}`}
                  />
                  {formErrors.email && <span className="text-[10px] text-red-400 font-bold uppercase">{formErrors.email}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">Teléfono de Contacto</label>
                  <input
                    type="tel"
                    placeholder="Ej. +54 9 11 1234 5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors ${formErrors.phone ? 'border-red-500/50' : 'border-white/8'}`}
                  />
                  {formErrors.phone && <span className="text-[10px] text-red-400 font-bold uppercase">{formErrors.phone}</span>}
                </div>
              </div>

              {/* Dynamic payout inputs for Sell orders */}
              {checkoutType === "sell" && (
                <div className="border-t border-white/5 pt-6 mt-6 space-y-6">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">Destinatario del Pago ({PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name})</h3>
                    <p className="text-[10px] text-[#84849b] mt-0.5">Ingresa los datos del canal donde deseas que enviemos los fondos de tu venta.</p>
                  </div>

                  {(selectedMethod === "mercado_pago" || selectedMethod === "paypal") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">
                          {selectedMethod === "mercado_pago" ? "CBU / CVU o Alias de Destino" : "Dirección de Correo PayPal"}
                        </label>
                        <input
                          type="text"
                          placeholder={selectedMethod === "mercado_pago" ? "Ej. 0000003100012345678901 o alias.mp" : "ejemplo@paypal.com"}
                          value={formData.cbu}
                          onChange={(e) => setFormData({ ...formData, cbu: e.target.value })}
                          className={`w-full px-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors font-mono ${formErrors.cbu ? 'border-red-500/50' : 'border-white/8'}`}
                        />
                        {formErrors.cbu && <span className="text-[10px] text-red-400 font-bold uppercase">{formErrors.cbu}</span>}
                      </div>

                      <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">Nombre y Apellido del Titular</label>
                        <input
                          type="text"
                          placeholder="Como figura en la cuenta"
                          value={formData.accountHolder}
                          onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                          className={`w-full px-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors ${formErrors.accountHolder ? 'border-red-500/50' : 'border-white/8'}`}
                        />
                        {formErrors.accountHolder && <span className="text-[10px] text-red-400 font-bold uppercase">{formErrors.accountHolder}</span>}
                      </div>

                      {selectedMethod === "mercado_pago" && (
                        <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">CUIL / CUIT del Beneficiario</label>
                          <input
                            type="text"
                            placeholder="Ej. 20-35123456-9"
                            value={formData.cuil}
                            onChange={(e) => setFormData({ ...formData, cuil: e.target.value })}
                            className={`w-full px-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors font-mono ${formErrors.cuil ? 'border-red-500/50' : 'border-white/8'}`}
                          />
                          {formErrors.cuil && <span className="text-[10px] text-red-400 font-bold uppercase">{formErrors.cuil}</span>}
                        </div>
                      )}
                    </div>
                  )}

                  {(selectedMethod === "ethereum" || selectedMethod === "binance") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">
                          {selectedMethod === "ethereum" ? "Dirección de Billetera Ethereum / Web3" : "Dirección de Depósito / Pay ID"}
                        </label>
                        <input
                          type="text"
                          placeholder={selectedMethod === "ethereum" ? "Ej. 0x71C7656EC7ab88b098defB751B7401B5f6d8976F" : "Ej. Pay ID 4819401 o wallet address"}
                          value={formData.walletAddress}
                          onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                          className={`w-full px-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors font-mono ${formErrors.walletAddress ? 'border-red-500/50' : 'border-white/8'}`}
                        />
                        {formErrors.walletAddress && <span className="text-[10px] text-red-400 font-bold uppercase">{formErrors.walletAddress}</span>}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">Red Blockchain de Depósito</label>
                        <select
                          value={formData.network}
                          onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white focus:outline-none focus:border-accent/50 transition-colors [&>option]:bg-[#0c0a15] [&>option]:text-white cursor-pointer"
                        >
                          {selectedMethod === "ethereum" ? (
                            <>
                              <option value="ERC20">Ethereum Mainnet (ERC20)</option>
                              <option value="BSC">BNB Smart Chain (BEP20)</option>
                              <option value="Polygon">Polygon POS (ERC20)</option>
                              <option value="Arbitrum">Arbitrum One (ERC20)</option>
                            </>
                          ) : (
                            <>
                              <option value="BinancePay">Binance Pay (Instantáneo)</option>
                              <option value="TRC20">TRON Network (TRC20)</option>
                              <option value="BSC">BNB Smart Chain (BEP20)</option>
                              <option value="ERC20">Ethereum Network (ERC20)</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Card 3: Items Review */}
          <section className="bg-card border border-white/5 rounded-3xl p-6 md:p-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-accent rounded-full" />
              {selectedMethod ? "3." : "2."} Revisa tus Artículos ({items.length})
            </h2>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item) => (
                <div key={item.assetId} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-background/50 border border-white/5">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center p-1.5 flex-shrink-0">
                      {item.iconUrl ? (
                        <img src={item.iconUrl} alt={item.name} className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full bg-accent/10 rounded flex items-center justify-center">
                          <Coins className="w-5 h-5 text-accent" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-white truncate uppercase tracking-wide leading-tight">{item.name}</h4>
                      <p className="text-[9px] text-[#84849b] font-mono mt-1 uppercase">Asset: {item.assetId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-white">${item.price.toFixed(2)}</p>
                    <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mt-0.5">Listo</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Side: Order Summary */}
        <div className="lg:col-span-4 sticky top-28">
          <div className="bg-card border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl">
            <h2 className="text-sm font-black uppercase tracking-widest text-white mb-6">Resumen del Pedido</h2>

            <div className="space-y-4 font-sans border-b border-white/5 pb-6 mb-6">
              <div className="flex items-center justify-between text-xs text-[#84849b] font-semibold">
                <span>Subtotal ({items.length} items)</span>
                <span className="text-white">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#84849b] font-semibold">
                <span>Comisión de Pasarela (Simulada)</span>
                <span className="text-emerald-400">Gratis (0.00)</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#84849b] font-semibold">
                <span>Impuestos de Blockchain / Red</span>
                <span className="text-emerald-400">Bonificado</span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">Monto Final</span>
                <span className="text-2xl font-black text-white block tracking-tighter mt-1">${totalPrice.toFixed(2)} USD</span>
              </div>
              <div className="p-3 bg-accent/10 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-accent" />
              </div>
            </div>

            <button
              onClick={handleSimulatePayment}
              disabled={!selectedMethod || isSimulating}
              className="w-full h-14 bg-accent text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-[0_0_35px_rgba(217,70,239,0.35)] hover:shadow-[0_0_45px_rgba(217,70,239,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {checkoutType === "buy" ? "Completar Pago" : "Confirmar Venta"}
              <ArrowRight className="w-4 h-4" />
            </button>

            {!selectedMethod && (
              <p className="text-[9px] text-center text-[#84849b] mt-4 font-bold uppercase tracking-wider">
                Selecciona un método de pago arriba
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Simulator Overlay Modal */}
      {isSimulating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="bg-[#0c0a15] border border-white/5 p-10 rounded-3xl max-w-md w-full mx-6 text-center shadow-2xl relative overflow-hidden">
            
            {/* Background glowing sphere */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-accent/5 filter blur-3xl" />

            <div className="relative space-y-6">
              
              <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-4" />

              <h3 className="text-lg font-black uppercase tracking-wider text-white">Simulador de Transacción</h3>
              
              {/* Progress Steps */}
              <div className="space-y-4 text-left max-w-xs mx-auto text-xs">
                <div className={`flex items-center gap-3 transition-colors ${simulationStep >= 1 ? 'text-white' : 'text-white/20'}`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${simulationStep > 1 ? 'bg-emerald-400' : simulationStep === 1 ? 'bg-accent animate-pulse' : 'bg-white/10'}`} />
                  <span className="font-bold uppercase tracking-wider">Conectando con {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name}...</span>
                </div>
                
                <div className={`flex items-center gap-3 transition-colors ${simulationStep >= 2 ? 'text-white' : 'text-white/20'}`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${simulationStep > 2 ? 'bg-emerald-400' : simulationStep === 2 ? 'bg-accent animate-pulse' : 'bg-white/10'}`} />
                  <span className="font-bold uppercase tracking-wider">Validando stock, precios y destinatario...</span>
                </div>

                <div className={`flex items-center gap-3 transition-colors ${simulationStep >= 3 ? 'text-white' : 'text-white/20'}`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${simulationStep > 3 ? 'bg-emerald-400' : simulationStep === 3 ? 'bg-accent animate-pulse' : 'bg-white/10'}`} />
                  <span className="font-bold uppercase tracking-wider">Completando firma y persistiendo orden...</span>
                </div>
              </div>

              <p className="text-[10px] text-[#84849b] font-bold uppercase tracking-widest leading-relaxed">
                Por favor no cierres esta pestaña. <br /> Simulador Sandbox en progreso.
              </p>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center pt-24 bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
