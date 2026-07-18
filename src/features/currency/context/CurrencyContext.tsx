"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import {
  isDisplayCurrency,
  type DisplayCurrency,
  type DisplayRates,
} from "../domain/currency";
import { ApiCurrencyRepository } from "../infrastructure/api-currency-repository";

const GUEST_CURRENCY_KEY = "jabbustore:display-currency";
const DISPLAY_RATES_REFRESH_MS = 5 * 60 * 1000;

interface CurrencyContextValue {
  selectedCurrency: DisplayCurrency;
  effectiveCurrency: DisplayCurrency;
  rates: DisplayRates | null;
  ready: boolean;
  saving: boolean;
  conversionUnavailable: boolean;
  isAuthenticated: boolean;
  setCurrency: (currency: DisplayCurrency) => Promise<void>;
  convertUsd: (amountUsd: number) => number;
  displayToUsd: (displayAmount: number) => number;
  formatUsd: (amountUsd: number) => string;
  formatCurrencyAmount: (amount: number, currency: DisplayCurrency) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const localeByCurrency: Record<DisplayCurrency, string> = {
  USD: "en-US",
  ARS: "es-AR",
  BRL: "pt-BR",
};

function formatAmount(amount: number, currency: DisplayCurrency) {
  const digits = currency === "ARS"
    ? { minimumFractionDigits: 0, maximumFractionDigits: 2 }
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return new Intl.NumberFormat(localeByCurrency[currency], {
    style: "currency",
    currency,
    currencyDisplay: "code",
    ...digits,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const repositoryRef = useRef(new ApiCurrencyRepository());
  const [selectedCurrency, setSelectedCurrency] = useState<DisplayCurrency>("USD");
  const [rates, setRates] = useState<DisplayRates | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadRates = useCallback(async (signal?: AbortSignal) => {
    try {
      const nextRates = await repositoryRef.current.getDisplayRates(signal);
      setRates(nextRates);
      return nextRates;
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.warn(t("currency.unavailable"));
        setRates(null);
      }
      return null;
    }
  }, [t]);

  useEffect(() => {
    const controller = new AbortController();
    const bootstrap = async () => {
      const stored = window.localStorage.getItem(GUEST_CURRENCY_KEY);
      const guestCurrency = isDisplayCurrency(stored) ? stored : "USD";
      const [accountCurrency] = await Promise.all([
        repositoryRef.current.getUserPreference(controller.signal).catch(() => null),
        loadRates(controller.signal),
      ]);

      if (controller.signal.aborted) return;
      if (accountCurrency) {
        setIsAuthenticated(true);
        setSelectedCurrency(accountCurrency);
      } else {
        setIsAuthenticated(false);
        setSelectedCurrency(guestCurrency);
      }
      setReady(true);
    };

    void bootstrap();
    return () => controller.abort();
  }, [loadRates]);

  useEffect(() => {
    if (!ready) return;
    const refresh = window.setInterval(() => {
      void loadRates();
    }, DISPLAY_RATES_REFRESH_MS);
    return () => window.clearInterval(refresh);
  }, [loadRates, ready]);

  const setCurrency = useCallback(async (currency: DisplayCurrency) => {
    const previous = selectedCurrency;
    setSelectedCurrency(currency);
    setSaving(true);
    try {
      if (isAuthenticated) {
        await repositoryRef.current.updateUserPreference(currency);
      } else {
        window.localStorage.setItem(GUEST_CURRENCY_KEY, currency);
      }
      if (currency !== "USD" && !rates) await loadRates();
    } catch (error) {
      console.error("Could not update currency preference:", error);
      setSelectedCurrency(previous);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [isAuthenticated, loadRates, rates, selectedCurrency]);

  const conversionUnavailable = ready && selectedCurrency !== "USD" && !rates;
  const effectiveCurrency: DisplayCurrency = conversionUnavailable ? "USD" : selectedCurrency;
  const effectiveRate = rates?.rates[effectiveCurrency] ?? 1;
  const convertUsd = useCallback((amountUsd: number) => amountUsd * effectiveRate, [effectiveRate]);
  const displayToUsd = useCallback((displayAmount: number) => displayAmount / effectiveRate, [effectiveRate]);
  const formatCurrencyAmount = useCallback(
    (amount: number, currency: DisplayCurrency) => formatAmount(amount, currency),
    [],
  );
  const formatUsd = useCallback(
    (amountUsd: number) => formatAmount(convertUsd(amountUsd), effectiveCurrency),
    [convertUsd, effectiveCurrency],
  );

  const value = useMemo<CurrencyContextValue>(() => ({
    selectedCurrency,
    effectiveCurrency,
    rates,
    ready,
    saving,
    conversionUnavailable,
    isAuthenticated,
    setCurrency,
    convertUsd,
    displayToUsd,
    formatUsd,
    formatCurrencyAmount,
  }), [selectedCurrency, effectiveCurrency, rates, ready, saving, conversionUnavailable, isAuthenticated, setCurrency, convertUsd, displayToUsd, formatUsd, formatCurrencyAmount]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used within CurrencyProvider");
  return context;
}
