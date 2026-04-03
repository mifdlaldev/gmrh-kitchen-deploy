import type { LucideIcon } from "lucide-react";

type AccentTone = "orange" | "navy" | "emerald" | "amber";

const accentStyles: Record<
  AccentTone,
  {
    shell: string;
    icon: string;
    badge: string;
  }
> = {
  orange: {
    shell:
      "border-orange-100/80 bg-gradient-to-br from-white via-white to-[#fff3e4]",
    icon: "bg-gradient-to-br from-orange-500 to-[#ff9f5b] text-white shadow-[0_20px_40px_-22px_rgba(249,115,22,0.6)]",
    badge: "bg-orange-50 text-orange-700",
  },
  navy: {
    shell:
      "border-slate-200/80 bg-gradient-to-br from-white via-white to-[#eef3ff]",
    icon: "bg-gradient-to-br from-slate-900 to-[#273766] text-white shadow-[0_20px_40px_-22px_rgba(15,23,42,0.55)]",
    badge: "bg-slate-100 text-slate-700",
  },
  emerald: {
    shell:
      "border-emerald-100/80 bg-gradient-to-br from-white via-white to-[#eefcf4]",
    icon: "bg-gradient-to-br from-emerald-500 to-[#19b97c] text-white shadow-[0_20px_40px_-22px_rgba(16,185,129,0.55)]",
    badge: "bg-emerald-50 text-emerald-700",
  },
  amber: {
    shell:
      "border-amber-100/80 bg-gradient-to-br from-white via-white to-[#fff7e8]",
    icon: "bg-gradient-to-br from-amber-500 to-[#ffb72a] text-white shadow-[0_20px_40px_-22px_rgba(245,158,11,0.55)]",
    badge: "bg-amber-50 text-amber-700",
  },
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
  footnote,
  accent = "orange",
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  description: string;
  footnote?: string;
  accent?: AccentTone;
}) {
  const styles = accentStyles[accent];

  return (
    <div
      className={`surface-panel relative overflow-hidden rounded-[2rem] border p-6 ${styles.shell}`}
    >
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#f6d7b7] to-transparent" />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div
            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] ${styles.badge}`}
          >
            {title}
          </div>
        </div>

        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] ${styles.icon}`}
        >
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>
      </div>

      <h2 className="mt-5 text-4xl font-bold tracking-[-0.03em] text-slate-900">
        {value}
      </h2>

      <p className="mt-3 text-sm leading-7 text-slate-600">
        {description}
      </p>

      {footnote && (
        <div className="mt-5 border-t border-slate-200/60 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {footnote}
          </p>
        </div>
      )}
    </div>
  );
}
