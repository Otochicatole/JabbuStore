"use client";

import React, { useState, useEffect } from "react";
import { Eye, Mail, Trash2 } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { BACKEND_URL } from "@/shared/lib/api";
import type { SecretStatus } from "@/features/admin/types";
import { AdminAlert, AdminBadge, AdminButton, AdminSection } from "@/features/admin/ui/AdminShell";
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
  const [testingSendGrid, setTestingSendGrid] = useState(false);

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

  const handleTestSendGridEmail = async () => {
    setTestingSendGrid(true);
    setSecretError(null);
    setSecretMessage(null);
    try {
      const response = await fetch(`${BACKEND_URL}/admin/marketplace/settings/sendgrid/test`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        throw new Error(data.error || t("admin.settings.sendgridTestError"));
      }
      setSecretMessage(
        t("admin.settings.sendgridTestSuccess", {
          to: Array.isArray(data.to) ? data.to.join(", ") : "",
          from: data.from || "",
        }),
      );
    } catch (err: unknown) {
      setSecretError(getErrorMessage(err, t("admin.settings.sendgridTestError")));
    } finally {
      setTestingSendGrid(false);
    }
  };

  const sendgridFromStatus = secretStatuses.find((item) => item.key === "SENDGRID_FROM");
  const sendgridToStatus = secretStatuses.find((item) => item.key === "SENDGRID_TO");
  const sendgridApiKeyStatus = secretStatuses.find((item) => item.key === "SENDGRID_API_KEY");
  const isSendGridReady =
    Boolean(sendgridApiKeyStatus?.configured) &&
    Boolean(sendgridFromStatus?.configured) &&
    Boolean(sendgridToStatus?.configured);

  return (
    <AdminSection>
      <SectionHeader
        title={t("admin.settings.credentialsTitle")}
        desc={t("admin.settings.credentialsDescription")}
      />

      <div className="max-w-4xl space-y-5">
        <div className="flex flex-col justify-between gap-4 rounded-lg border border-accent/25 bg-accent/10 p-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Mail className="h-4 w-4 text-accent" />
              {t("admin.settings.sendgridEmailSectionTitle")}
            </h3>
            <p className="text-xs leading-relaxed text-[#b8b2cd]">
              {t("admin.settings.sendgridEmailSectionHelp")}
            </p>
          </div>
          <AdminButton
            type="button"
            variant="primary"
            size="sm"
            icon={Mail}
            loading={testingSendGrid}
            onClick={() => void handleTestSendGridEmail()}
            disabled={testingSendGrid || !isSendGridReady}
            className="shrink-0"
          >
            {testingSendGrid ? t("admin.settings.sendgridTesting") : t("admin.settings.sendgridTestButton")}
          </AdminButton>
        </div>

        <div className="space-y-1.5">
          <FieldLabel>{t("admin.settings.masterPassword")}</FieldLabel>
          <StyledInput
            type="password"
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
            placeholder="ADMIN_SECRETS_PASSWORD"
            autoComplete="off"
          />
          <p className="text-xs text-[#9e98b6]">
            {t("admin.settings.masterPasswordHelp")}
          </p>
        </div>

        {secretError && <AdminAlert tone="error">{secretError}</AdminAlert>}
        {secretMessage && <AdminAlert tone="success">{secretMessage}</AdminAlert>}

        <div className="grid grid-cols-1 gap-3.5">
          {SECRET_LABELS.map(({ key, label }) => {
            const status = secretStatuses.find((item) => item.key === key);
            const busy = savingSecretKey === key;

            return (
              <div key={key} className="space-y-3 rounded-lg border border-white/[0.06] bg-[#1a1630] p-4">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="text-sm font-semibold text-white">
                      {label}
                    </h3>
                    {key === "SENDGRID_FROM" && (
                      <p className="text-xs text-[#9e98b6]">
                        {t("admin.settings.sendgridHintFrom")}
                      </p>
                    )}
                    {key === "SENDGRID_TO" && (
                      <p className="text-xs text-[#9e98b6]">
                        {t("admin.settings.sendgridHintTo")}
                      </p>
                    )}
                    <p className="font-mono text-xs text-[#9e98b6]">
                      {status?.configured
                        ? `${t("admin.settings.configured")} (${status.source})${status.last4 ? ` · ${status.last4}` : ""}`
                        : t("admin.settings.notConfigured")}
                    </p>
                  </div>
                  <AdminBadge tone={status?.configured ? "success" : "danger"} dot>
                    {status?.configured ? t("admin.settings.active") : t("admin.settings.missing")}
                  </AdminBadge>
                </div>

                {revealedSecrets[key] && (
                  <div className="rounded-md border border-white/[0.07] bg-[#0d0a18] p-3">
                    <p className="mb-1 text-xs font-medium text-[#9e98b6]">
                      {t("admin.settings.revealedValue")}
                    </p>
                    <p className="select-all break-all font-mono text-xs text-white">
                      {revealedSecrets[key]}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_auto]">
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
                    <AdminButton
                      type="button"
                      variant="primary"
                      size="sm"
                      loading={busy}
                      onClick={() => void handleSaveSecret(key)}
                      disabled={busy || !secretDrafts[key] || !masterPassword}
                    >
                      {t("common.save")}
                    </AdminButton>
                    <AdminButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={Eye}
                      onClick={() => void handleRevealSecret(key)}
                      disabled={busy || !masterPassword}
                    >
                      {t("common.view")}
                    </AdminButton>
                    <AdminButton
                      type="button"
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => void handleDeleteSecret(key)}
                      disabled={busy || !masterPassword}
                    >
                      {t("common.delete")}
                    </AdminButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminSection>
  );
}
