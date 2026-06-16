"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Check,
  TrendingUp,
  Users,
  ShieldCheck,
  Webhook,
  Coins,
} from "lucide-react";
import { BACKEND_URL } from "@/shared/lib/api";
import { AdminSelect } from "@/shared/components/AdminSelect";

const MODIFIER_OPTIONS = [
  { value: "percentage_increase", label: "Aumento en Porcentaje (+%)" },
  { value: "percentage_decrease", label: "Descuento en Porcentaje (-%)" },
  { value: "fixed_increase", label: "Aumento Fijo (+USD)" },
  { value: "fixed_decrease", label: "Descuento Fijo (-USD)" },
];

type Tab = "precios" | "venta" | "reventa" | "limites" | "webhook";

const TABS: {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}[] = [
  {
    id: "precios",
    label: "Precios Globales",
    icon: TrendingUp,
    desc: "Modificadores automáticos de precio",
  },
  {
    id: "venta",
    label: "Reglas de Venta",
    icon: Users,
    desc: "Comisiones sobre ventas de usuarios",
  },
  {
    id: "reventa",
    label: "Reglas de Reventa",
    icon: Coins,
    desc: "Modificadores para ítems de Youpin (reventas)",
  },
  {
    id: "limites",
    label: "Límites",
    icon: ShieldCheck,
    desc: "Restricciones mínimas de venta",
  },
  {
    id: "webhook",
    label: "Webhook",
    icon: Webhook,
    desc: "Notificaciones en tiempo real",
  },
];

/* ── Small reusable components ── */
function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-black uppercase tracking-wider text-white">
        {title}
      </h2>
      <p className="text-xs text-[#84849b] mt-1 leading-relaxed">{desc}</p>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b] font-mono">
      {children}
    </label>
  );
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-4 py-3 bg-white/[0.03] border border-white/8 rounded-[3px] text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 focus:bg-white/[0.05] transition-all"
    />
  );
}

function SaveButton({
  saving,
  saved,
  label,
}: {
  saving: boolean;
  saved: boolean;
  label: string;
}) {
  return (
    <button
      type="submit"
      className="mt-2 px-6 py-3 bg-accent hover:bg-accent/90 rounded-[3px] text-xs font-black uppercase tracking-wider text-white transition-all flex items-center gap-2 shadow-[0_4px_20px_rgba(217,70,239,0.25)] hover:shadow-[0_4px_30px_rgba(217,70,239,0.4)] disabled:opacity-60 cursor-pointer"
    >
      {saving ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : saved ? (
        <Check className="w-4 h-4" />
      ) : null}
      {saving ? "Guardando..." : saved ? "¡Guardado!" : label}
    </button>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-white/5 rounded-full border border-white/10 peer peer-checked:bg-accent peer-checked:border-accent/50 transition-all" />
        <div className="absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow transition-all peer-checked:translate-x-5" />
      </div>
      <span className="text-sm text-white/80 font-semibold">{label}</span>
    </label>
  );
}


/* ══════════════════════════════════════════════ */
export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("precios");

  const [settings, setSettings] = useState({
    globalPriceModifierType: "percentage_increase",
    globalPriceModifierValue: 0,
    globalPriceModifierEnabled: false,
    userSellModifierType: "percentage_decrease",
    userSellModifierValue: 0,
    userSellModifierEnabled: false,
    resellModifierType: "percentage_increase",
    resellModifierValue: 0,
    resellModifierEnabled: false,
    minimumUserSellPrice: 1.0,
    webhookUrl: "",
  });

  const [loading, setLoading] = useState(true);

  const [savingPricing, setSavingPricing] = useState(false);
  const [savingUserSell, setSavingUserSell] = useState(false);
  const [savingResell, setSavingResell] = useState(false);
  const [savingMinSell, setSavingMinSell] = useState(false);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [savedPricing, setSavedPricing] = useState(false);
  const [savedUserSell, setSavedUserSell] = useState(false);
  const [savedResell, setSavedResell] = useState(false);
  const [savedMinSell, setSavedMinSell] = useState(false);
  const [savedWebhook, setSavedWebhook] = useState(false);



  useEffect(() => {
    fetch(`${BACKEND_URL}/admin/marketplace/settings`, {
      credentials: "include",
      cache: "no-store",
      headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
    })
      .then((r) => r.json())
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
      const res = await fetch(
        `${BACKEND_URL}/admin/marketplace/settings/pricing`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Tunnel-Skip-AntiPhishing-Page": "true",
          },
          body: JSON.stringify({
            globalPriceModifierType: settings.globalPriceModifierType,
            globalPriceModifierValue: Number(settings.globalPriceModifierValue),
            globalPriceModifierEnabled: settings.globalPriceModifierEnabled,
          }),
        },
      );
      if (!res.ok) throw new Error();
      setSavedPricing(true);
      setTimeout(() => setSavedPricing(false), 2500);
    } finally {
      setSavingPricing(false);
    }
  };

  const handleUserSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUserSell(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/marketplace/settings/user-sell`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Tunnel-Skip-AntiPhishing-Page": "true",
          },
          body: JSON.stringify({
            userSellModifierType: settings.userSellModifierType,
            userSellModifierValue: Number(settings.userSellModifierValue),
            userSellModifierEnabled: settings.userSellModifierEnabled,
          }),
        },
      );
      if (!res.ok) throw new Error();
      setSavedUserSell(true);
      setTimeout(() => setSavedUserSell(false), 2500);
    } finally {
      setSavingUserSell(false);
    }
  };

  const handleResellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingResell(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/marketplace/settings/resell`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Tunnel-Skip-AntiPhishing-Page": "true",
          },
          body: JSON.stringify({
            resellModifierType: settings.resellModifierType,
            resellModifierValue: Number(settings.resellModifierValue),
            resellModifierEnabled: settings.resellModifierEnabled,
          }),
        },
      );
      if (!res.ok) throw new Error();
      setSavedResell(true);
      setTimeout(() => setSavedResell(false), 2500);
    } finally {
      setSavingResell(false);
    }
  };

  const handleMinSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMinSell(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/marketplace/settings/minimum-sell-price`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Tunnel-Skip-AntiPhishing-Page": "true",
          },
          body: JSON.stringify({
            minimumUserSellPrice: Number(settings.minimumUserSellPrice),
          }),
        },
      );
      if (!res.ok) throw new Error();
      setSavedMinSell(true);
      setTimeout(() => setSavedMinSell(false), 2500);
    } finally {
      setSavingMinSell(false);
    }
  };

  const handleWebhookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWebhook(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/marketplace/settings/webhook-url`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Tunnel-Skip-AntiPhishing-Page": "true",
          },
          body: JSON.stringify({ webhookUrl: settings.webhookUrl || null }),
        },
      );
      if (!res.ok) throw new Error();
      setSavedWebhook(true);
      setTimeout(() => setSavedWebhook(false), 2500);
    } finally {
      setSavingWebhook(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-black uppercase tracking-wider text-white">
          Configuración Global
        </h1>
        <p className="text-xs text-[#84849b] mt-1">
          Ajustá las reglas del marketplace desde acá.
        </p>
      </div>

      {/* Tab bar - Horizontal scrollable on mobile */}
      <div className="flex gap-2 bg-[#110f1e]/40 p-1 rounded-[3px] border border-white/5 overflow-x-auto scrollbar-none shrink-0 flex-nowrap sm:flex-wrap">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-[3px] text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 justify-center
                ${
                  active
                    ? "bg-accent text-white shadow-[0_4px_20px_rgba(217,70,239,0.35)]"
                    : "text-[#84849b] hover:text-white hover:bg-white/[0.04]"
                }`}
            >
              <Icon
                className={`w-3.5 h-3.5 flex-shrink-0 ${active ? "opacity-100" : "opacity-60"}`}
              />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab description strip */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-accent/5 border border-accent/15 rounded-[3px]">
        {(() => {
          const t = TABS.find((t) => t.id === activeTab)!;
          const Icon = t.icon;
          return (
            <>
              <Icon className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span className="text-xs text-accent/80 font-semibold">
                {t.desc}
              </span>
            </>
          );
        })()}
      </div>

      {/* ── TAB: Precios Globales ── */}
      {activeTab === "precios" && (
        <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
          <SectionHeader
            title="Reglas Globales de Precios"
            desc="Define cómo se modifican automáticamente los precios de todos los artículos en la tienda."
          />
          <form onSubmit={handlePricingSubmit} className="space-y-5 max-w-xl">
            <ToggleSwitch
              checked={settings.globalPriceModifierEnabled}
              onChange={(v) =>
                setSettings({ ...settings, globalPriceModifierEnabled: v })
              }
              label="Habilitar Modificador Global"
            />
            <div className="space-y-1.5">
              <FieldLabel>Tipo de Modificador</FieldLabel>
              <AdminSelect
                value={settings.globalPriceModifierType}
                onChange={(v) =>
                  setSettings({ ...settings, globalPriceModifierType: v })
                }
                options={MODIFIER_OPTIONS}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Valor</FieldLabel>
              <StyledInput
                type="number"
                step="0.01"
                value={settings.globalPriceModifierValue}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    globalPriceModifierValue: Number(e.target.value),
                  })
                }
              />
            </div>
            <SaveButton
              saving={savingPricing}
              saved={savedPricing}
              label="Guardar Reglas de Precio"
            />
          </form>
        </div>
      )}

      {/* ── TAB: Reglas de Venta ── */}
      {activeTab === "venta" && (
        <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
          <SectionHeader
            title="Reglas de Venta de Usuarios"
            desc="Define cómo se modifican los precios cuando un usuario te vende items desde su inventario."
          />
          <form onSubmit={handleUserSellSubmit} className="space-y-5 max-w-xl">
            <ToggleSwitch
              checked={settings.userSellModifierEnabled}
              onChange={(v) =>
                setSettings({ ...settings, userSellModifierEnabled: v })
              }
              label="Habilitar Modificador de Venta"
            />
            <div className="space-y-1.5">
              <FieldLabel>Tipo de Modificador</FieldLabel>
              <AdminSelect
                value={settings.userSellModifierType}
                onChange={(v) =>
                  setSettings({ ...settings, userSellModifierType: v })
                }
                options={MODIFIER_OPTIONS}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Valor</FieldLabel>
              <StyledInput
                type="number"
                step="0.01"
                value={settings.userSellModifierValue}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    userSellModifierValue: Number(e.target.value),
                  })
                }
              />
            </div>
            <SaveButton
              saving={savingUserSell}
              saved={savedUserSell}
              label="Guardar Reglas de Venta"
            />
          </form>
        </div>
      )}

      {/* ── TAB: Reglas de Reventa ── */}
      {activeTab === "reventa" && (
        <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
          <SectionHeader
            title="Reglas de Reventa SteamWebAPI"
            desc="Define cómo se modifican los precios para las skins bajo pedido traídas de Youpin."
          />
          <form onSubmit={handleResellSubmit} className="space-y-5 max-w-xl">
            <ToggleSwitch
              checked={settings.resellModifierEnabled}
              onChange={(v) =>
                setSettings({ ...settings, resellModifierEnabled: v })
              }
              label="Habilitar Modificador de Reventa"
            />
            <div className="space-y-1.5">
              <FieldLabel>Tipo de Modificador</FieldLabel>
              <AdminSelect
                value={settings.resellModifierType}
                onChange={(v) =>
                  setSettings({ ...settings, resellModifierType: v })
                }
                options={MODIFIER_OPTIONS}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Valor</FieldLabel>
              <StyledInput
                type="number"
                step="0.01"
                value={settings.resellModifierValue}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    resellModifierValue: Number(e.target.value),
                  })
                }
              />
            </div>
            <SaveButton
              saving={savingResell}
              saved={savedResell}
              label="Guardar Reglas de Reventa"
            />
          </form>
        </div>
      )}

      {/* ── TAB: Límites ── */}
      {activeTab === "limites" && (
        <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
          <SectionHeader
            title="Límites de Venta"
            desc="Establecé restricciones mínimas para las ventas que los usuarios pueden realizar en la plataforma."
          />
          <form onSubmit={handleMinSellSubmit} className="space-y-5 max-w-xl">
            <div className="space-y-1.5">
              <FieldLabel>Precio Mínimo de Venta (USD)</FieldLabel>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/60 text-sm font-bold">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={settings.minimumUserSellPrice}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      minimumUserSellPrice: Number(e.target.value),
                    })
                  }
                  className="w-full pl-8 pr-4 py-3 bg-white/[0.03] border border-white/8 rounded-[3px] text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 focus:bg-white/[0.05] transition-all"
                />
              </div>
              <p className="text-[10px] text-[#84849b] font-mono">
                Los usuarios no podrán listar skins por debajo de este monto.
              </p>
            </div>
            <SaveButton
              saving={savingMinSell}
              saved={savedMinSell}
              label="Guardar Precio Mínimo"
            />
          </form>
        </div>
      )}

      {/* ── TAB: Webhook ── */}
      {activeTab === "webhook" && (
        <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
          <SectionHeader
            title="Notificaciones vía Webhook"
            desc="Configurá una URL externa para recibir notificaciones HTTP en tiempo real cada vez que ocurra una compra o venta."
          />
          <form onSubmit={handleWebhookSubmit} className="space-y-5 max-w-xl">
            <div className="space-y-1.5">
              <FieldLabel>Webhook URL</FieldLabel>
              <StyledInput
                type="url"
                placeholder="https://tu-servidor.com/webhook"
                value={settings.webhookUrl || ""}
                onChange={(e) =>
                  setSettings({ ...settings, webhookUrl: e.target.value })
                }
                style={{ fontFamily: "monospace" }}
              />
              <p className="text-[10px] text-[#84849b] font-mono leading-relaxed">
                Tu servidor recibirá un{" "}
                <span className="text-white font-bold">POST</span> con los
                detalles del pedido, datos del cliente y método de pago en
                formato JSON.
              </p>
            </div>

            {/* Info card */}
            <div className="p-4 bg-white/[0.02] border border-white/[0.05] space-y-1.5 rounded-[3px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#84849b]">
                Eventos disparados
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {["order.created", "order.status_updated"].map((ev) => (
                  <span
                    key={ev}
                    className="px-2 py-1 bg-accent/10 border border-accent/20 text-accent text-[10px] font-mono rounded-[3px]"
                  >
                    {ev}
                  </span>
                ))}
              </div>
            </div>

            <SaveButton
              saving={savingWebhook}
              saved={savedWebhook}
              label="Guardar Webhook"
            />
          </form>
        </div>
      )}
    </div>
  );
}
