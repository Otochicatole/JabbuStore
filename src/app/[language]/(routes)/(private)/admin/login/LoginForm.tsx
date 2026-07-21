"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useI18n } from '@/shared/i18n/I18nProvider';
import { useLocalizedPath } from '@/shared/i18n/useLocalizedPath';

export function LoginForm() {
  const router = useRouter();
  const localizePath = useLocalizedPath();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t("admin.login.requiredFields"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error || t("admin.login.error"));
      }

      // Redirigir al panel. Al cargar, el servidor validará el JWT de la cookie de forma automática.
      router.push(localizePath('/admin/panel/inventory'));
      router.refresh(); // Refrescar para activar la carga del Server Component
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("admin.login.serverError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10">
      {/* Brand / Logo Section */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,255,255,0.02)] relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <ShieldCheck className="w-7 h-7 text-white transition-transform duration-500 group-hover:scale-110" />
        </div>
        <h1 className="text-xl font-black text-white uppercase tracking-wider mb-1 font-sans">
          Jabbu<span className="text-[#d946ef]">Store</span> Admin
        </h1>
        <p className="text-xs text-[#84849b] font-medium font-mono uppercase tracking-widest">
          {t("admin.login.secureAccess")}
        </p>
      </div>

      {/* Glass Form Card */}
      <div className="bg-[#110f1e]/80 border border-white/5 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Top border ambient glow line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#84849b] uppercase tracking-wider block font-mono">
              {t("admin.login.email")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="admin@example.com"
                className="w-full pl-10 pr-4 py-3 bg-[#161426]/50 border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:border-accent/40 focus:outline-none transition-all font-sans"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#84849b] uppercase tracking-wider block font-mono">
              {t("admin.login.password")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 bg-[#161426]/50 border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:border-accent/40 focus:outline-none transition-all font-sans"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-white/90 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-2 shadow-[0_4px_20px_rgba(255,255,255,0.1)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>{t("admin.login.verifying")}</span>
              </>
            ) : (
              <span>{t("admin.login.submit")}</span>
            )}
          </button>
        </form>
      </div>

      {/* Back Link */}
      <div className="text-center mt-6">
        <Link
          href="/"
          className="text-[10px] font-black text-[#84849b] hover:text-white uppercase tracking-wider transition-colors font-mono"
        >
          ← {t("checkout.backToStore")}
        </Link>
      </div>
    </div>
  );
}
