"use client";

import { useState } from "react";
import { useI18n } from "@/shared/i18n/I18nProvider";

export default function SellSkinComponent({ skinId, inventoryPrice }: { skinId: string, inventoryPrice: number }) {
  const { t } = useI18n();
  const [requestedPrice, setRequestedPrice] = useState<number>(inventoryPrice);
  const [error, setError] = useState<string | null>(null);

  const handleSell = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/marketplace/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Assumes credentials are sent or token
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          skinId,
          requestedPrice
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("sell.listError"));
        return;
      }
      
      alert(t("sell.listSuccess"));
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("sell.listError"));
    }
  };

  return (
    <div className="bg-card border border-white/10 p-4 rounded-lg flex flex-col items-center">
      <h3 className="text-sm text-gray-300 mb-2">{t("sell.putForSale")}</h3>
      <input 
        type="number"
        step="0.01"
        value={requestedPrice}
        onChange={(e) => setRequestedPrice(Number(e.target.value))}
        className="w-full bg-background border border-white/10 text-white rounded p-2 text-center mb-4 outline-none focus:border-accent"
      />
      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
      <button 
        onClick={handleSell}
        className="w-full bg-accent/20 border border-accent text-accent py-2 rounded text-sm font-bold hover:bg-accent hover:text-white transition"
      >
        {t("sell.sellSkin")}
      </button>
    </div>
  );
}
