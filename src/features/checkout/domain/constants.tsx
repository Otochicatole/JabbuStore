import React from "react";
import { CreditCard, Wallet, Coins } from "lucide-react";
import { PaymentMethod } from "./types";

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "mercado_pago",
    name: "Mercado Pago / Banco",
    description:
      "Paga con transferencia, saldo de Mercado Pago o tarjetas de crédito/débito",
    icon: <CreditCard className="w-5 h-5 text-sky-400" />,
    badge: "ARS / CBU / Alias",
    color:
      "from-sky-500/10 to-sky-500/5 hover:border-sky-500/30 border-white/5",
  },
  {
    id: "nowpayments",
    name: "NOWPayments (Criptomonedas)",
    description:
      "Paga de forma totalmente segura usando Bitcoin, USDT, Ethereum y más criptomonedas",
    icon: <Coins className="w-5 h-5 text-purple-400" />,
    badge: "Crypto / Web3",
    color:
      "from-purple-500/10 to-purple-500/5 hover:border-purple-500/30 border-white/5",
  },
  {
    id: "paypal",
    name: "PayPal",
    description:
      "Paga con tu saldo de PayPal, tarjeta de crédito o cuenta bancaria internacional en dólares",
    icon: <Wallet className="w-5 h-5 text-indigo-400" />,
    badge: "USD / PayPal",
    color:
      "from-indigo-500/10 to-indigo-500/5 hover:border-indigo-500/30 border-white/5",
  },
];
