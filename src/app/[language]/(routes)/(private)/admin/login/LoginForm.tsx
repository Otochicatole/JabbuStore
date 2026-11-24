"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, Loader2, ShieldCheck, AlertCircle, ArrowLeft } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useLocalizedPath } from "@/shared/i18n/useLocalizedPath";

export function LoginForm() {
  const router = useRouter();
  const localizePath = useLocalizedPath();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error || t("admin.login.error"));
      }

      router.push(localizePath("/admin/panel/inventory"));
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("admin.login.serverError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#141124] text-accent">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-white">
          JabbuStore Admin
        </h1>
        <p className="mt-1 text-xs text-[#9e98b6]">{t("admin.login.secureAccess")}</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#141124] p-6 sm:p-7 shadow-2xl">
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/25 bg-rose-500/10 p-3 text-xs font-medium text-rose-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#c2bdd6]">
              {t("admin.login.email")}
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e88a6]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="admin@example.com"
                className="h-10 w-full rounded-md border border-white/10 bg-[#0d0a18] pl-9 pr-3 text-sm text-white placeholder-[#746e8d] transition-colors focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#c2bdd6]">
              {t("admin.login.password")}
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e88a6]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••••••"
                className="h-10 w-full rounded-md border border-white/10 bg-[#0d0a18] pl-9 pr-3 text-sm text-white placeholder-[#746e8d] transition-colors focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("admin.login.verifying")}</span>
              </>
            ) : (
              <span>{t("admin.login.submit")}</span>
            )}
          </button>
        </form>
      </div>

      <div className="text-center">
        <Link
          href={localizePath("/")}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9e98b6] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{t("checkout.backToStore")}</span>
        </Link>
      </div>
    </div>
  );
}
