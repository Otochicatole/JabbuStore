"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/shared/components/Button";
import { motion } from "framer-motion";
import { Zap, ShieldCheck, Banknote, ArrowRight, Star, Clock } from "lucide-react";

const stats = [
  { label: "Usuarios Activos", value: "150,000+" },
  { label: "Items Intercambiados", value: "2.5M+" },
  { label: "Valor Pagado", value: "$12M+" },
  { label: "Tiempo Promedio", value: "< 1 Minuto" }
];

const features = [
  {
    icon: <Zap className="h-6 w-6 text-accent" />,
    title: "Retiros Instantáneos",
    description: "Recibe tu dinero en segundos a través de criptomonedas o transferencias bancarias locales."
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-accent" />,
    title: "100% Seguro",
    description: "Todas las transacciones están protegidas. Somos la plataforma más segura de la industria."
  },
  {
    icon: <Banknote className="h-6 w-6 text-accent" />,
    title: "Las Mejores Tarifas",
    description: "Comisiones increíblemente bajas para que obtengas el mayor valor por tus skins de CS2."
  }
];

export default function Home() {
  return (
    <>
      <main className="relative min-h-screen overflow-hidden">
        {/* Animated Background Effects */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-accent/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

        {/* Hero Section */}
        <section className="relative mx-auto max-w-7xl px-6 pt-32 pb-20 lg:pt-48 lg:pb-32 flex flex-col lg:flex-row items-center z-10">
          <div className="flex-1 text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 shadow-lg"
            >
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 text-[#00b67a] fill-[#00b67a]" />
                ))}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 border-l border-white/10 pl-2 ml-1">
                Trustpilot Excelente
              </span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6 text-5xl font-black tracking-tighter text-white md:text-7xl lg:text-8xl uppercase leading-[0.9]"
            >
              Intercambia <br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-400">
                Skins de CS2
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-10 max-w-2xl text-lg text-white/60 mx-auto lg:mx-0 font-medium"
            >
              JabbuStore es la plataforma definitiva para comprar, vender e intercambiar tus items de Counter-Strike 2. Rapidez, seguridad y las mejores tarifas del mercado.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link href="/buy">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-[13px] flex gap-2 group">
                  Comprar Skins
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/sell">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-[13px] bg-card/50 backdrop-blur-md">
                  Vender por Efectivo
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Floating Image Right Side */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 relative w-full h-[400px] lg:h-[600px] mt-16 lg:mt-0"
          >
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ 
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="relative w-full max-w-md aspect-square">
                <div className="absolute inset-0 bg-accent/20 blur-[100px] rounded-full" />
                <Image 
                  src="/skin.webp" 
                  alt="Featured CS2 Skin" 
                  fill 
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-contain drop-shadow-[0_0_50px_rgba(217,70,239,0.4)] z-10 scale-125"
                  priority
                />
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Stats Section */}
        <section className="relative z-20 border-y border-white/5 bg-white/[0.01] backdrop-blur-md shadow-2xl">
          <div className="mx-auto max-w-7xl px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="text-center group">
                  <div className="text-3xl md:text-5xl font-black text-white mb-2 group-hover:text-accent transition-colors">{stat.value}</div>
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative z-10 mx-auto max-w-7xl px-6 py-32">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight mb-6">
              Por Qué Elegir <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-400">JabbuStore</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto text-lg">
              Nuestra plataforma está diseñada por y para jugadores. Ofrecemos herramientas premium sin complicaciones.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-card p-10 rounded-[16px] border border-white/5 hover:border-accent/30 transition-all shadow-xl relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="h-14 w-14 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">{feature.title}</h3>
                <p className="text-white/50 leading-relaxed font-medium">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="relative z-10 mx-auto max-w-5xl px-6 py-24 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/10 to-transparent rounded-[40px] pointer-events-none" />
          <div className="relative z-10 bg-card/80 backdrop-blur-xl border border-accent/20 rounded-[40px] p-12 lg:p-24 shadow-[0_0_100px_rgba(217,70,239,0.15)] overflow-hidden">
            <div className="absolute -top-40 -right-40 h-80 w-80 bg-accent/20 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 h-80 w-80 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />
            
            <h2 className="relative z-10 text-4xl md:text-7xl font-black text-white uppercase mb-6 tracking-tight">
              ¿Listo Para Empezar?
            </h2>
            <p className="relative z-10 text-xl text-white/60 mb-12 max-w-xl mx-auto">
              Descubre el verdadero valor de tu inventario o adquiere las skins que siempre quisiste en segundos.
            </p>
            <div className="relative z-10 flex justify-center gap-4">
              <Link href="/buy">
                <Button size="lg" className="h-16 px-12 text-[14px] shadow-[0_0_40px_rgba(217,70,239,0.4)]">
                  Explorar Tienda
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 bg-background pt-20 pb-10">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-4 opacity-50 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-[4px] bg-white flex items-center justify-center font-black text-background text-xs">
                JS
              </div>
              <span className="text-xl font-black tracking-tight uppercase text-white">
                JabbuStore
              </span>
            </div>
            <div className="text-xs text-white/60">
              El mercado de skins del futuro.
            </div>
          </div>
          <div className="text-xs text-white/40 text-center md:text-right font-medium leading-relaxed">
            © 2026 JabbuStore. Todos los derechos reservados.<br/>
            JabbuStore no está afiliado ni respaldado por Valve Corporation.<br/>
            Counter-Strike y CS2 son marcas registradas de Valve.
          </div>
        </div>
      </footer>
    </>
  );
}
