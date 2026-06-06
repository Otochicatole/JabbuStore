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
];
