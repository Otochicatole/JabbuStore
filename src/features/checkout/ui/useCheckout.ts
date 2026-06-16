"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "@/features/cart/context/CartContext";
import { useInventory } from "@/features/inventory/context/InventoryContext";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { CheckoutItem, CheckoutFormData, FormErrors } from "../domain/types";

export function useCheckout() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { items: cartItems, clearCart } = useCart();
  const {
    selectedItems: sellItems,
    clearSellList,
  } = useInventory();

  const checkoutType: "buy" | "sell" = searchParams.get("type") === "sell" ? "sell" : "buy";

  const processedRef = useRef(false);

  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMethod, setSelectedMethod] = useState<string | null>(
    "mercado_pago",
  );
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cbu: "",
    cuil: "",
    accountHolder: "",
    walletAddress: "",
    network: "ERC20",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Reset payout fields when payment method changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      cbu: "",
      cuil: "",
      accountHolder: "",
      walletAddress: "",
      network:
        selectedMethod === "ethereum"
          ? "ERC20"
          : selectedMethod === "nowpayments"
            ? "TRC20"
            : selectedMethod === "binance"
              ? "BinancePay"
              : "ERC20",
    }));
    setFormErrors({});
  }, [selectedMethod]);

  // 1. Manejar las redirecciones de retorno
  useEffect(() => {
    const status = searchParams.get("status");
    const orderId = searchParams.get("orderId");
    const method = searchParams.get("method");
    const token = searchParams.get("token");

    console.log("[useCheckout] useEffect callback check:", {
      status,
      orderId,
      method,
      token,
      alreadyProcessed: processedRef.current
    });

    if (!status || processedRef.current) return;

    const handleCallback = async () => {
      processedRef.current = true;
      console.log("[useCheckout] starting handleCallback...");
      if (status === "success" && orderId) {
        if (method === "paypal") {
          setLoading(true);
          try {
            console.log("[useCheckout] posting to PayPal webhook endpoint with token:", token);
            const res = await fetchWithAuth(`${BACKEND_URL}/orders/webhook/paypal`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token }),
            });
            console.log("[useCheckout] PayPal webhook response status:", res.status);
            const data = await res.json();
            console.log("[useCheckout] PayPal webhook response data:", data);
            if (!res.ok) {
              throw new Error(data?.error || "Error al verificar la transacción de PayPal.");
            }
          } catch (err: any) {
            console.error("PayPal verification error:", err);
            setError(err.message || "No se pudo procesar tu pago de PayPal de manera segura.");
            setLoading(false);
            return;
          }
        }

        console.log("[useCheckout] Capture completed successfully. Updating frontend state.");
        setCreatedOrderId(orderId);
        setIsSuccess(true);
        if (checkoutType === "buy") {
          clearCart();
        } else {
          clearSellList();
        }
        setLoading(false);
        console.log("[useCheckout] handleCallback finished. Loading set to false.");
      } else if (status === "failure") {
        setError(
          "El proceso de pago fue cancelado o rechazado. Por favor, intente nuevamente.",
        );
        setLoading(false);
      } else if (status === "pending") {
        setError(
          "Su transacción se encuentra pendiente de acreditación. Procesaremos su orden apenas se apruebe de forma segura.",
        );
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, checkoutType, clearCart, clearSellList]);

  // 2. Validar ítems del checkout
  useEffect(() => {
    const status = searchParams.get("status");
    if (status) return;

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
            itemIds: cartItems.map((i) => i.skin.id),
            items: cartItems.map((i) => ({
              assetId: i.skin.id,
              float: i.skin.float !== undefined ? i.skin.float : null,
              pattern: i.skin.pattern !== undefined ? i.skin.pattern : null,
            })),
          };
        } else {
          if (sellItems.length === 0) {
            setError("No has seleccionado skins para vender.");
            setLoading(false);
            return;
          }
          payload = {
            type: "SELL",
            items: sellItems.map((i) => ({
              assetId: i.id,
              requestedPrice: i.price,
            })),
          };
        }

        const res = await fetchWithAuth(`${BACKEND_URL}/orders/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data?.error || `Error ${res.status} al validar productos.`,
          );
        }

        setItems(data.items);
        setTotalPrice(data.totalPrice);
      } catch (err: any) {
        console.error("Validation error:", err);
        setError(
          err.message ||
            "Ocurrió un error inesperado al validar tus productos.",
        );
      } finally {
        setLoading(false);
      }
    };

    validateCheckout();
  }, [checkoutType, cartItems, sellItems, searchParams]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.firstName.trim())
      errors.firstName = "El nombre es obligatorio.";
    if (!formData.lastName.trim())
      errors.lastName = "El apellido es obligatorio.";
    if (!formData.email.trim()) {
      errors.email = "El correo electrónico es obligatorio.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Correo electrónico no válido.";
    }
    if (!formData.phone.trim()) errors.phone = "El teléfono es obligatorio.";

    if (checkoutType === "sell" && selectedMethod) {
      if (selectedMethod === "mercado_pago") {
        if (!formData.cbu.trim())
          errors.cbu = "El CBU/CVU o Alias es obligatorio.";
        if (!formData.accountHolder.trim())
          errors.accountHolder = "El nombre del titular es obligatorio.";
        if (!formData.cuil.trim()) errors.cuil = "El CUIL/CUIT es obligatorio.";
      } else if (selectedMethod === "paypal") {
        if (!formData.cbu.trim())
          errors.cbu = "La dirección de correo de PayPal es obligatoria.";
        if (!formData.accountHolder.trim())
          errors.accountHolder = "El titular de la cuenta es obligatorio.";
      } else if (selectedMethod === "ethereum") {
        if (!formData.walletAddress.trim())
          errors.walletAddress =
            "La dirección de billetera Ethereum (Web3) es obligatoria.";
      } else if (selectedMethod === "nowpayments") {
        if (!formData.walletAddress.trim())
          errors.walletAddress =
            "La dirección de billetera de Criptomonedas es obligatoria.";
      } else if (selectedMethod === "binance") {
        if (!formData.walletAddress.trim())
          errors.walletAddress =
            "El ID de Binance (Pay ID) o dirección de depósito es obligatorio.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSimulatePayment = () => {
    if (!selectedMethod) return;
    
    const sendDebugLog = (msg: string) => {
      fetch('/api/proxy/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      }).catch(() => {});
    };

    sendDebugLog("handleSimulatePayment clicked, method: " + selectedMethod + ", type: " + checkoutType);

    if (!validateForm()) {
      sendDebugLog("validateForm failed. Form errors: " + JSON.stringify(formErrors));
      const formSection = document.getElementById("checkout-form-section");
      if (formSection) {
        formSection.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    sendDebugLog("validateForm passed. Proceeding with checkout.");

    // SI ES COMPRA Y EL MÉTODO ES MERCADO PAGO, NOWPAYMENTS O PAYPAL: FLUJO REAL
    if (checkoutType === "buy" && (selectedMethod === "mercado_pago" || selectedMethod === "nowpayments" || selectedMethod === "paypal")) {
      setIsSimulating(true);
      setSimulationStep(1);

      const methodLabel = selectedMethod === "mercado_pago" ? "Mercado Pago" : selectedMethod === "nowpayments" ? "NOWPayments" : "PayPal";
      sendDebugLog("Real flow: starting setTimeout with 1000ms delay for " + methodLabel);

      setTimeout(async () => {
        sendDebugLog("setTimeout callback started execution.");
        try {
          const metadataPayload = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            cbu: null,
            cuil: null,
            accountHolder: null,
            walletAddress: null,
            network: null,
          };

          sendDebugLog("metadataPayload prepared: " + JSON.stringify(metadataPayload));
          sendDebugLog("items in state count: " + items.length + ", cartItems count: " + cartItems.length);

          let detailedItems;
          try {
            detailedItems = items.map((i) => {
              const cartItem = cartItems.find((c) => c.skin.id === i.assetId);
              const skin = cartItem?.skin;

              return {
                assetId: i.assetId,
                name: i.name,
                price: i.price,
                iconUrl: i.iconUrl,
                float: skin?.float !== undefined ? skin.float : null,
                pattern: skin?.pattern !== undefined ? skin.pattern : null,
                rarity: skin?.rarity || "common",
                exterior: skin?.exterior || null,
                provider: skin?.provider || "bot",
              };
            });
            sendDebugLog("detailedItems mapping completed: " + JSON.stringify(detailedItems));
          } catch (mapErr: any) {
            sendDebugLog("detailedItems map failed: " + mapErr.message + "\nStack: " + mapErr.stack);
            throw mapErr;
          }

          sendDebugLog("Sending POST request to " + BACKEND_URL + "/orders");
          const res = await fetchWithAuth(`${BACKEND_URL}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              itemIds: items.map((i) => i.assetId),
              items: detailedItems,
              paymentMethod: selectedMethod,
              metadata: metadataPayload,
            }),
          });

          sendDebugLog("fetchWithAuth response status: " + res.status);
          const data = await res.json();
          sendDebugLog("fetchWithAuth response JSON: " + JSON.stringify(data));
          
          if (!res.ok) {
            throw new Error(
              data?.error || `Error al registrar la orden de ${methodLabel}.`,
            );
          }

          if (data.paymentUrl) {
            sendDebugLog(`[${methodLabel}] Redirigiendo al usuario a: ${data.paymentUrl}`);
            window.location.href = data.paymentUrl;
          } else {
            throw new Error(
              `El servidor no devolvió un enlace de pago de ${methodLabel} válido.`,
            );
          }
        } catch (err: any) {
          sendDebugLog("Error inside setTimeout try-catch block: " + err.message + "\nStack: " + err.stack);
          console.error(`${methodLabel} integration error:`, err);
          setError(err.message || `La conexión con ${methodLabel} falló.`);
          setIsSimulating(false);
        }
      }, 1000);
      return;
    }

    // FLUJO SIMULADO
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
              network: formData.network || null,
            };

            if (checkoutType === "buy") {
              const detailedItems = items.map((i) => {
                const cartItem = cartItems.find((c) => c.skin.id === i.assetId);
                const skin = cartItem?.skin;

                return {
                  assetId: i.assetId,
                  name: i.name,
                  price: i.price,
                  iconUrl: i.iconUrl,
                  float: skin?.float !== undefined ? skin.float : null,
                  pattern: skin?.pattern !== undefined ? skin.pattern : null,
                  rarity: skin?.rarity || "common",
                  exterior: skin?.exterior || null,
                  provider: skin?.provider || "bot",
                };
              });

              res = await fetchWithAuth(`${BACKEND_URL}/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  itemIds: items.map((i) => i.assetId),
                  items: detailedItems,
                  paymentMethod: selectedMethod,
                  metadata: metadataPayload,
                }),
              });
            } else {
              res = await fetchWithAuth(`${BACKEND_URL}/orders/sell`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  items: items.map((i) => ({
                    assetId: i.assetId,
                    requestedPrice: i.price,
                  })),
                  paymentMethod: selectedMethod,
                  metadata: metadataPayload,
                }),
              });
            }

            const data = await res.json();
            if (!res.ok) {
              throw new Error(
                data?.error || "Error al registrar el pedido final.",
              );
            }

            if (checkoutType === "buy") {
              await fetchWithAuth(`${BACKEND_URL}/orders/${data.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "PAID" }),
              });
            }

            setCreatedOrderId(data.id);
            setIsSuccess(true);

            if (checkoutType === "buy") {
              clearCart();
            } else {
              clearSellList();
            }
          } catch (err: any) {
            console.error("Submit order error:", err);
            setError(
              err.message || "La simulación falló al registrar la orden.",
            );
            setIsSimulating(false);
          }
        }, 1000);
      }, 1000);
    }, 1000);
  };

  return {
    checkoutType,
    items,
    totalPrice,
    loading,
    error,
    selectedMethod,
    setSelectedMethod,
    isSimulating,
    simulationStep,
    isSuccess,
    createdOrderId,
    formData,
    setFormData,
    formErrors,
    handleSimulatePayment,
    router,
  };
}
