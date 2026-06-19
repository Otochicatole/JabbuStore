"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "@/features/cart/context/CartContext";
import { useInventory } from "@/features/inventory/context/InventoryContext";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import {
  CheckoutItem,
  CheckoutFormData,
  FormErrors,
  ManualTransferSettings,
} from "../domain/types";
import { PAYMENT_METHODS } from "../domain/constants";

function getErrorMessage(error: unknown, fallback = "Ocurrió un error inesperado.") {
  return error instanceof Error ? error.message : fallback;
}

function getErrorStack(error: unknown) {
  return error instanceof Error && error.stack ? `\nStack: ${error.stack}` : "";
}

const PAYMENT_PROOF_MAX_SIZE_BYTES = 10 * 1024 * 1024;
const PAYMENT_PROOF_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

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
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentStep, setPaymentStep] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [manualTransferSettings, setManualTransferSettings] =
    useState<ManualTransferSettings | null>(null);

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
    manualTransferType: "bank",
    paymentProof: null,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Reset payout fields when payment method changes
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
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
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [selectedMethod]);

  useEffect(() => {
    const loadPublicSettings = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/marketplace/settings/public`, {
          credentials: "include",
          headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
        });
        if (!response.ok) return;
        const data = await response.json();
        setManualTransferSettings({
          mercadoPagoEnabled: data.mercadoPagoEnabled !== false,
          paypalEnabled: data.paypalEnabled !== false,
          nowpaymentsEnabled: data.nowpaymentsEnabled !== false,
          manualTransferEnabled: Boolean(data.manualTransferEnabled),
          manualBankAlias: data.manualBankAlias ?? null,
          manualBankCbu: data.manualBankCbu ?? null,
          manualBankHolder: data.manualBankHolder ?? null,
          manualBankInstructions: data.manualBankInstructions ?? null,
          manualCryptoAddress: data.manualCryptoAddress ?? null,
          manualCryptoNetwork: data.manualCryptoNetwork ?? null,
          manualCryptoInstructions: data.manualCryptoInstructions ?? null,
        });
      } catch (err) {
        console.error("Manual transfer settings error:", err);
      }
    };

    void loadPublicSettings();
  }, []);

  useEffect(() => {
    if (!manualTransferSettings || checkoutType !== "buy") return;

    const availableMethods = PAYMENT_METHODS.filter((method) => {
      if (method.id === "mercado_pago") return manualTransferSettings.mercadoPagoEnabled;
      if (method.id === "paypal") return manualTransferSettings.paypalEnabled;
      if (method.id === "nowpayments") return manualTransferSettings.nowpaymentsEnabled;
      if (method.id === "manual_transfer") return manualTransferSettings.manualTransferEnabled;
      return true;
    });

    if (selectedMethod && availableMethods.some((method) => method.id === selectedMethod)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSelectedMethod(availableMethods[0]?.id ?? null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [checkoutType, manualTransferSettings, selectedMethod]);

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
          } catch (err: unknown) {
            console.error("PayPal verification error:", err);
            setError(getErrorMessage(err, "No se pudo procesar tu pago de PayPal de manera segura."));
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
        if (orderId) {
          try {
            console.log("[useCheckout] cancelling pending order after payment failure:", {
              orderId,
              method,
            });
            await fetchWithAuth(`${BACKEND_URL}/orders/${orderId}/cancel-payment`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
            });
          } catch (err: unknown) {
            console.error("Payment cancellation status update error:", err);
          }
        }

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
        let payload: Record<string, unknown> = {};
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
      } catch (err: unknown) {
        console.error("Validation error:", err);
        setError(
          getErrorMessage(
            err,
            "Ocurrió un error inesperado al validar tus productos.",
          ),
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

    if (checkoutType === "buy" && selectedMethod === "mercado_pago" && manualTransferSettings?.mercadoPagoEnabled === false) {
      errors.paymentMethod = "Mercado Pago no está habilitado.";
    }
    if (checkoutType === "buy" && selectedMethod === "paypal" && manualTransferSettings?.paypalEnabled === false) {
      errors.paymentMethod = "PayPal no está habilitado.";
    }
    if (checkoutType === "buy" && selectedMethod === "nowpayments" && manualTransferSettings?.nowpaymentsEnabled === false) {
      errors.paymentMethod = "NOWPayments no está habilitado.";
    }

    if (checkoutType === "buy" && selectedMethod === "manual_transfer") {
      if (!manualTransferSettings?.manualTransferEnabled) {
        errors.paymentProof = "La transferencia manual no está habilitada.";
      } else if (!formData.paymentProof) {
        errors.paymentProof = "El comprobante es obligatorio para transferencia manual.";
      } else if (!PAYMENT_PROOF_ALLOWED_TYPES.has(formData.paymentProof.type)) {
        errors.paymentProof = "Formato no permitido. Usá JPG, PNG, WEBP, GIF o PDF.";
      } else if (formData.paymentProof.size > PAYMENT_PROOF_MAX_SIZE_BYTES) {
        errors.paymentProof = "El comprobante no puede superar los 10 MB.";
      }
    }

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

  const uploadBuyerPaymentProof = async (orderId: string, file: File) => {
    const proofData = new FormData();
    proofData.append("proof", file);

    const response = await fetchWithAuth(
      `${BACKEND_URL}/orders/${orderId}/payment-proof/buyer`,
      {
        method: "POST",
        body: proofData,
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || "No pudimos subir el comprobante de pago.");
    }
  };

  const handleSubmitCheckout = () => {
    if (!selectedMethod) return;
    
    const sendDebugLog = (msg: string) => {
      fetch('/api/proxy/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      }).catch(() => {});
    };

    sendDebugLog("handleSubmitCheckout clicked, method: " + selectedMethod + ", type: " + checkoutType);

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
      setIsProcessingPayment(true);
      setPaymentStep(1);

      const methodLabel = selectedMethod === "mercado_pago" ? "Mercado Pago" : selectedMethod === "nowpayments" ? "NOWPayments" : "PayPal";
      sendDebugLog("Checkout flow: preparing payment order for " + methodLabel);

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
          setPaymentStep(2);

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
          } catch (mapErr: unknown) {
            sendDebugLog(
              "detailedItems map failed: " +
                getErrorMessage(mapErr) +
                getErrorStack(mapErr),
            );
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
            setPaymentStep(3);
            sendDebugLog(`[${methodLabel}] Redirigiendo al usuario a: ${data.paymentUrl}`);
            window.location.href = data.paymentUrl;
          } else {
            throw new Error(
              `El servidor no devolvió un enlace de pago de ${methodLabel} válido.`,
            );
          }
        } catch (err: unknown) {
          sendDebugLog(
            "Error inside setTimeout try-catch block: " +
              getErrorMessage(err) +
              getErrorStack(err),
          );
          console.error(`${methodLabel} integration error:`, err);
          setError(getErrorMessage(err, `La conexión con ${methodLabel} falló.`));
          setIsProcessingPayment(false);
        }
      }, 1000);
      return;
    }

    // Flujo de creación de orden de venta o métodos internos sin redirección externa.
    setIsProcessingPayment(true);
    setPaymentStep(1);

    setTimeout(() => {
      setPaymentStep(2);

      setTimeout(() => {
        setPaymentStep(3);

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
              manualTransferType:
                selectedMethod === "manual_transfer" ? formData.manualTransferType : null,
              manualTransferSnapshot:
                selectedMethod === "manual_transfer" && manualTransferSettings
                  ? {
                      type: formData.manualTransferType,
                      bank:
                        formData.manualTransferType === "bank"
                          ? {
                              alias: manualTransferSettings.manualBankAlias,
                              cbu: manualTransferSettings.manualBankCbu,
                              holder: manualTransferSettings.manualBankHolder,
                              instructions: manualTransferSettings.manualBankInstructions,
                            }
                          : null,
                      crypto:
                        formData.manualTransferType === "crypto"
                          ? {
                              address: manualTransferSettings.manualCryptoAddress,
                              network: manualTransferSettings.manualCryptoNetwork,
                              instructions: manualTransferSettings.manualCryptoInstructions,
                            }
                          : null,
                    }
                  : null,
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

            if (checkoutType === "buy" && selectedMethod === "manual_transfer") {
              if (!formData.paymentProof) {
                throw new Error("El comprobante es obligatorio para transferencia manual.");
              }
              try {
                await uploadBuyerPaymentProof(data.id, formData.paymentProof);
              } catch (uploadErr) {
                await fetchWithAuth(`${BACKEND_URL}/orders/${data.id}/cancel-payment`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                }).catch(() => {});
                throw uploadErr;
              }
            }

            if (checkoutType === "buy" && selectedMethod !== "manual_transfer") {
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
          } catch (err: unknown) {
            console.error("Submit order error:", err);
            setError(
              getErrorMessage(err, "No pudimos registrar la orden."),
            );
            setIsProcessingPayment(false);
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
    isProcessingPayment,
    paymentStep,
    isSuccess,
    createdOrderId,
    formData,
    setFormData,
    formErrors,
    manualTransferSettings,
    handleSubmitCheckout,
    router,
  };
}
