import React from "react";
import { CreditCard, Wallet, Coins, Landmark } from "lucide-react";
import { PaymentMethod } from "./types";

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "mercado_pago",
    name: "Mercado Pago",
    description:
      "Pay with Mercado Pago balance, bank transfer, or compatible cards",
    icon: <CreditCard className="w-5 h-5 text-sky-400" />,
    badge: "ARS / CBU / Alias",
    color:
      "from-sky-500/10 to-sky-500/5 hover:border-sky-500/30 border-white/5",
  },
  {
    id: "nowpayments",
    name: "NOWPayments (Cryptocurrencies)",
    description:
      "Pay with Bitcoin, USDT, Ethereum, and other cryptocurrencies through secure checkout",
    icon: <Coins className="w-5 h-5 text-purple-400" />,
    badge: "Crypto / Web3",
    color:
      "from-purple-500/10 to-purple-500/5 hover:border-purple-500/30 border-white/5",
  },
  {
    id: "paypal",
    name: "PayPal",
    description:
      "Pay with PayPal balance, card, or international bank account",
    icon: <Wallet className="w-5 h-5 text-indigo-400" />,
    badge: "USD / PayPal",
    color:
      "from-indigo-500/10 to-indigo-500/5 hover:border-indigo-500/30 border-white/5",
  },
  {
    id: "manual_transfer",
    name: "Manual Transfer",
    description:
      "Transfer by bank or crypto using configured details and upload proof",
    icon: <Landmark className="w-5 h-5 text-emerald-400" />,
    badge: "Banco / Crypto",
    color:
      "from-emerald-500/10 to-emerald-500/5 hover:border-emerald-500/30 border-white/5",
  },
];
