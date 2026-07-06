"use client";

import React, { useState, useEffect } from "react";
import { Eye, Trash2 } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { BACKEND_URL } from "@/shared/lib/api";
import type { SecretStatus } from "@/features/admin/types";
import { SECRET_LABELS } from "./constants";
import { SectionHeader, FieldLabel, StyledInput } from "./FormControls";
import { getErrorMessage } from "./helpers";

export function CredentialsTab() {
  const { t } = useI18n();
  const [secretStatuses, setSecretStatuses] = useState<SecretStatus[]>([]);
  const [secretDrafts, setSecretDrafts] = useState<Record<string, string>>({});
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, string>>({});
  const [masterPassword, setMasterPassword] = useState("");
  const [secretMessage, setSecretMessage] = useState<string | null>(null);
  const [secretError, setSecretError] = useState<string | null>(null);
  const [savingSecretKey, setSavingSecretKey] = useState<string | null>(null);

  const fetchSecretsStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/admin/marketplace/settings/secrets/status`, {
        credentials: "include",
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      });
      const data = await response.json().catch(() => []);
      if (!response.ok) {
        throw new Error(data.error || t("admin.settings.loadSecretsError"));
      }
      setSecretStatuses(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setSecretError(getErrorMessage(err, t("admin.settings.loadSecretsError")));
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchSecretsStatus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleSaveSecret = async (key: string) => {
    setSavingSecretKey(key);
    setSecretError(null);
    setSecretMessage(null);
    try {
      const response = await fetch(`${BACKEND_URL}/admin/marketplace/settings/secrets/${key}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        body: JSON.stringify({
          value: secretDrafts[key] || "",
          password: masterPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || t("admin.settings.saveSecretError"));
      }
      setSecretDrafts((prev) => ({ ...prev, [key]: "" }));
      setSecretMessage(t("admin.settings.secretSaved"));
      await fetchSecretsStatus();
    } catch (err: unknown) {
      setSecretError(getErrorMessage(err, t("admin.settings.saveSecretError")));
    } finally {
      setSavingSecretKey(null);
    }
  };

  const handleRevealSecret = async (key: string) => {
    setSavingSecretKey(key);
    setSecretError(null);
    setSecretMessage(null);
    try {
      const response = await fetch(`${BACKEND_URL}/admin/marketplace/settings/secrets/${key}/reveal`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        body: JSON.stringify({ password: masterPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || t("admin.settings.revealSecretError"));
      }
      setRevealedSecrets((prev) => ({ ...prev, [key]: data.value || "" }));
      setSecretMessage(t("admin.settings.secretRevealed"));
    } catch (err: unknown) {
      setSecretError(getErrorMessage(err, t("admin.settings.revealSecretError")));
    } finally {
      setSavingSecretKey(null);
    }
  };

  const handleDeleteSecret = async (key: string) => {
    setSavingSecretKey(key);
    setSecretError(null);
    setSecretMessage(null);
    try {
      const response = await fetch(`${BACKEND_URL}/admin/marketplace/settings/secrets/${key}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        body: JSON.stringify({ password: masterPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || t("admin.settings.deleteSecretError"));
      }
      setRevealedSecrets((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setSecretMessage(t("admin.settings.secretDeleted"));
      await fetchSecretsStatus();
    } catch (err: unknown) {
      setSecretError(getErrorMessage(err, t("admin.settings.deleteSecretError")));
    } finally {
      setSavingSecretKey(null);
    }
  };

  return (
    <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
      <SectionHeader
        title={t("admin.settings.credentialsTitle")}
        desc={t("admin.settings.credentialsDescription")}
      />

      <div className="max-w-4xl space-y-5">
        <div className="space-y-1.5">
          <FieldLabel>{t("admin.settings.masterPassword")}</FieldLabel>
          <StyledInput
            type="password"
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
            placeholder="ADMIN_SECRETS_PASSWORD"
            autoComplete="off"
          />
          <p className="text-[10px] text-[#84849b] font-mono">
            {t("admin.settings.masterPasswordHelp")}
          </p>
        </div>

        {secretError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-bold rounded-[3px]">
            {secretError}
          </div>
        )}
        {secretMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold rounded-[3px]">
            {secretMessage}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {SECRET_LABELS.map(({ key, label }) => {
            const status = secretStatuses.find((item) => item.key === key);
            const busy = savingSecretKey === key;

            return (
              <div key={key} className="p-4 bg-white/[0.02] border border-white/5 rounded-[3px] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      {label}
                    </h3>
                    <p className="text-[10px] text-[#84849b] font-mono">
                      {status?.configured
                        ? `${t("admin.settings.configured")} (${status.source})${status.last4 ? ` · ${status.last4}` : ""}`
                        : t("admin.settings.notConfigured")}
                    </p>
                  </div>
                  <span className={`w-fit px-2 py-1 rounded-[3px] text-[9px] font-black uppercase tracking-wider ${
                    status?.configured
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-300 border border-red-500/20"
                  }`}>
                    {status?.configured ? t("admin.settings.active") : t("admin.settings.missing")}
                  </span>
                </div>

                {revealedSecrets[key] && (
                  <div className="p-3 bg-black/20 border border-white/5 rounded-[3px]">
                    <p className="text-[9px] text-[#84849b] uppercase font-black mb-1">
                      {t("admin.settings.revealedValue")}
                    </p>
                    <p className="text-xs text-white font-mono break-all select-all">
                      {revealedSecrets[key]}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-2">
                  <StyledInput
                    type="password"
                    value={secretDrafts[key] || ""}
                    onChange={(e) =>
                      setSecretDrafts((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    placeholder={t("admin.settings.newValue")}
                    autoComplete="off"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSaveSecret(key)}
                      disabled={busy || !secretDrafts[key] || !masterPassword}
                      className="px-3 py-2 bg-accent text-white rounded-[3px] text-[9px] font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                    >
                      {busy ? "..." : t("common.save")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRevealSecret(key)}
                      disabled={busy || !masterPassword}
                      className="px-3 py-2 bg-white/5 border border-white/10 text-white rounded-[3px] text-[9px] font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      {t("common.view")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteSecret(key)}
                      disabled={busy || !masterPassword}
                      className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-200 rounded-[3px] text-[9px] font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      {t("common.delete")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
