"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    globalPriceModifierType: "percentage_increase",
    globalPriceModifierValue: 0,
    globalPriceModifierEnabled: false,
    minimumUserSellPrice: 1.0,
  });

  useEffect(() => {
    fetch("http://localhost:3001/api/admin/marketplace/settings", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setSettings(data);
      });
  }, []);

  const handlePricingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("http://localhost:3001/api/admin/marketplace/settings/pricing", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
      body: JSON.stringify({
        globalPriceModifierType: settings.globalPriceModifierType,
        globalPriceModifierValue: Number(settings.globalPriceModifierValue),
        globalPriceModifierEnabled: settings.globalPriceModifierEnabled,
      }),
    });
    alert("Reglas de precio actualizadas");
  };

  const handleMinSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("http://localhost:3001/api/admin/marketplace/settings/minimum-sell-price", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
      body: JSON.stringify({
        minimumUserSellPrice: Number(settings.minimumUserSellPrice),
      }),
    });
    alert("Precio mínimo actualizado");
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-white">Configuración del Marketplace</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.form
          onSubmit={handlePricingSubmit}
          className="bg-card border border-white/10 p-6 rounded-lg space-y-4"
        >
          <h2 className="text-xl font-semibold text-white">Reglas Globales de Precios</h2>
          
          <label className="flex items-center space-x-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={settings.globalPriceModifierEnabled}
              onChange={(e) => setSettings({ ...settings, globalPriceModifierEnabled: e.target.checked })}
              className="rounded bg-background border-white/20 text-accent focus:ring-accent"
            />
            <span>Habilitar Modificador Global</span>
          </label>

          <div className="flex flex-col space-y-2">
            <label className="text-sm text-gray-400">Tipo de modificador</label>
            <select
              value={settings.globalPriceModifierType}
              onChange={(e) => setSettings({ ...settings, globalPriceModifierType: e.target.value })}
              className="bg-background border border-white/10 text-white rounded p-2 outline-none focus:border-accent"
            >
              <option value="percentage_increase">Aumento en Porcentaje (+%)</option>
              <option value="percentage_decrease">Descuento en Porcentaje (-%)</option>
              <option value="fixed_increase">Aumento Fijo (+USD)</option>
              <option value="fixed_decrease">Descuento Fijo (-USD)</option>
            </select>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-sm text-gray-400">Valor</label>
            <input
              type="number"
              step="0.01"
              value={settings.globalPriceModifierValue}
              onChange={(e) => setSettings({ ...settings, globalPriceModifierValue: Number(e.target.value) })}
              className="bg-background border border-white/10 text-white rounded p-2 outline-none focus:border-accent"
            />
          </div>

          <button type="submit" className="w-full bg-accent text-white py-2 rounded font-bold hover:brightness-110 transition">
            Guardar Reglas de Precio
          </button>
        </motion.form>

        <motion.form
          onSubmit={handleMinSellSubmit}
          className="bg-card border border-white/10 p-6 rounded-lg space-y-4"
        >
          <h2 className="text-xl font-semibold text-white">Límites de Venta</h2>

          <div className="flex flex-col space-y-2">
            <label className="text-sm text-gray-400">Precio Mínimo de Venta (USD)</label>
            <input
              type="number"
              step="0.01"
              value={settings.minimumUserSellPrice}
              onChange={(e) => setSettings({ ...settings, minimumUserSellPrice: Number(e.target.value) })}
              className="bg-background border border-white/10 text-white rounded p-2 outline-none focus:border-accent"
            />
          </div>

          <button type="submit" className="w-full bg-accent text-white py-2 rounded font-bold hover:brightness-110 transition">
            Guardar Precio Mínimo
          </button>
        </motion.form>
      </div>
    </div>
  );
}
