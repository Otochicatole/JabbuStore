import { Check, Loader2 } from "lucide-react";

import { useI18n } from "@/shared/i18n/I18nProvider";

export function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-black uppercase tracking-wider text-white">
        {title}
      </h2>
      <p className="text-xs text-[#84849b] mt-1 leading-relaxed">{desc}</p>
    </div>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-black uppercase tracking-widest text-[#84849b] font-mono">
      {children}
    </label>
  );
}

export function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-4 py-3 bg-white/[0.03] border border-white/8 rounded-[3px] text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 focus:bg-white/[0.05] transition-all"
    />
  );
}

export function StyledTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full min-h-28 px-4 py-3 bg-white/[0.03] border border-white/8 rounded-[3px] text-sm text-white placeholder-white/20 focus:outline-none focus:border-accent/50 focus:bg-white/[0.05] transition-all resize-y"
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
      className="mt-2 px-6 py-3 bg-accent hover:bg-accent/90 rounded-[3px] text-xs font-black uppercase tracking-wider text-white transition-all flex items-center gap-2 shadow-[0_4px_20px_rgba(217,70,239,0.25)] hover:shadow-[0_4px_30px_rgba(217,70,239,0.4)] disabled:opacity-60 cursor-pointer"
    >
      {saving ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : saved ? (
        <Check className="w-4 h-4" />
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
    <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-white/5 rounded-full border border-white/10 peer peer-checked:bg-accent peer-checked:border-accent/50 transition-all" />
        <div className="absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow transition-all peer-checked:translate-x-5" />
      </div>
      <span className="text-sm text-white/80 font-semibold">{label}</span>
    </label>
  );
}
