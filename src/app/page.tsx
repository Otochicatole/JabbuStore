"use client";

import Link from "next/link";
import { Button } from "@/shared/components/Button";
import { ArrowRight, ShoppingBag, DollarSign, Shield, Zap, TrendingUp } from "lucide-react";

const stats = [
  { label: "Usuarios Activos", value: "150K+" },
  { label: "Skins Disponibles", value: "45K+" },
  { label: "Transacciones", value: "2.5M+" },
  { label: "Soporte Online", value: "24/7" },
];

export default function Home() {
  return (
    <div className="relative min-h-screen w-full bg-[#191527] overflow-hidden text-white flex flex-col pt-16 font-sans">
      {/* Tech Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Cyberpunk Accent Lights (No Framer Motion, Pure CSS Blur) */}
      <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[150px] pointer-events-none" />

      <main className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-12 justify-center">
        
        {/* Header Tag */}
        <div className="self-center md:self-start mb-6">
          <div className="inline-flex items-center gap-2 border border-accent/30 bg-accent/5 px-4 py-1.5 rounded-none text-[10px] font-black uppercase tracking-[0.2em] text-accent shadow-[0_0_15px_rgba(217,70,239,0.15)]">
            <span className="inline-block w-1.5 h-1.5 bg-accent animate-pulse" />
            CS2 Trading Hub Oficial
          </div>
        </div>

        {/* Main Hero Grid */}
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero text Left */}
          <div className="lg:col-span-7 flex flex-col text-center lg:text-left">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9] text-white">
              Intercambia
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-fuchsia-500 to-purple-400 drop-shadow-[0_2px_20px_rgba(217,70,239,0.2)]">
                Skins de CS2
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-white/60 text-base md:text-lg font-medium leading-relaxed self-center lg:self-start">
              La forma más rápida y segura de renovar tu inventario o retirar efectivo de inmediato. Sin tarifas ocultas, con tecnología de punta.
            </p>

            {/* Stats row integrated into Hero */}
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/5 pt-8">
              {stats.map((s) => (
                <div key={s.label} className="border-l-2 border-accent pl-4 text-left">
                  <div className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {s.value}
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-white/40 mt-1">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Action Blocks Right (Buy & Sell split) */}
          <div className="lg:col-span-5 grid sm:grid-cols-2 lg:grid-cols-1 gap-6 w-full">
            
            {/* Buy Card Block */}
            <div className="relative group overflow-hidden bg-card/40 border border-white/5 hover:border-accent/40 p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/15 transition-all duration-300" />
              <div>
                <div className="w-12 h-12 bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform duration-300">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
                  Comprar Skins
                </h3>
                <p className="text-xs text-white/55 leading-relaxed font-medium mb-8">
                  Explora nuestro catálogo masivo de skins verificadas. Los mejores precios e instant delivery.
                </p>
              </div>
              <Link href="/buy" className="w-full">
                <Button className="w-full h-12 bg-accent text-white font-bold uppercase tracking-widest text-xs border border-accent hover:bg-white hover:text-accent hover:border-white transition-all duration-300 rounded-none flex items-center justify-center gap-2">
                  Explorar Tienda
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Sell Card Block */}
            <div className="relative group overflow-hidden bg-card/40 border border-white/5 hover:border-accent/40 p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/5 rounded-full blur-2xl group-hover:bg-fuchsia-500/15 transition-all duration-300" />
              <div>
                <div className="w-12 h-12 bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
                  Vender por Cash
                </h3>
                <p className="text-xs text-white/55 leading-relaxed font-medium mb-8">
                  Convierte tus skins de CS2 en dinero real. Pagos directos e instantáneos a tu cuenta favorita.
                </p>
              </div>
              <Link href="/sell" className="w-full">
                <Button className="w-full h-12 bg-transparent text-white font-bold uppercase tracking-widest text-xs border border-white/20 hover:border-accent hover:bg-accent transition-all duration-300 rounded-none flex items-center justify-center gap-2">
                  Retirar Efectivo
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

          </div>
        </div>

        {/* Tech Features Row */}
        <div className="mt-20 grid md:grid-cols-3 gap-6 border-t border-white/5 pt-12">
          <div className="flex items-start gap-4 p-4 hover:bg-white/[0.01] transition-all">
            <div className="p-2.5 bg-accent/5 border border-accent/20 text-accent">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-white mb-1">Garantía de Seguridad</h4>
              <p className="text-xs text-white/50 leading-relaxed font-medium">Todas las operaciones protegidas y automatizadas vía Steam API.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 hover:bg-white/[0.01] transition-all">
            <div className="p-2.5 bg-accent/5 border border-accent/20 text-accent">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-white mb-1">Procesamiento Ultra Veloz</h4>
              <p className="text-xs text-white/50 leading-relaxed font-medium">Skins y dinero acreditados en menos de un minuto.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 hover:bg-white/[0.01] transition-all">
            <div className="p-2.5 bg-accent/5 border border-accent/20 text-accent">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-white mb-1">Tarifas Justas</h4>
              <p className="text-xs text-white/50 leading-relaxed font-medium">Cálculo en base a mercados reales globales (Youpin/Steam).</p>
            </div>
          </div>
        </div>

      </main>

      {/* Clean Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#141221] px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-accent flex items-center justify-center font-black text-white text-xs">
              JS
            </div>
            <span className="text-xs font-black uppercase tracking-widest">
              Jabbu<span className="text-accent">Store</span>
            </span>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 text-center md:text-right">
            © 2026 JabbuStore · No afiliado a Valve Corporation · CS2 es marca registrada
          </div>
        </div>
      </footer>
    </div>
  );
}