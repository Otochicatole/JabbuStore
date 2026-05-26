"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useCart } from '@/features/cart/context/CartContext';
import { useInventory } from '@/features/inventory/context/InventoryContext';
import { BACKEND_URL, fetchWithAuth } from '@/shared/lib/api';
import { CheckoutItem, CheckoutFormData, FormErrors } from '../domain/types';
import { PAYMENT_METHODS } from '../domain/constants';
import { PaymentMethodsSelector } from './components/PaymentMethodsSelector';
import { CheckoutForm } from './components/CheckoutForm';
import { ItemsReview } from './components/ItemsReview';
import { OrderSummary } from './components/OrderSummary';
import { SuccessScreen } from './components/SuccessScreen';
import { SimulationOverlay } from './components/SimulationOverlay';

export function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { items: cartItems, total: cartTotal, clearCart } = useCart();
  const { selectedItems: sellItems, totalValue: sellTotal, clearSellList } = useInventory();

  const checkoutType = searchParams.get('type') === 'sell' ? 'sell' : 'buy';
  
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
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cbu: '',
    cuil: '',
    accountHolder: '',
    walletAddress: '',
    network: 'ERC20'
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Reset payout fields when payment method changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      cbu: '',
      cuil: '',
      accountHolder: '',
      walletAddress: '',
      network: selectedMethod === 'ethereum' ? 'ERC20' : selectedMethod === 'binance' ? 'BinancePay' : 'ERC20'
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
        if (checkoutType === 'buy') {
          if (cartItems.length === 0) {
            setError('Tu carrito está vacío. Agrega skins para comprar.');
            setLoading(false);
            return;
          }
          payload = {
            type: 'BUY',
            itemIds: cartItems.map(i => i.skin.id)
          };
        } else {
          if (sellItems.length === 0) {
            setError('No has seleccionado skins para vender.');
            setLoading(false);
            return;
          }
          payload = {
            type: 'SELL',
            items: sellItems.map(i => ({
              assetId: i.id,
              requestedPrice: i.price
            }))
          };
        }

        const res = await fetchWithAuth(`${BACKEND_URL}/orders/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || `Error ${res.status} al validar productos.`);
        }

        setItems(data.items);
        setTotalPrice(data.totalPrice);
      } catch (err: any) {
        console.error('Validation error:', err);
        setError(err.message || 'Ocurrió un error inesperado al validar tus productos.');
      } finally {
        setLoading(false);
      }
    };

    validateCheckout();
  }, [checkoutType, cartItems, sellItems]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!formData.firstName.trim()) errors.firstName = 'El nombre es obligatorio.';
    if (!formData.lastName.trim()) errors.lastName = 'El apellido es obligatorio.';
    if (!formData.email.trim()) {
      errors.email = 'El correo electrónico es obligatorio.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Correo electrónico no válido.';
    }
    if (!formData.phone.trim()) errors.phone = 'El teléfono es obligatorio.';

    if (checkoutType === 'sell' && selectedMethod) {
      if (selectedMethod === 'mercado_pago') {
        if (!formData.cbu.trim()) errors.cbu = 'El CBU/CVU o Alias es obligatorio.';
        if (!formData.accountHolder.trim()) errors.accountHolder = 'El nombre del titular es obligatorio.';
        if (!formData.cuil.trim()) errors.cuil = 'El CUIL/CUIT es obligatorio.';
      } else if (selectedMethod === 'paypal') {
        if (!formData.cbu.trim()) errors.cbu = 'La dirección de correo de PayPal es obligatoria.';
        if (!formData.accountHolder.trim()) errors.accountHolder = 'El titular de la cuenta es obligatorio.';
      } else if (selectedMethod === 'ethereum') {
        if (!formData.walletAddress.trim()) errors.walletAddress = 'La dirección de billetera Ethereum (Web3) es obligatoria.';
      } else if (selectedMethod === 'binance') {
        if (!formData.walletAddress.trim()) errors.walletAddress = 'El ID de Binance (Pay ID) o dirección de depósito es obligatorio.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSimulatePayment = () => {
    if (!selectedMethod) return;
    if (!validateForm()) {
      const formSection = document.getElementById('checkout-form-section');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    setIsSimulating(true);
    setSimulationStep(1);

    setTimeout(() => {
      setSimulationStep(2);
      
      setTimeout(() => {
        setSimulationStep(3);

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

            if (checkoutType === 'buy') {
              const hashCode = (str: string): number => {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                  const chr = str.charCodeAt(i);
                  hash = ((hash << 5) - hash) + chr;
                  hash |= 0;
                }
                return hash;
              };

              const detailedItems = items.map(i => {
                const cartItem = cartItems.find(c => c.skin.id === i.assetId);
                const skin = cartItem?.skin;

                let provider = 'bots';
                if (skin) {
                  if (skin.isImmediate === false) {
                    provider = Math.abs(hashCode(i.assetId)) % 2 === 0 ? 'youpin' : 'buff';
                  } else {
                    provider = 'bots';
                  }
                }

                return {
                  assetId: i.assetId,
                  name: i.name,
                  price: i.price,
                  iconUrl: i.iconUrl,
                  float: skin?.float !== undefined ? skin.float : null,
                  pattern: skin?.pattern !== undefined ? skin.pattern : null,
                  rarity: skin?.rarity || 'common',
                  exterior: skin?.exterior || null,
                  provider: provider
                };
              });

              res = await fetchWithAuth(`${BACKEND_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  itemIds: items.map(i => i.assetId),
                  items: detailedItems,
                  paymentMethod: selectedMethod,
                  metadata: metadataPayload
                })
              });
            } else {
              res = await fetchWithAuth(`${BACKEND_URL}/orders/sell`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
              throw new Error(data?.error || 'Error al registrar el pedido final.');
            }

            if (checkoutType === 'buy') {
              await fetchWithAuth(`${BACKEND_URL}/orders/${data.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'PAID' })
              });
            }

            setCreatedOrderId(data.id);
            setIsSuccess(true);
            
            if (checkoutType === 'buy') {
              clearCart();
            } else {
              clearSellList();
            }
          } catch (err: any) {
            console.error('Submit order error:', err);
            setError(err.message || 'La simulación falló al registrar la orden.');
            setIsSimulating(false);
          }
        }, 1000);
      }, 1000);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 bg-[#070510]">
        <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
        <p className="text-xs text-[#84849b] font-bold uppercase tracking-widest">Validando precios con el servidor...</p>
      </div>
    );
  }

  if (error && !isSimulating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 bg-[#070510] px-6">
        <div className="p-8 rounded-3xl bg-red-500/5 border border-red-500/10 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-black text-white uppercase tracking-wider mb-2">Error de Validación</h2>
          <p className="text-sm text-[#84849b] mb-6">{error}</p>
          <Link href={checkoutType === 'buy' ? '/buy' : '/sell'} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-xs font-black uppercase text-white tracking-widest transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver a la Tienda
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <SuccessScreen 
        checkoutType={checkoutType}
        createdOrderId={createdOrderId}
        onNavigateToOrders={() => router.push('/purchases')}
        onNavigateToHome={() => router.push('/')}
      />
    );
  }

  const selectedMethodObj = PAYMENT_METHODS.find(m => m.id === selectedMethod);

  return (
    <main className="mx-auto max-w-7xl px-6 pt-28 pb-20 text-white min-h-screen font-sans">
      {/* Header */}
      <div className="mb-10">
        <Link href={checkoutType === 'buy' ? '/buy' : '/sell'} className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-white transition-colors uppercase tracking-widest mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a {checkoutType === 'buy' ? 'Comprar' : 'Vender'}
        </Link>
        <h1 className="text-3xl font-black uppercase tracking-tight">
          Checkout de <span className="text-accent">{checkoutType === 'buy' ? 'Compra' : 'Venta'}</span>
        </h1>
        <p className="text-sm text-[#84849b] mt-1">Verifica tus artículos y proporciona tus datos para simular la transacción.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Selector & Forms */}
        <div className="lg:col-span-8 space-y-8">
          <PaymentMethodsSelector 
            selectedMethod={selectedMethod} 
            onSelectMethod={setSelectedMethod} 
          />

          {selectedMethod && (
            <CheckoutForm 
              checkoutType={checkoutType}
              selectedMethod={selectedMethod}
              formData={formData}
              onFormChange={setFormData}
              formErrors={formErrors}
            />
          )}

          <ItemsReview 
            items={items} 
            selectedMethod={selectedMethod} 
          />
        </div>

        {/* Right Side: Order Summary */}
        <div className="lg:col-span-4 sticky top-28">
          <OrderSummary 
            itemsCount={items.length}
            totalPrice={totalPrice}
            selectedMethod={selectedMethod}
            isSimulating={isSimulating}
            checkoutType={checkoutType}
            onSubmit={handleSimulatePayment}
          />
        </div>
      </div>

      {/* Simulator Sandbox Step Overlay Modal */}
      {isSimulating && selectedMethodObj && (
        <SimulationOverlay 
          selectedMethodName={selectedMethodObj.name}
          simulationStep={simulationStep}
        />
      )}
    </main>
  );
}
export default CheckoutContent;
