import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import type { DisplayCurrency, DisplayRates } from "../domain/currency";

interface UserCurrencyResponse {
  preferredCurrency?: DisplayCurrency;
}

export class ApiCurrencyRepository {
  async getDisplayRates(signal?: AbortSignal): Promise<DisplayRates> {
    const response = await fetch(`${BACKEND_URL}/currency-conversion/display-rates`, {
      signal,
      credentials: "include",
    });
    if (!response.ok) throw new Error("DISPLAY_RATES_UNAVAILABLE");
    return response.json() as Promise<DisplayRates>;
  }

  async getUserPreference(signal?: AbortSignal): Promise<DisplayCurrency | null> {
    const response = await fetchWithAuth(`${BACKEND_URL}/users/me`, { signal });
    if (!response.ok) return null;
    const user = (await response.json()) as UserCurrencyResponse;
    return user.preferredCurrency ?? "USD";
  }

  async updateUserPreference(currency: DisplayCurrency): Promise<void> {
    const response = await fetchWithAuth(`${BACKEND_URL}/users/me`, {
      method: "PATCH",
      body: JSON.stringify({ preferredCurrency: currency }),
    });
    if (!response.ok) throw new Error("CURRENCY_PREFERENCE_UPDATE_FAILED");
  }
}
