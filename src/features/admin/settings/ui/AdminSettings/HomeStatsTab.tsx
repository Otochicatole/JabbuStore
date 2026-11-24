import { Dispatch, SetStateAction } from "react";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { AdminSection } from "@/features/admin/ui/AdminShell";
import { SectionHeader, StyledInput, FieldLabel, SaveButton } from "./FormControls";
import { SettingsState } from "./index";

interface HomeStatsTabProps {
  settings: SettingsState;
  setSettings: Dispatch<SetStateAction<SettingsState>>;
  onSave: () => void;
  isSaving: boolean;
  isSaved: boolean;
}

export function HomeStatsTab({
  settings,
  setSettings,
  onSave,
  isSaving,
  isSaved,
}: HomeStatsTabProps) {
  const { t } = useI18n();

  return (
    <AdminSection>
      <SectionHeader
        title={t("admin.settings.homeStats")}
        desc={t("admin.settings.homeStatsDesc")}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
        className="max-w-xl space-y-4"
      >
        <div className="space-y-1.5">
          <FieldLabel>{t("admin.settings.homeStats.activeUsers")}</FieldLabel>
          <StyledInput
            value={settings.homeStatsActiveUsers}
            onChange={(e) =>
              setSettings({ ...settings, homeStatsActiveUsers: e.target.value })
            }
            placeholder="Ej: 150K+"
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>{t("admin.settings.homeStats.availableSkins")}</FieldLabel>
          <StyledInput
            value={settings.homeStatsAvailableSkins}
            onChange={(e) =>
              setSettings({ ...settings, homeStatsAvailableSkins: e.target.value })
            }
            placeholder="Ej: 45K+"
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>{t("admin.settings.homeStats.transactions")}</FieldLabel>
          <StyledInput
            value={settings.homeStatsTransactions}
            onChange={(e) =>
              setSettings({ ...settings, homeStatsTransactions: e.target.value })
            }
            placeholder="Ej: 2.5M+"
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>{t("admin.settings.homeStats.onlineSupport")}</FieldLabel>
          <StyledInput
            value={settings.homeStatsOnlineSupport}
            onChange={(e) =>
              setSettings({ ...settings, homeStatsOnlineSupport: e.target.value })
            }
            placeholder="Ej: 24/7"
          />
        </div>

        <SaveButton
          saving={isSaving}
          saved={isSaved}
          label={t("common.save")}
        />
      </form>
    </AdminSection>
  );
}
