"use client";

import { useCurrency } from "../context/CurrencyContext";

interface MoneyProps {
  amountUsd: number;
  className?: string;
  approximate?: boolean;
}

export function Money({ amountUsd, className, approximate = false }: MoneyProps) {
  const { formatUsd } = useCurrency();
  return <span className={className}>{approximate ? "~ " : ""}{formatUsd(amountUsd)}</span>;
}
