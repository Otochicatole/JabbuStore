import React from "react";
import { CreditCard, Wallet, Coins } from "lucide-react";
import { PaymentMethod } from "./types";

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "mercado_pago",
    name: "Mercado Pago",
    description:
      "Paga con saldo de Mercado Pago, transferencia o tarjetas compatibles",
    icon: <CreditCard className="w-5 h-5 text-sky-400" />,
    badge: "ARS / CBU / Alias",
    color:
      "from-sky-500/10 to-sky-500/5 hover:border-sky-500/30 border-white/5",
  },
  {
    id: "nowpayments",
    name: "NOWPayments (Criptomonedas)",
    description:
      "Paga con Bitcoin, USDT, Ethereum y otras criptomonedas mediante checkout seguro",
    icon: <Coins className="w-5 h-5 text-purple-400" />,
    badge: "Crypto / Web3",
    color:
      "from-purple-500/10 to-purple-500/5 hover:border-purple-500/30 border-white/5",
  },
  {
    id: "paypal",
    name: "PayPal",
    description:
      "Paga con saldo de PayPal, tarjeta o cuenta bancaria internacional",
    icon: <Wallet className="w-5 h-5 text-indigo-400" />,
    badge: "USD / PayPal",
    color:
      "from-indigo-500/10 to-indigo-500/5 hover:border-indigo-500/30 border-white/5",
  },
];
