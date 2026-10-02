"use client";

import React, { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import {
  Plus,
  Loader2,
  Trophy,
  Users,
  X,
  Dices,
  Pencil,
  Trash2,
  Ban,
  Package,
  Search,
  Bot,
} from "lucide-react";
import { BACKEND_URL, fetchWithAuth } from "@/shared/lib/api";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { toValidationId } from "@/features/cart/domain/cart";
import {
  AdminAlert,
  AdminButton,
  AdminEmptyState,
  AdminHeader,
  AdminLoadingState,
  AdminPage,
  AdminSection,
  AdminSearchInput,
} from "@/features/admin/ui/AdminShell";
import { AdminSelect } from "@/shared/components/AdminSelect";
import { AlertConfirmModal } from "@/shared/components/AlertConfirmModal";

interface CatalogItem {
  id: string;
  name: string;
  weapon: string;
  price: number;
  imageUrl: string;
  exterior: string | null;
  float: number | null;
  isImmediate: boolean;
  provider?: "bot" | "youpin";
}

interface DrawPrize {
  id: string;
  position: number;
  assetId: string;
  name: string;
  price: number;
  iconUrl: string | null;
  exterior: string | null;
  float: number | null;
  provider: string;
  winnerId?: string | null;
  winner?: { id: string; name: string | null; avatar: string | null } | null;
}

interface EligibleUser {
  id: string;
  name: string | null;
  avatar: string | null;
  raffleCount: number;
  isBot?: boolean;
  chances?: number;
}

interface FakeBot {
  id: string;
  name: string | null;
  avatar: string | null;
}

interface ParticipationDraw {
  id: string;
  name: string;
  description: string | null;
  minRaffles: number;
  drawDate: string;
  status: string;
  isPublic: boolean;
  eligibleCount: number;
  eligibleUsers?: EligibleUser[];
  prizes: DrawPrize[];
  winners?: {
    prizeId: string;
    position: number;
    prizeName: string;
    prizeIconUrl: string | null;
    winner: { id: string; name: string | null; avatar: string | null } | null;
  }[];
  createdAt: string;
  updatedAt: string;
}

function statusBadge(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "FINISHED":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    default:
      return "bg-red-500/10 text-red-400 border-red-500/20";
  }
}

function ParticipationDrawsAdminContent() {
  const { t } = useI18n();

  const [draws, setDraws] = useState<ParticipationDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDraw, setEditingDraw] = useState<ParticipationDraw | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formMinRaffles, setFormMinRaffles] = useState("1");
  const [formDrawDate, setFormDrawDate] = useState("");
  const [selectedPrizes, setSelectedPrizes] = useState<{ item: CatalogItem; position: number }[]>(
    [],
  );
  const [submitting, setSubmitting] = useState(false);

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pickerTab, setPickerTab] = useState<"bot" | "youpin">("bot");

  const [participantsDraw, setParticipantsDraw] = useState<ParticipationDraw | null>(null);
  const [participantsDetails, setParticipantsDetails] = useState<ParticipationDraw | null>(null);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    type: "draw" | "cancel" | "delete";
    draw: ParticipationDraw;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [botsDraw, setBotsDraw] = useState<ParticipationDraw | null>(null);
  const [botMode, setBotMode] = useState<"new" | "existing">("new");
  const [formBotName, setFormBotName] = useState("");
  const [formBotAvatar, setFormBotAvatar] = useState("");
  const [formBotAvatarFile, setFormBotAvatarFile] = useState<File | null>(null);
  const [formBotId, setFormBotId] = useState("");
  const [botChances, setBotChances] = useState("10");
  const [existingBots, setExistingBots] = useState<FakeBot[]>([]);
  const [isLoadingBots, setIsLoadingBots] = useState(false);
  const [isSavingBots, setIsSavingBots] = useState(false);

  const loadDraws = useCallback(async () => {
    try {
      setError(null);
      const response = await fetchWithAuth(`${BACKEND_URL}/participation-draws/admin/all`);
      if (!response.ok) throw new Error(t("admin.participationDraws.errorLoad"));
      const data = await response.json();
      setDraws(data);
    } catch (err: any) {
      setError(err.message || t("admin.participationDraws.errorLoad"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadDraws();
  }, [loadDraws]);

  useEffect(() => {
    if (!botsDraw) return;
    let cancelled = false;
    const loadBots = async () => {
      setIsLoadingBots(true);
      try {
        const res = await fetchWithAuth(`${BACKEND_URL}/raffles/admin/bots`);
        if (!res.ok) throw new Error(t("common.error"));
        const data = await res.json();
        if (!cancelled) {
          setExistingBots(data || []);
          if (data?.length && !formBotId) {
            setFormBotId(data[0].id);
          }
        }
      } catch {
        if (!cancelled) setExistingBots([]);
      } finally {
        if (!cancelled) setIsLoadingBots(false);
      }
    };
    loadBots();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botsDraw, t]);

  const openAddBotsModal = (draw: ParticipationDraw) => {
    setBotsDraw(draw);
    setBotMode("new");
    setFormBotName("");
    setFormBotAvatar("");
    setFormBotAvatarFile(null);
    setFormBotId("");
    setBotChances("10");
  };

  const closeAddBotsModal = () => {
    if (isSavingBots) return;
    setBotsDraw(null);
  };

  const handleAddBots = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botsDraw) return;
    if (!botChances || Number(botChances) <= 0) {
      alert("Por favor ingresa una cantidad válida de chances.");
      return;
    }
    if (botMode === "new" && !formBotName.trim()) {
      alert("El nombre del bot es requerido.");
      return;
    }
    if (botMode === "existing" && !formBotId) {
      alert("Por favor selecciona un bot existente.");
      return;
    }

    setIsSavingBots(true);
    try {
      const formData = new FormData();
      formData.append("mode", botMode);
      formData.append("tickets", String(botChances));
      if (botMode === "new") {
        if (formBotName) formData.append("name", formBotName);
        if (formBotAvatarFile) {
          formData.append("avatarFile", formBotAvatarFile);
        } else if (formBotAvatar) {
          formData.append("avatar", formBotAvatar);
        }
      } else if (formBotId) {
        formData.append("botId", formBotId);
      }

      const res = await fetchWithAuth(
        `${BACKEND_URL}/participation-draws/admin/${botsDraw.id}/fake-participants`,
        { method: "POST", body: formData },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || t("common.error"));

      setBotsDraw(null);
      setFormBotName("");
      setFormBotAvatar("");
      setFormBotAvatarFile(null);
      setBotChances("10");
      await loadDraws();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setIsSavingBots(false);
    }
  };

  const loadCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const isImmediate = pickerTab === "bot";
      const res = await fetchWithAuth(
        `${BACKEND_URL}/catalog/items?limit=50&immediate=${isImmediate}`,
      );
      if (res.ok) {
        const data = await res.json();
        setCatalogItems(data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleOpenPicker = () => {
    setIsPickerOpen(true);
    loadCatalog();
  };

  useEffect(() => {
    if (isPickerOpen) loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerTab]);

  const filteredCatalog = catalogItems.filter((item) =>
    `${item.weapon} ${item.name}`.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredDraws = useMemo(() => {
    const query = search.trim().toLowerCase();
    return draws.filter((draw) => {
      if (statusFilter !== "ALL" && draw.status !== statusFilter) return false;
      if (!query) return true;
      return (
        draw.name.toLowerCase().includes(query) ||
        draw.prizes.some((prize) => prize.name.toLowerCase().includes(query))
      );
    });
  }, [draws, search, statusFilter]);

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormMinRaffles("1");
    setFormDrawDate("");
    setSelectedPrizes([]);
    setEditingDraw(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (draw: ParticipationDraw) => {
    setEditingDraw(draw);
    setFormName(draw.name);
    setFormDescription(draw.description || "");
    setFormMinRaffles(String(draw.minRaffles));
    const local = new Date(draw.drawDate);
    const pad = (n: number) => String(n).padStart(2, "0");
    setFormDrawDate(
      `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`,
    );
    setSelectedPrizes(
      draw.prizes.map((prize) => ({
        item: {
          id: prize.assetId,
          name: prize.name,
          weapon: prize.name,
          price: prize.price,
          imageUrl: prize.iconUrl || "/skin.webp",
          exterior: prize.exterior,
          float: prize.float,
          isImmediate: prize.provider === "bot",
          provider: prize.provider as "bot" | "youpin",
        },
        position: prize.position,
      })),
    );
    setIsModalOpen(true);
  };

  const toggleSelectPrize = (item: CatalogItem) => {
    setSelectedPrizes((prev) => {
      const exists = prev.some((p) => p.item.id === item.id);
      return exists
        ? prev.filter((p) => p.item.id !== item.id)
        : [...prev, { item, position: 1 }];
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const minRaffles = Number(formMinRaffles);
    if (!formName.trim() || !formDrawDate || !Number.isFinite(minRaffles) || minRaffles < 1) {
      setError(t("admin.participationDraws.formInvalid"));
      return;
    }
    if (selectedPrizes.length === 0) {
      setError(t("raffles.noPrizesSelected"));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const prizesPayload = selectedPrizes.map((p) => {
        const rawId = p.item.id;
        const provider =
          p.item.provider ||
          (rawId.startsWith("youpin-") || rawId.startsWith("market-")
            ? "youpin"
            : p.item.isImmediate
              ? "bot"
              : "youpin");
        const assetId =
          rawId.startsWith("youpin-") || rawId.startsWith("market-")
            ? rawId
            : toValidationId({ id: rawId, provider } as any);
        return { assetId, position: p.position };
      });

      const body = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        minRaffles,
        drawDate: new Date(formDrawDate).toISOString(),
        prizes: prizesPayload,
      };

      const url = editingDraw
        ? `${BACKEND_URL}/participation-draws/admin/${editingDraw.id}`
        : `${BACKEND_URL}/participation-draws/admin`;
      const response = await fetchWithAuth(url, {
        method: editingDraw ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || t("admin.participationDraws.errorSave"));
      }

      setIsModalOpen(false);
      resetForm();
      await loadDraws();
    } catch (err: any) {
      setError(err.message || t("admin.participationDraws.errorSave"));
    } finally {
      setSubmitting(false);
    }
  };

  const openParticipantsModal = async (draw: ParticipationDraw) => {
    setParticipantsDraw(draw);
    setParticipantsDetails(null);
    setLoadingParticipants(true);
    try {
      const response = await fetchWithAuth(
        `${BACKEND_URL}/participation-draws/admin/${draw.id}`,
      );
      if (!response.ok) throw new Error(t("admin.participationDraws.errorLoad"));
      const data = await response.json();
      setParticipantsDetails(data);
    } catch (err: any) {
      setError(err.message || t("admin.participationDraws.errorLoad"));
      setParticipantsDraw(null);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const closeParticipantsModal = () => {
    setParticipantsDraw(null);
    setParticipantsDetails(null);
  };

  const runConfirmedAction = async () => {
    if (!confirmModal) return;
    setActionLoading(true);
    setError(null);

    try {
      const { type, draw } = confirmModal;
      let response: Response;

      if (type === "draw") {
        response = await fetchWithAuth(
          `${BACKEND_URL}/participation-draws/admin/${draw.id}/draw`,
          { method: "POST" },
        );
      } else if (type === "cancel") {
        response = await fetchWithAuth(
          `${BACKEND_URL}/participation-draws/admin/${draw.id}/cancel`,
          { method: "PATCH" },
        );
      } else {
        response = await fetchWithAuth(
          `${BACKEND_URL}/participation-draws/admin/${draw.id}`,
          { method: "DELETE" },
        );
      }

      if (!response.ok && response.status !== 204) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || t("admin.participationDraws.errorAction"));
      }

      setConfirmModal(null);
      closeParticipantsModal();
      await loadDraws();
    } catch (err: any) {
      setError(err.message || t("admin.participationDraws.errorAction"));
    } finally {
      setActionLoading(false);
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "OPEN":
        return t("participationDraws.status.open");
      case "FINISHED":
        return t("participationDraws.status.finished");
      case "CANCELLED":
        return t("participationDraws.status.cancelled");
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <AdminPage>
        <AdminLoadingState label={t("common.loading")} />
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <AdminSection>
        <AdminHeader
          title={t("admin.participationDraws.title")}
          description={t("admin.participationDraws.description")}
          icon={Trophy}
          actions={
            <AdminButton variant="primary" icon={Plus} onClick={openCreateModal}>
              {t("admin.participationDraws.create")}
            </AdminButton>
          }
        />

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
          <AdminSearchInput
            value={search}
            onChange={setSearch}
            placeholder={t("admin.participationDraws.searchPlaceholder")}
          />
          <AdminSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "ALL", label: t("admin.participationDraws.allStatuses") },
              { value: "OPEN", label: t("participationDraws.status.open") },
              { value: "FINISHED", label: t("participationDraws.status.finished") },
              { value: "CANCELLED", label: t("participationDraws.status.cancelled") },
            ]}
          />
        </div>

        {error && (
          <div className="mt-4">
            <AdminAlert tone="error">{error}</AdminAlert>
          </div>
        )}
      </AdminSection>

      {filteredDraws.length === 0 ? (
        <AdminEmptyState
          icon={Trophy}
          title={t("admin.participationDraws.empty")}
          description={t("admin.participationDraws.emptyHint")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredDraws.map((draw) => {
            const primaryPrize = draw.prizes[0];

            return (
              <AdminSection key={draw.id} padded={false} className="overflow-hidden">
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-white truncate">
                          {draw.name}
                        </h3>
                        <span
                          className={`inline-flex items-center rounded-[3px] border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusBadge(draw.status)}`}
                        >
                          {statusLabel(draw.status)}
                        </span>
                      </div>
                      {draw.description && (
                        <p className="mt-1 text-xs text-[#84849b] line-clamp-2">
                          {draw.description}
                        </p>
                      )}
                    </div>
                    <div className="h-16 w-16 shrink-0 rounded-[3px] border border-white/10 bg-black/30 overflow-hidden flex items-center justify-center">
                      {primaryPrize?.iconUrl ? (
                        <img
                          src={primaryPrize.iconUrl}
                          alt={primaryPrize.name}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-white/20" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[3px] border border-white/5 bg-black/20 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#84849b]">
                        {t("admin.participationDraws.prizes")}
                      </p>
                      <p className="mt-1 text-sm font-black text-white">
                        {draw.prizes.length}
                      </p>
                    </div>
                    <div className="rounded-[3px] border border-white/5 bg-black/20 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#84849b]">
                        {t("admin.participationDraws.minRaffles")}
                      </p>
                      <p className="mt-1 text-sm font-black text-accent">
                        {draw.minRaffles}
                      </p>
                    </div>
                    <div className="rounded-[3px] border border-white/5 bg-black/20 p-3 col-span-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#84849b]">
                        {t("admin.participationDraws.drawDate")}
                      </p>
                      <p className="mt-1 text-sm font-black text-white">
                        {new Date(draw.drawDate).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-[3px] border border-white/5 bg-black/20 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#84849b]">
                        {t("admin.participationDraws.eligible")}
                      </p>
                      <p className="mt-1 text-sm font-black text-white">
                        {draw.eligibleCount}
                      </p>
                    </div>
                    <div className="rounded-[3px] border border-white/5 bg-black/20 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#84849b]">
                        {t("admin.participationDraws.winner")}
                      </p>
                      <p className="mt-1 text-sm font-black text-white truncate">
                        {draw.winners?.[0]?.winner?.name ||
                          t("admin.participationDraws.noWinner")}
                      </p>
                    </div>
                  </div>

                  {draw.prizes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {draw.prizes.slice(0, 4).map((prize) => (
                        <div
                          key={prize.id}
                          className="flex items-center gap-2 rounded-[3px] border border-white/5 bg-black/20 px-2 py-1.5"
                        >
                          {prize.iconUrl && (
                            <img
                              src={prize.iconUrl}
                              alt=""
                              className="h-6 w-6 object-contain"
                            />
                          )}
                          <span className="text-[10px] font-black text-white truncate max-w-[120px]">
                            #{prize.position} {prize.name}
                          </span>
                        </div>
                      ))}
                      {draw.prizes.length > 4 && (
                        <span className="text-[10px] font-bold text-[#84849b] self-center">
                          +{draw.prizes.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {(draw.winners || []).length > 0 && (
                    <div className="space-y-2">
                      {draw.winners!.map((w) => (
                        <div
                          key={w.prizeId}
                          className="flex items-center gap-3 rounded-[3px] border border-emerald-500/20 bg-emerald-500/10 p-3"
                        >
                          {w.winner?.avatar ? (
                            <img
                              src={w.winner.avatar}
                              alt=""
                              className="h-8 w-8 rounded-full border border-white/10"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-black">
                              ?
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                              #{w.position} · {w.prizeName}
                            </p>
                            <p className="text-sm font-black text-white truncate">
                              {w.winner?.name || t("participationDraws.anonymous")}
                            </p>
                          </div>
                          {w.prizeIconUrl && (
                            <img
                              src={w.prizeIconUrl}
                              alt=""
                              className="h-8 w-8 object-contain"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <AdminButton
                      variant="secondary"
                      icon={Users}
                      onClick={() => openParticipantsModal(draw)}
                    >
                      {t("admin.participationDraws.showEligible")}
                    </AdminButton>

                    {draw.status === "OPEN" && (
                      <>
                        <AdminButton
                          variant="primary"
                          icon={Dices}
                          onClick={() => setConfirmModal({ type: "draw", draw })}
                          disabled={draw.eligibleCount < 1 || actionLoading}
                        >
                          {t("admin.participationDraws.runDraw")}
                        </AdminButton>
                        <AdminButton
                          variant="secondary"
                          icon={Bot}
                          onClick={() => openAddBotsModal(draw)}
                        >
                          {t("admin.raffles.bots")}
                        </AdminButton>
                        <AdminButton
                          variant="ghost"
                          icon={Pencil}
                          onClick={() => openEditModal(draw)}
                        >
                          {t("common.edit")}
                        </AdminButton>
                        <AdminButton
                          variant="danger"
                          icon={Ban}
                          onClick={() => setConfirmModal({ type: "cancel", draw })}
                        >
                          {t("admin.participationDraws.cancel")}
                        </AdminButton>
                      </>
                    )}

                    {draw.status !== "FINISHED" && (
                      <AdminButton
                        variant="danger"
                        icon={Trash2}
                        onClick={() => setConfirmModal({ type: "delete", draw })}
                      >
                        {t("common.delete")}
                      </AdminButton>
                    )}
                  </div>
                </div>
              </AdminSection>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-3xl bg-linear-to-b from-[#1a172c] to-[#0f0d1e] border border-white/10 rounded-2xl p-8 relative flex flex-col max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]"
          >
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="absolute top-6 right-6 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-black uppercase tracking-tight text-white mb-8 flex items-center gap-3">
              <Trophy className="w-6 h-6 text-accent" />
              {editingDraw
                ? t("admin.participationDraws.editTitle")
                : t("admin.participationDraws.createTitle")}
            </h2>

            <div className="space-y-6 flex-1">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-[#84849b] tracking-wider ml-1">
                  {t("admin.participationDraws.fieldName")} *
                </label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-[#84849b] tracking-wider ml-1">
                  {t("admin.participationDraws.fieldDescription")}
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent h-28 resize-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-[#84849b] tracking-wider ml-1">
                    {t("admin.participationDraws.fieldMinRaffles")} *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formMinRaffles}
                    onChange={(e) => setFormMinRaffles(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-[#84849b] tracking-wider ml-1">
                    {t("admin.participationDraws.fieldDrawDate")} *
                  </label>
                  <input
                    type="datetime-local"
                    value={formDrawDate}
                    onChange={(e) => setFormDrawDate(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent transition-all [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase text-white tracking-wider ml-1">
                    {t("raffles.prizesTitle")} ({selectedPrizes.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenPicker}
                    className="text-xs font-black text-accent hover:text-white uppercase tracking-wider cursor-pointer bg-accent/10 hover:bg-accent/20 px-3 py-1.5 rounded-lg transition-colors border border-accent/20"
                  >
                    + {t("raffles.selectPrizes")}
                  </button>
                </div>

                {selectedPrizes.length === 0 ? (
                  <div className="p-10 text-center border-2 border-dashed border-white/10 rounded-xl bg-black/20">
                    <Package className="w-8 h-8 text-white/20 mx-auto mb-3" />
                    <p className="text-xs font-bold text-[#84849b] uppercase tracking-wider">
                      {t("raffles.noPrizesSelected")}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedPrizes.map((p) => (
                      <div
                        key={p.item.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/10 gap-4"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 bg-white/5 rounded-lg p-1.5 border border-white/5">
                            <img
                              src={p.item.imageUrl}
                              alt={p.item.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span className="text-xs font-black text-white uppercase truncate tracking-wide">
                            {p.item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 bg-black/40 px-3 py-2 rounded-lg border border-white/5">
                          <span className="text-[10px] font-black text-[#84849b] uppercase tracking-widest">
                            {t("admin.raffles.position")}
                          </span>
                          <input
                            type="number"
                            min="1"
                            value={p.position}
                            onChange={(e) => {
                              const pos = parseInt(e.target.value) || 1;
                              setSelectedPrizes((prev) =>
                                prev.map((x) =>
                                  x.item.id === p.item.id ? { ...x, position: pos } : x,
                                ),
                              );
                            }}
                            className="w-14 bg-white/5 border border-white/10 rounded-md px-2 py-1 text-sm font-black text-white text-center focus:outline-none focus:border-accent"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedPrizes((prev) =>
                                prev.filter((x) => x.item.id !== p.item.id),
                              )
                            }
                            className="text-red-400 hover:text-red-300 cursor-pointer ml-1 p-1 bg-red-400/10 hover:bg-red-400/20 rounded-md"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-end gap-4 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="px-6 py-3 rounded-xl hover:bg-white/5 text-xs font-black text-white uppercase tracking-widest cursor-pointer"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 rounded-xl bg-accent hover:bg-accent/90 text-xs font-black uppercase text-white tracking-widest flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingDraw ? (
                  t("common.save")
                ) : (
                  t("admin.participationDraws.create")
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {isPickerOpen && (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-[#0f0d1e] border border-white/5 rounded-[3px] p-6 relative flex flex-col max-h-[85vh] shadow-2xl">
            <button
              type="button"
              onClick={() => setIsPickerOpen(false)}
              className="absolute top-5 right-5 text-white/50 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black uppercase tracking-tight text-white mb-4">
              {t("raffles.selectPrizes")}
            </h3>

            <div className="flex gap-1 bg-white/5 border border-white/5 p-1 rounded-[3px] mb-4 shrink-0">
              <button
                type="button"
                onClick={() => setPickerTab("bot")}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-colors cursor-pointer ${
                  pickerTab === "bot"
                    ? "bg-white/5 text-white"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                {t("raffles.botSkinsTab")}
              </button>
              <button
                type="button"
                onClick={() => setPickerTab("youpin")}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-colors cursor-pointer ${
                  pickerTab === "youpin"
                    ? "bg-white/5 text-white"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                {t("raffles.youpinSkinsTab")}
              </button>
            </div>

            <div className="relative mb-4 shrink-0">
              <Search className="w-4 h-4 text-white/30 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("raffles.searchSkins")}
                className="w-full bg-[#141221] border border-white/5 rounded-[3px] pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-1 min-h-0">
              {loadingCatalog ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                </div>
              ) : filteredCatalog.length === 0 ? (
                <p className="text-xs text-[#84849b] uppercase font-bold text-center py-8">
                  {t("admin.raffles.noStockItems")}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {filteredCatalog.map((item) => {
                    const isSelected = selectedPrizes.some((p) => p.item.id === item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleSelectPrize(item)}
                        className={`flex items-center justify-between p-3 rounded-[3px] border transition-all text-left w-full cursor-pointer ${
                          isSelected
                            ? "bg-accent/5 border-accent text-white"
                            : "bg-[#0b0818] border-white/5 hover:border-white/10 text-white/80"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-8 h-8 object-contain shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="block text-[10px] font-black uppercase truncate tracking-wide text-white">
                              {item.weapon} | {item.name}
                            </span>
                            <span className="block text-[8px] font-mono text-[#84849b] uppercase mt-0.5">
                              ID: {item.id}
                              {item.float ? ` · Float: ${item.float.toFixed(4)}` : ""}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="block text-[10px] font-black">
                            ${item.price.toFixed(2)}
                          </span>
                          <span
                            className={`block text-[8px] font-bold uppercase mt-0.5 ${
                              isSelected ? "text-accent" : "text-emerald-400"
                            }`}
                          >
                            {isSelected
                              ? t("admin.participationDraws.selected")
                              : t("admin.participationDraws.clickToAdd")}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
              <AdminButton variant="primary" onClick={() => setIsPickerOpen(false)}>
                {t("common.accept")}
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {participantsDraw && (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0f0d1e] border border-white/5 rounded-[3px] shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4 shrink-0">
              <div className="min-w-0">
                <h3 className="text-sm font-black uppercase tracking-wider text-white truncate">
                  {t("admin.participationDraws.showEligible")}
                </h3>
                <p className="mt-1 text-[11px] font-bold text-[#84849b] truncate">
                  {participantsDraw.name} · {participantsDraw.eligibleCount}{" "}
                  {t("admin.participationDraws.eligible").toLowerCase()}
                </p>
              </div>
              <button
                type="button"
                onClick={closeParticipantsModal}
                className="rounded-full p-2 text-[#84849b] hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              {loadingParticipants || !participantsDetails ? (
                <div className="flex items-center justify-center gap-2 py-12 text-[#84849b]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {t("common.loading")}
                  </span>
                </div>
              ) : (participantsDetails.eligibleUsers || []).length === 0 ? (
                <p className="text-center text-xs font-bold uppercase tracking-wider text-[#84849b] py-10">
                  {t("admin.participationDraws.noEligible")}
                </p>
              ) : (
                <div className="space-y-2">
                  {(participantsDetails.eligibleUsers || []).map((user) => {
                    const won = (participantsDetails.winners || []).some(
                      (w) => w.winner?.id === user.id,
                    );
                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between gap-3 rounded-[3px] border border-white/5 bg-[#141221] px-3 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt=""
                              className="h-8 w-8 rounded-full border border-white/10"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[10px] font-black">
                              ?
                            </div>
                          )}
                          <span className="truncate text-xs font-black text-white">
                            {user.name || t("participationDraws.anonymous")}
                          </span>
                          {user.isBot && (
                            <span className="rounded-[3px] border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-blue-300">
                              BOT
                            </span>
                          )}
                          {won && (
                            <span className="rounded-[3px] border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-300">
                              {t("admin.participationDraws.winner")}
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 text-[11px] font-black text-accent">
                          {user.isBot
                            ? `${user.chances || 1} chances`
                            : t("admin.participationDraws.rafflesPlayed", {
                                count: user.raffleCount,
                              })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {botsDraw && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleAddBots}
            className="w-full max-w-sm bg-[#0f0d1e] border border-white/5 rounded-[3px] p-6 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeAddBotsModal}
              className="absolute top-5 right-5 text-white/50 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-black uppercase tracking-tight text-white mb-6 flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-400" />
              {t("admin.raffles.addBots")}
            </h2>

            <div className="flex bg-[#141221] p-1 rounded-[3px] border border-white/5 mb-6">
              <button
                type="button"
                onClick={() => setBotMode("new")}
                className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-2 rounded-[2px] transition-colors cursor-pointer ${
                  botMode === "new" ? "bg-accent text-white" : "text-[#84849b] hover:text-white"
                }`}
              >
                {t("admin.raffles.createNew")}
              </button>
              <button
                type="button"
                onClick={() => setBotMode("existing")}
                className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-2 rounded-[2px] transition-colors cursor-pointer ${
                  botMode === "existing"
                    ? "bg-accent text-white"
                    : "text-[#84849b] hover:text-white"
                }`}
              >
                {t("admin.raffles.existing")}
              </button>
            </div>

            <div className="space-y-4">
              {botMode === "new" ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-[#84849b] tracking-wider">
                      {t("admin.raffles.userName")}
                    </label>
                    <input
                      type="text"
                      value={formBotName}
                      onChange={(e) => setFormBotName(e.target.value)}
                      placeholder="Ej. SniperGod"
                      required
                      className="w-full bg-[#141221] border border-white/5 rounded-[3px] px-4 py-3 text-xs text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-[#84849b] tracking-wider">
                      {t("admin.raffles.userAvatarOptional")}
                    </label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setFormBotAvatarFile(file);
                            setFormBotAvatar(URL.createObjectURL(file));
                          }
                        }}
                        className="w-full bg-[#141221] border border-white/5 rounded-[3px] px-4 py-2 text-xs text-white focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-[3px] file:border-0 file:text-xs file:font-black file:uppercase file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all cursor-pointer"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#84849b] uppercase font-bold">
                          {t("admin.raffles.orUseUrl")}
                        </span>
                        <input
                          type="url"
                          value={formBotAvatarFile ? "" : formBotAvatar}
                          onChange={(e) => {
                            setFormBotAvatar(e.target.value);
                            setFormBotAvatarFile(null);
                          }}
                          placeholder="https://..."
                          className="flex-1 bg-[#141221] border border-white/5 rounded-[3px] px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>
                    {formBotAvatar && (
                      <div className="mt-2 flex items-center gap-3 bg-white/5 p-2 rounded-[3px] border border-white/5">
                        <img
                          src={formBotAvatar}
                          alt="Preview"
                          className="w-8 h-8 rounded-md object-cover bg-black"
                        />
                        <span className="text-xs text-[#84849b]">{t("admin.raffles.preview")}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[#84849b] tracking-wider">
                    {t("admin.raffles.selectBot")}
                  </label>
                  {isLoadingBots ? (
                    <div className="flex items-center gap-2 text-xs text-[#84849b] p-3">
                      <Loader2 className="w-3 h-3 animate-spin" /> {t("admin.raffles.loadingBots")}
                    </div>
                  ) : existingBots.length === 0 ? (
                    <div className="text-xs text-[#84849b] p-3 border border-white/5 rounded-[3px] bg-[#141221]">
                      {t("admin.raffles.noBotsCreated")}
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={formBotId}
                        onChange={(e) => setFormBotId(e.target.value)}
                        required
                        className="w-full bg-[#141221] border border-white/5 rounded-[3px] px-4 py-3 text-xs text-white focus:outline-none focus:border-accent appearance-none cursor-pointer"
                      >
                        {existingBots.map((bot) => (
                          <option key={bot.id} value={bot.id}>
                            {bot.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <div className="w-2 h-2 border-b border-r border-[#84849b] transform rotate-45 mb-1" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="text-[10px] font-bold uppercase text-[#84849b] tracking-wider">
                  {t("admin.raffles.chancesToBuy")}
                </label>
                <input
                  type="number"
                  min="1"
                  value={botChances}
                  onChange={(e) => setBotChances(e.target.value)}
                  required
                  className="w-full bg-[#141221] border border-white/5 rounded-[3px] px-4 py-3 text-xs text-white focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeAddBotsModal}
                className="px-4 py-2 text-xs font-bold uppercase text-white/70 hover:text-white transition-colors cursor-pointer"
                disabled={isSavingBots}
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSavingBots}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-[3px] text-xs font-black uppercase tracking-wider text-white transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSavingBots && <Loader2 className="w-3 h-3 animate-spin" />}
                {t("admin.raffles.add")}
              </button>
            </div>
          </form>
        </div>
      )}

      <AlertConfirmModal
        isOpen={!!confirmModal}
        type="confirm"
        title={
          confirmModal?.type === "draw"
            ? t("admin.participationDraws.confirmDrawTitle")
            : confirmModal?.type === "cancel"
              ? t("admin.participationDraws.confirmCancelTitle")
              : t("admin.participationDraws.confirmDeleteTitle")
        }
        message={
          confirmModal?.type === "draw"
            ? t("admin.participationDraws.confirmDrawMessage", {
                count: confirmModal.draw.eligibleCount,
              })
            : confirmModal?.type === "cancel"
              ? t("admin.participationDraws.confirmCancelMessage")
              : t("admin.participationDraws.confirmDeleteMessage")
        }
        confirmLabel={
          confirmModal?.type === "draw"
            ? t("admin.participationDraws.runDraw")
            : confirmModal?.type === "cancel"
              ? t("admin.participationDraws.cancel")
              : t("common.delete")
        }
        onCancel={() => !actionLoading && setConfirmModal(null)}
        onConfirm={runConfirmedAction}
      />
    </AdminPage>
  );
}

export default function ParticipationDrawsAdminPage() {
  return (
    <Suspense
      fallback={
        <AdminPage>
          <AdminLoadingState />
        </AdminPage>
      }
    >
      <ParticipationDrawsAdminContent />
    </Suspense>
  );
}
