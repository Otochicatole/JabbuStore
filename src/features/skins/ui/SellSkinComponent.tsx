"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function SellSkinComponent({ skinId, inventoryPrice }: { skinId: string, inventoryPrice: number }) {
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
        setError(data.error || "Error al poner en venta");
        return;
      }
      
      alert("Skin listada para la venta con éxito!");
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-card border border-white/10 p-4 rounded-lg flex flex-col items-center">
      <h3 className="text-sm text-gray-300 mb-2">Poner a la venta</h3>
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
        Vender Skin
      </button>
    </div>
  );
}
