"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  User,
  Mail,
  Link2,
  Copy,
  Check,
  HelpCircle,
  Save,
  ExternalLink,
} from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";

import type { UserProfile } from "@/features/users/types";

export default function UserProfilePage() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tradeUrl, setTradeUrl] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetchWithAuth(`${BACKEND_URL}/users/me`);
        if (res.ok) {
          const data = (await res.json()) as UserProfile;
          setProfile(data);
          setName(data.name || "");
          setEmail(data.email || "");
          setTradeUrl(data.tradeUrl || "");
        }
      } catch (e) {
        console.error("Error fetching user profile", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleCopySteamId = () => {
    if (!profile?.steamId) return;
    navigator.clipboard.writeText(profile.steamId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/users/me`, {
        method: "PATCH",
        signal: controller.signal,
        body: JSON.stringify({
          name: name.trim() || null,
          email: email.trim() || null,
          tradeUrl: tradeUrl.trim() || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setName(data.name || "");
        setEmail(data.email || "");
        setTradeUrl(data.tradeUrl || "");
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || t("profile.updateError"));
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      alert(
        err instanceof DOMException && err.name === "AbortError"
          ? t("profile.timeoutError")
          : t("profile.connectionError"),
      );
    } finally {
      window.clearTimeout(timeout);
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-20 text-white min-h-screen font-sans">
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
          {t("profile.title")}
        </h1>
        <p className="text-sm text-[#84849b] mt-1.5 font-medium">
          {t("profile.description")}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-[#110f1e]/20 border border-white/5 rounded-3xl backdrop-blur-md">
          <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
          <p className="text-xs text-[#84849b] font-bold uppercase tracking-widest">
            {t("profile.loading")}
          </p>
        </div>
      ) : !profile ? (
        <div className="text-center py-20 bg-[#110f1e]/20 border border-white/5 rounded-3xl">
          <p className="text-[#84849b] font-bold">
            {t("profile.loginRequired")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
          {/* Left Column: Steam Card */}
          <div className="bg-[#110f1e]/40 border border-white/5 rounded-2xl p-4 sm:p-6 h-fit flex flex-col items-center text-center backdrop-blur-sm">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-accent/40 shadow-xl shadow-accent/5 mb-4 group">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-accent/15 flex items-center justify-center">
                  <User className="w-10 h-10 text-accent" />
                </div>
              )}
            </div>

            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest mb-3">
              {t("profile.linkedAccount")}
            </span>

            <h3 className="text-lg font-black text-white truncate max-w-full">
              {profile.name || "Usuario de Steam"}
            </h3>

            {profile.profileUrl && (
              <a
                href={profile.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-accent/80 hover:text-accent flex items-center gap-1.5 mt-1 transition-colors group"
              >
                <span>{t("profile.steamProfile")}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
              </a>
            )}

            <div className="w-full border-t border-white/5 my-5" />

            <div className="w-full text-left">
              <span className="text-[9px] text-[#84849b] font-mono block uppercase tracking-widest mb-1.5">
                Steam ID
              </span>
              <div className="flex items-center justify-between gap-3 bg-[#0d0b16] border border-white/5 rounded-xl px-3.5 py-2.5">
                <span className="font-mono text-xs text-white/90 truncate">
                  {profile.steamId}
                </span>
                <button
                  onClick={handleCopySteamId}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all cursor-pointer flex-shrink-0"
                >
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Edit Profile Form */}
          <div className="lg:col-span-2 bg-[#110f1e]/40 border border-white/5 rounded-2xl p-4 sm:p-6 backdrop-blur-sm min-w-0">
            <h2 className="text-lg font-black uppercase tracking-tight text-white mb-6">
              {t("profile.editData")}
            </h2>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Alias / Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {t("profile.nameAlias")}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre en la tienda"
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {t("profile.email")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>

              {/* Trade Offer URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b] flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Link2 className="w-3.5 h-3.5" />
                    Steam Trade Offer URL (Trade Link)
                  </span>

                  <a
                    href="https://steamcommunity.com/my/tradeoffers/privacy#trade_offer_access_url"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[9px] font-bold text-accent/80 hover:text-accent flex items-center gap-1 normal-case tracking-normal"
                  >
                    {t("profile.whereFind")}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </label>
                <input
                  type="text"
                  value={tradeUrl}
                  onChange={(e) => setTradeUrl(e.target.value)}
                  placeholder="https://steamcommunity.com/tradeoffer/new/?partner=..."
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 transition-colors font-mono"
                />

                {/* Guide banner */}
                <div className="mt-1.5 p-3.5 bg-accent/5 border border-accent/15 rounded-xl flex items-start gap-3">
                  <HelpCircle className="w-4 h-4 text-accent/80 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-white/70 leading-relaxed font-medium">
                    {t("profile.tradeUrlHelp")}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-h-5">
                  {success && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      {t("profile.saved")}
                    </motion.span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3 bg-accent cursor-pointer hover:bg-accent/90 disabled:opacity-50 text-xs font-black uppercase tracking-wider text-white rounded-xl transition-all shadow-[0_0_20px_rgba(217,70,239,0.25)] flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("common.saving")}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {t("profile.saveChanges")}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
