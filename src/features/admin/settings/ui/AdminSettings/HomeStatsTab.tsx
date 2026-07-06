import { Dispatch, SetStateAction } from "react";
import { Save, Loader2, LayoutDashboard } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";
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
    <div className="bg-[#110f1e]/40 border border-white/5 p-4 sm:p-6 rounded-[3px]">
      <SectionHeader
        title={t("admin.settings.homeStats", { defaultValue: "Estadísticas del Home" })}
        desc={t("admin.settings.homeStatsDesc", { defaultValue: "Configura los textos de las estadísticas principales mostradas en el Home." })}
      />

      <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-5 max-w-xl">
        <div className="space-y-1.5">
          <FieldLabel>Usuarios Activos (Active Users)</FieldLabel>
          <StyledInput
            value={settings.homeStatsActiveUsers}
            onChange={(e) =>
              setSettings({ ...settings, homeStatsActiveUsers: e.target.value })
            }
            placeholder="Ej: 150K+"
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Skins Disponibles (Available Skins)</FieldLabel>
          <StyledInput
            value={settings.homeStatsAvailableSkins}
            onChange={(e) =>
              setSettings({ ...settings, homeStatsAvailableSkins: e.target.value })
            }
            placeholder="Ej: 45K+"
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Transacciones (Transactions)</FieldLabel>
          <StyledInput
            value={settings.homeStatsTransactions}
            onChange={(e) =>
              setSettings({ ...settings, homeStatsTransactions: e.target.value })
            }
            placeholder="Ej: 2.5M+"
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Soporte (Online Support)</FieldLabel>
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
          label={t("admin.settings.save", { defaultValue: "Guardar" })} 
        />
      </form>
    </div>
  );
}
