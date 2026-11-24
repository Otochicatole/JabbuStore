import { Check, Loader2 } from "lucide-react";
import { useI18n } from "@/shared/i18n/I18nProvider";

export function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-5 border-b border-white/[0.06] pb-4">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <p className="mt-1 text-xs sm:text-[13px] leading-relaxed text-[#9e98b6]">{desc}</p>
    </div>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-[#c2bdd6]">
      {children}
    </label>
  );
}

export function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-10 w-full rounded-md border border-white/10 bg-[#0d0a18] px-3.5 text-sm text-white placeholder-[#746e8d] transition-colors focus:border-accent focus:outline-none ${props.className || ""}`}
    />
  );
}

export function StyledTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-24 w-full resize-y rounded-md border border-white/10 bg-[#0d0a18] px-3.5 py-2.5 text-sm text-white placeholder-[#746e8d] transition-colors focus:border-accent focus:outline-none ${props.className || ""}`}
    />
  );
}

export function SaveButton({
  saving,
  saved,
  label,
}: {
  saving: boolean;
  saved: boolean;
  label: string;
}) {
  const { t } = useI18n();
  return (
    <button
      type="submit"
      disabled={saving}
      className="mt-2 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-accent px-4 text-xs sm:text-[13px] font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-55 cursor-pointer"
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : saved ? (
        <Check className="h-4 w-4" />
      ) : null}
      {saving ? t("common.saving") : saved ? t("admin.settings.saved") : label}
    </button>
  );
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex w-fit cursor-pointer items-center gap-3 select-none">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="h-6 w-11 rounded-full border border-white/10 bg-[#1c1833] transition-colors peer-checked:border-accent/50 peer-checked:bg-accent" />
        <div className="absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
      </div>
      <span className="text-sm font-medium text-white/90">{label}</span>
    </label>
  );
}
