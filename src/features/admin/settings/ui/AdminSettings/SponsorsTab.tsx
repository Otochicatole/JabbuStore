"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { AdminAlert, AdminButton, AdminEmptyState } from "@/features/admin/ui/AdminShell";
import { FieldLabel, SectionHeader, StyledInput, ToggleSwitch } from "./FormControls";

interface AdminSponsor {
  id: string;
  name: string;
  imageOriginalName: string;
  imageMimeType: string;
  imageSize: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const sponsorImageUrl = (sponsor: AdminSponsor) =>
  `${BACKEND_URL}/sponsors/${sponsor.id}/image/${encodeURIComponent(sponsor.updatedAt)}`;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function SponsorsTab() {
  const { t } = useI18n();
  const [sponsors, setSponsors] = useState<AdminSponsor[]>([]);
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const previewUrl = useMemo(() => {
    if (!newImage) return null;
    return URL.createObjectURL(newImage);
  }, [newImage]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const syncDraftNames = (items: AdminSponsor[]) => {
    setDraftNames(
      items.reduce<Record<string, string>>((acc, sponsor) => {
        acc[sponsor.id] = sponsor.name;
        return acc;
      }, {}),
    );
  };

  const loadSponsors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/sponsors/admin`);
      if (!response.ok) {
        throw new Error(t("admin.sponsors.error.load"));
      }
      const data = (await response.json()) as AdminSponsor[];
      setSponsors(data);
      syncDraftNames(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : t("admin.sponsors.error.load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSponsors();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setListFromServer = (items: AdminSponsor[]) => {
    setSponsors(items);
    syncDraftNames(items);
  };

  const replaceSponsor = (updatedSponsor: AdminSponsor) => {
    setSponsors((current) =>
      current.map((sponsor) => (sponsor.id === updatedSponsor.id ? updatedSponsor : sponsor)),
    );
    setDraftNames((current) => ({ ...current, [updatedSponsor.id]: updatedSponsor.name }));
  };

  const handleNewImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewImage(event.target.files?.[0] ?? null);
  };

  const createSponsor = async (event: FormEvent) => {
    event.preventDefault();
    if (!newName.trim() || !newImage) {
      setError(t("admin.sponsors.error.required"));
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const body = new FormData();
      body.append("name", newName.trim());
      body.append("image", newImage);

      const response = await fetchWithAuth(`${BACKEND_URL}/sponsors/admin`, {
        method: "POST",
        body,
      });
      const data = (await response.json().catch(() => ({}))) as AdminSponsor & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || t("admin.sponsors.error.create"));
      }

      const nextSponsors = [...sponsors, data].sort((a, b) => a.displayOrder - b.displayOrder);
      setListFromServer(nextSponsors);
      setNewName("");
      setNewImage(null);
      setSuccess(t("admin.sponsors.created"));
    } catch (error) {
      setError(error instanceof Error ? error.message : t("admin.sponsors.error.create"));
    } finally {
      setCreating(false);
    }
  };

  const updateSponsor = async (sponsorId: string, input: { name?: string; isActive?: boolean; image?: File }) => {
    setMutatingId(sponsorId);
    setError(null);
    setSuccess(null);
    try {
      const body = new FormData();
      if (input.name !== undefined) body.append("name", input.name);
      if (input.isActive !== undefined) body.append("isActive", String(input.isActive));
      if (input.image) body.append("image", input.image);

      const response = await fetchWithAuth(`${BACKEND_URL}/sponsors/admin/${sponsorId}`, {
        method: "PATCH",
        body,
      });
      const data = (await response.json().catch(() => ({}))) as AdminSponsor & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || t("admin.sponsors.error.update"));
      }
      replaceSponsor(data);
      setSuccess(t("admin.sponsors.updated"));
    } catch (error) {
      setError(error instanceof Error ? error.message : t("admin.sponsors.error.update"));
    } finally {
      setMutatingId(null);
    }
  };

  const replaceImage = async (sponsorId: string, event: ChangeEvent<HTMLInputElement>) => {
    const image = event.target.files?.[0];
    event.target.value = "";
    if (!image) return;
    await updateSponsor(sponsorId, { image });
  };

  const reorderSponsors = async (fromIndex: number, direction: -1 | 1) => {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= sponsors.length) return;

    const nextSponsors = [...sponsors];
    const [moved] = nextSponsors.splice(fromIndex, 1);
    if (!moved) return;
    nextSponsors.splice(toIndex, 0, moved);

    setSponsors(nextSponsors);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/sponsors/admin/reorder`, {
        method: "PATCH",
        body: JSON.stringify({ ids: nextSponsors.map((sponsor) => sponsor.id) }),
      });
      const data = (await response.json().catch(() => ({}))) as AdminSponsor[] | { error?: string };
      if (!response.ok) {
        throw new Error(!Array.isArray(data) && data.error ? data.error : t("admin.sponsors.error.reorder"));
      }
      if (!Array.isArray(data)) {
        throw new Error(t("admin.sponsors.error.reorder"));
      }
      setListFromServer(data);
      setSuccess(t("admin.sponsors.reordered"));
    } catch (error) {
      await loadSponsors();
      setError(error instanceof Error ? error.message : t("admin.sponsors.error.reorder"));
    }
  };

  const deleteSponsor = async (sponsor: AdminSponsor) => {
    const confirmed = window.confirm(t("admin.sponsors.confirmDelete", { name: sponsor.name }));
    if (!confirmed) return;

    setMutatingId(sponsor.id);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/sponsors/admin/${sponsor.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || t("admin.sponsors.error.delete"));
      }
      setSponsors((current) => current.filter((item) => item.id !== sponsor.id));
      setDraftNames((current) => {
        const next = { ...current };
        delete next[sponsor.id];
        return next;
      });
      setSuccess(t("admin.sponsors.deleted"));
    } catch (error) {
      setError(error instanceof Error ? error.message : t("admin.sponsors.error.delete"));
    } finally {
      setMutatingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[3px] border border-white/5 bg-[#110f1e]/40 p-4 sm:p-6">
        <SectionHeader
          title={t("admin.sponsors.form.title")}
          desc={t("admin.sponsors.form.desc")}
        />

        <form onSubmit={createSponsor} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-end">
          <div className="space-y-1.5">
            <FieldLabel>{t("admin.sponsors.name")}</FieldLabel>
            <StyledInput
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder={t("admin.sponsors.namePlaceholder")}
              maxLength={80}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>{t("admin.sponsors.image")}</FieldLabel>
            <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[3px] border border-white/10 bg-white/[0.03] px-4 text-xs font-black uppercase tracking-wider text-white transition-all hover:border-accent/40 hover:bg-white/[0.05]">
              <Upload className="h-4 w-4 text-accent" />
              {newImage ? newImage.name : t("admin.sponsors.selectImage")}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleNewImageChange}
                className="sr-only"
              />
            </label>
          </div>

          <AdminButton
            type="submit"
            icon={ImagePlus}
            loading={creating}
            disabled={creating}
            variant="primary"
            className="h-11"
          >
            {t("admin.sponsors.create")}
          </AdminButton>
        </form>

        {previewUrl && (
          <div className="mt-4 flex items-center gap-3 rounded-[3px] border border-white/5 bg-black/20 p-3">
            <div className="relative h-14 w-24 overflow-hidden rounded-[3px] border border-white/10 bg-white/[0.04]">
              <Image src={previewUrl} alt={newName || "Sponsor"} fill className="object-contain p-2" />
            </div>
            <p className="min-w-0 truncate text-xs font-bold text-[#84849b]">{newImage?.name}</p>
          </div>
        )}
      </div>

      {error && <AdminAlert>{error}</AdminAlert>}
      {success && <AdminAlert tone="success">{success}</AdminAlert>}

      <div className="rounded-[3px] border border-white/5 bg-[#110f1e]/40 p-4 sm:p-6">
        <SectionHeader
          title={t("admin.sponsors.list.title")}
          desc={t("admin.sponsors.list.desc")}
        />

        {loading ? (
          <div className="flex min-h-40 items-center justify-center text-white/40">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
        ) : sponsors.length === 0 ? (
          <AdminEmptyState icon={ImagePlus} title={t("admin.sponsors.empty")} />
        ) : (
          <div className="space-y-3">
            {sponsors.map((sponsor, index) => {
              const draftName = draftNames[sponsor.id] ?? sponsor.name;
              const isMutating = mutatingId === sponsor.id;
              const nameChanged = draftName.trim() !== sponsor.name;

              return (
                <div
                  key={sponsor.id}
                  className="grid gap-4 rounded-[3px] border border-white/5 bg-black/20 p-4 lg:grid-cols-[96px_minmax(0,1fr)_auto] lg:items-center"
                >
                  <div className="relative h-20 w-24 overflow-hidden rounded-[3px] border border-white/10 bg-white/[0.04]">
                    <Image src={sponsorImageUrl(sponsor)} alt={sponsor.name} fill className="object-contain p-2" />
                  </div>

                  <div className="min-w-0 space-y-3">
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                      <div className="space-y-1.5">
                        <FieldLabel>{t("admin.sponsors.name")}</FieldLabel>
                        <StyledInput
                          value={draftName}
                          onChange={(event) =>
                            setDraftNames((current) => ({
                              ...current,
                              [sponsor.id]: event.target.value,
                            }))
                          }
                          maxLength={80}
                        />
                      </div>
                      <AdminButton
                        icon={Save}
                        loading={isMutating}
                        disabled={isMutating || !nameChanged || draftName.trim().length === 0}
                        onClick={() => void updateSponsor(sponsor.id, { name: draftName.trim() })}
                      >
                        {t("common.save")}
                      </AdminButton>
                    </div>

                    <div className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-wider text-[#84849b] sm:flex-row sm:items-center sm:justify-between">
                      <span className="truncate">
                        {sponsor.imageOriginalName} · {formatBytes(sponsor.imageSize)}
                      </span>
                      <ToggleSwitch
                        checked={sponsor.isActive}
                        onChange={(checked) => void updateSponsor(sponsor.id, { isActive: checked })}
                        label={sponsor.isActive ? t("common.enabled") : t("common.disabled")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:flex-col">
                    <AdminButton
                      icon={ArrowUp}
                      disabled={isMutating || index === 0}
                      onClick={() => void reorderSponsors(index, -1)}
                    >
                      {t("admin.sponsors.moveUp")}
                    </AdminButton>
                    <AdminButton
                      icon={ArrowDown}
                      disabled={isMutating || index === sponsors.length - 1}
                      onClick={() => void reorderSponsors(index, 1)}
                    >
                      {t("admin.sponsors.moveDown")}
                    </AdminButton>
                    <label className="inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[3px] border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-white/[0.07] sm:w-auto lg:w-full">
                      <Upload className="h-4 w-4" />
                      <span className="truncate">{t("common.replace")}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) => void replaceImage(sponsor.id, event)}
                        className="sr-only"
                      />
                    </label>
                    <AdminButton
                      icon={Trash2}
                      variant="danger"
                      loading={isMutating}
                      disabled={isMutating}
                      onClick={() => void deleteSponsor(sponsor)}
                    >
                      {t("common.delete")}
                    </AdminButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
