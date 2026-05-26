import React from 'react';
import { CreditCard, Wallet, Coins } from 'lucide-react';
import { PaymentMethod } from './types';

export const PAYMENT_METHODS: PaymentMethod[] = [
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
