"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, ChevronDown } from "lucide-react";
import { BACKEND_URL } from "@/shared/lib/api";

const MODIFIER_OPTIONS = [
  { value: "percentage_increase", label: "Aumento en Porcentaje (+%)" },
  { value: "percentage_decrease", label: "Descuento en Porcentaje (-%)" },
  { value: "fixed_increase", label: "Aumento Fijo (+USD)" },
  { value: "fixed_decrease", label: "Descuento Fijo (-USD)" },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    globalPriceModifierType: "percentage_increase",
    globalPriceModifierValue: 0,
    globalPriceModifierEnabled: false,
    userSellModifierType: "percentage_decrease",
    userSellModifierValue: 0,
    userSellModifierEnabled: false,
    minimumUserSellPrice: 1.0,
  });
  const [loading, setLoading] = useState(true);
  const [savingPricing, setSavingPricing] = useState(false);
  const [savingUserSell, setSavingUserSell] = useState(false);
  const [savingMinSell, setSavingMinSell] = useState(false);
  const [savedPricing, setSavedPricing] = useState(false);
  const [savedUserSell, setSavedUserSell] = useState(false);
  const [savedMinSell, setSavedMinSell] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSellDropdownOpen, setIsSellDropdownOpen] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND_URL}/admin/marketplace/settings`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        "X-Tunnel-Skip-AntiPhishing-Page": "true",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setSettings(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePricingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPricing(true);
    try {
      const payload = {
        globalPriceModifierType: settings.globalPriceModifierType,
        globalPriceModifierValue: Number(settings.globalPriceModifierValue),
        globalPriceModifierEnabled: settings.globalPriceModifierEnabled,
      };
      console.log('[Settings] Saving pricing settings:', payload);
      const res = await fetch(`${BACKEND_URL}/admin/marketplace/settings/pricing`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log('[Settings] Save response:', data);
      if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
      setSavedPricing(true);
      setTimeout(() => setSavedPricing(false), 2000);
    } catch (e) {
      console.error('[Settings] Error saving pricing:', e);
    } finally {
      setSavingPricing(false);
    }
  };

  const handleUserSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUserSell(true);
    try {
      const payload = {
        userSellModifierType: settings.userSellModifierType,
        userSellModifierValue: Number(settings.userSellModifierValue),
        userSellModifierEnabled: settings.userSellModifierEnabled,
      };
      const res = await fetch(`${BACKEND_URL}/admin/marketplace/settings/user-sell`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
      setSavedUserSell(true);
      setTimeout(() => setSavedUserSell(false), 2000);
    } catch (e) {
      console.error('[Settings] Error saving user sell settings:', e);
    } finally {
      setSavingUserSell(false);
    }
  };

  const handleMinSellSubmit = async (e: React.FormEvent) => {
    setSavingMinSell(true);
    try {
      const payload = { minimumUserSellPrice: Number(settings.minimumUserSellPrice) };
      console.log('[Settings] Saving min sell price:', payload);
      const res = await fetch(`${BACKEND_URL}/admin/marketplace/settings/minimum-sell-price`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log('[Settings] Min sell price response:', data);
      if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
      setSavedMinSell(true);
      setTimeout(() => setSavedMinSell(false), 2000);
    } catch (e) {
      console.error('[Settings] Error saving min sell price:', e);
    } finally {
      setSavingMinSell(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-xl font-black uppercase tracking-wider text-white">Configuración del Marketplace</h1>
        <p className="text-xs text-[#84849b] mt-0.5">Ajusta las reglas globales de precios y límites.</p>
      </div>

      <div className="bg-[#110f1e]/20 border border-white/5 rounded-2xl divide-y divide-white/5">
        {/* Setting 1: Pricing Rules */}
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white">Reglas Globales de Precios</h2>
            <p className="text-xs text-[#84849b] mt-0.5">Define cómo se modifican los precios de los artículos en la tienda.</p>
          </div>

          <form onSubmit={handlePricingSubmit} className="space-y-4 max-w-md">
            <div className="flex items-center gap-3 max-w-md">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.globalPriceModifierEnabled}
                  onChange={(e) => setSettings({ ...settings, globalPriceModifierEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/10 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent border border-white/10"></div>
              </label>
              <span className="text-sm text-white/80">Habilitar Modificador Global</span>
            </div>

            <div className="flex flex-col gap-1.5 relative">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">Tipo de modificador</label>
              
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`
                  flex items-center justify-between gap-4 px-3.5 py-2.5 bg-white/[0.03] border transition-all duration-300 rounded-xl text-sm text-white
                  ${isDropdownOpen ? 'border-accent shadow-[0_0_15px_rgba(217,70,239,0.15)]' : 'border-white/8 hover:border-white/20'}
                `}
              >
                <span className="font-bold">
                  {MODIFIER_OPTIONS.find(o => o.value === settings.globalPriceModifierType)?.label}
                </span>
                <ChevronDown className={`h-4 w-4 text-white/40 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-accent' : ''}`} />
              </button>

              {isDropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                  
                  <div className="absolute top-full left-0 mt-1 w-full bg-[#110f1e] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-20 backdrop-blur-xl">
                    <div className="py-1">
                      {MODIFIER_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSettings({ ...settings, globalPriceModifierType: option.value });
                            setIsDropdownOpen(false);
                          }}
                          className={`
                            w-full text-left px-4 py-2.5 text-sm font-bold transition-all
                            ${settings.globalPriceModifierType === option.value
                              ? 'bg-accent/10 text-accent border-r-2 border-accent'
                              : 'text-[#84849b] hover:bg-white/5 hover:text-white'
                            }
                          `}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">Valor</label>
              <input
                type="number"
                step="0.01"
                value={settings.globalPriceModifierValue}
                onChange={(e) => setSettings({ ...settings, globalPriceModifierValue: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>

            <button 
              type="submit"
              className="px-4 py-2.5 bg-accent hover:bg-accent/90 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-colors flex items-center justify-center gap-2"
            >
              {savingPricing ? <Loader2 className="w-4 h-4 animate-spin" /> : savedPricing ? <Check className="w-4 h-4" /> : null}
              {savingPricing ? "Guardando..." : savedPricing ? "Guardado" : "Guardar Reglas de Precio"}
            </button>
          </form>
        </div>

        {/* Setting: User Sell Rules */}
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white">Reglas de Venta de Usuarios</h2>
            <p className="text-xs text-[#84849b] mt-0.5">Define cómo se modifican los precios cuando un usuario te vende items.</p>
          </div>

          <form onSubmit={handleUserSellSubmit} className="space-y-4 max-w-md">
            <div className="flex items-center gap-3 max-w-md">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.userSellModifierEnabled}
                  onChange={(e) => setSettings({ ...settings, userSellModifierEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/10 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent border border-white/10"></div>
              </label>
              <span className="text-sm text-white/80">Habilitar Modificador de Venta</span>
            </div>

            <div className="flex flex-col gap-1.5 relative">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">Tipo de modificador</label>
              
              <button
                type="button"
                onClick={() => setIsSellDropdownOpen(!isSellDropdownOpen)}
                className={`
                  flex items-center justify-between gap-4 px-3.5 py-2.5 bg-white/[0.03] border transition-all duration-300 rounded-xl text-sm text-white
                  ${isSellDropdownOpen ? 'border-accent shadow-[0_0_15px_rgba(217,70,239,0.15)]' : 'border-white/8 hover:border-white/20'}
                `}
              >
                <span className="font-bold">
                  {MODIFIER_OPTIONS.find(o => o.value === settings.userSellModifierType)?.label}
                </span>
                <ChevronDown className={`h-4 w-4 text-white/40 transition-transform duration-300 ${isSellDropdownOpen ? 'rotate-180 text-accent' : ''}`} />
              </button>

              {isSellDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsSellDropdownOpen(false)} />
                  <div className="absolute top-full left-0 mt-1 w-full bg-[#110f1e] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-20 backdrop-blur-xl">
                    <div className="py-1">
                      {MODIFIER_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSettings({ ...settings, userSellModifierType: option.value });
                            setIsSellDropdownOpen(false);
                          }}
                          className={`
                            w-full text-left px-4 py-2.5 text-sm font-bold transition-all
                            ${settings.userSellModifierType === option.value
                              ? 'bg-accent/10 text-accent border-r-2 border-accent'
                              : 'text-[#84849b] hover:bg-white/5 hover:text-white'
                            }
                          `}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">Valor</label>
              <input
                type="number"
                step="0.01"
                value={settings.userSellModifierValue}
                onChange={(e) => setSettings({ ...settings, userSellModifierValue: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>

            <button 
              type="submit"
              className="px-4 py-2.5 bg-accent hover:bg-accent/90 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-colors flex items-center justify-center gap-2"
            >
              {savingUserSell ? <Loader2 className="w-4 h-4 animate-spin" /> : savedUserSell ? <Check className="w-4 h-4" /> : null}
              {savingUserSell ? "Guardando..." : savedUserSell ? "Guardado" : "Guardar Reglas de Venta"}
            </button>
          </form>
        </div>

        {/* Setting 2: Limits */}
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white">Límites de Venta</h2>
            <p className="text-xs text-[#84849b] mt-0.5">Establece restricciones para los usuarios.</p>
          </div>

          <form onSubmit={handleMinSellSubmit} className="space-y-4 max-w-md">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">Precio Mínimo de Venta (USD)</label>
              <input
                type="number"
                step="0.01"
                value={settings.minimumUserSellPrice}
                onChange={(e) => setSettings({ ...settings, minimumUserSellPrice: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>

            <button 
              type="submit"
              className="px-4 py-2.5 bg-accent hover:bg-accent/90 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-colors flex items-center justify-center gap-2"
            >
              {savingMinSell ? <Loader2 className="w-4 h-4 animate-spin" /> : savedMinSell ? <Check className="w-4 h-4" /> : null}
              {savingMinSell ? "Guardando..." : savedMinSell ? "Guardado" : "Guardar Precio Mínimo"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
