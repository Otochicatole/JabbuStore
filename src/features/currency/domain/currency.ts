export const DISPLAY_CURRENCIES = ["USD", "ARS", "BRL"] as const;

export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

export interface DisplayRates {
  baseCurrency: "USD";
  rates: Record<DisplayCurrency, number>;
  usdArsRateKind: "oficial" | "blue" | "cripto";
  side: "venta";
  source: "DOLARAPI";
  quotedAt: string;
  sourcesUpdatedAt: {
    usdArs: string | null;
    brlArs: string | null;
  };
}

export const isDisplayCurrency = (value: unknown): value is DisplayCurrency =>
  DISPLAY_CURRENCIES.includes(value as DisplayCurrency);
