import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_TONE } from "@/lib/format";

/** Copper ingot brand mark — hexagonal nugget with the "ف" glyph. */
export function BrandMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("relative inline-flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 48 48" width={size} height={size} className="absolute inset-0" aria-hidden>
        <defs>
          <linearGradient id="fz-cu" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="oklch(0.86 0.12 75)" />
            <stop offset="0.45" stopColor="oklch(0.74 0.15 55)" />
            <stop offset="1" stopColor="oklch(0.56 0.15 38)" />
          </linearGradient>
        </defs>
        <path d="M24 2 43 13v22L24 46 5 35V13Z" fill="url(#fz-cu)" />
        <path d="M24 2 43 13 24 24 5 13Z" fill="white" opacity="0.18" />
        <path d="M24 2 43 13v22L24 46 5 35V13Z" fill="none" stroke="white" strokeOpacity="0.25" />
      </svg>
      <span
        className="relative font-black text-[oklch(0.2_0.04_40)]"
        style={{ fontSize: size * 0.42, lineHeight: 1, marginTop: size * 0.04 }}
      >
        ف
      </span>
    </span>
  );
}

export function Wordmark({ sub, className }: { sub?: ReactNode; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandMark size={38} />
      <span className="leading-tight">
        <span className="block font-black text-lg tracking-tight">فلزیافت</span>
        {sub && <span className="block text-[11px] text-muted-foreground font-medium">{sub}</span>}
      </span>
    </span>
  );
}

export function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  actions,
}: {
  icon?: any;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="animate-rise flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl copper-fill glow-ring">
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div>
          {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
          <h1 className="text-2xl md:text-[2rem] font-black tracking-tight leading-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-6">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

type Tone = "primary" | "success" | "warning" | "accent" | "neutral";

const TONE_STYLES: Record<Tone, { icon: string; bar: string }> = {
  primary: { icon: "bg-primary/15 text-primary ring-1 ring-primary/25", bar: "from-primary/70" },
  success: { icon: "bg-success/15 text-success ring-1 ring-success/25", bar: "from-success/70" },
  warning: { icon: "bg-warning/15 text-warning ring-1 ring-warning/25", bar: "from-warning/70" },
  accent: { icon: "bg-accent/15 text-accent ring-1 ring-accent/25", bar: "from-accent/70" },
  neutral: { icon: "bg-foreground/[0.07] text-foreground/80 ring-1 ring-border", bar: "from-foreground/30" },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "neutral",
  className,
}: {
  icon: any;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const t = TONE_STYLES[tone];
  return (
    <div className={cn("surface group relative overflow-hidden rounded-2xl p-4 md:p-5 transition-transform hover:-translate-y-0.5", className)}>
      <div className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-l to-transparent", t.bar)} />
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs text-muted-foreground font-semibold leading-5">{label}</span>
        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", t.icon)}>
          <Icon className="w-[18px] h-[18px]" />
        </div>
      </div>
      <div className="mt-3 text-xl md:text-2xl font-black tracking-tight truncate">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap",
        STATUS_TONE[status] || "bg-secondary",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="py-20 text-center text-muted-foreground flex flex-col items-center justify-center gap-4">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-2 border-border" />
        <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <BrandMark size={22} className="absolute inset-0 m-auto" />
      </div>
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: any; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="surface rounded-2xl px-6 py-14 text-center flex flex-col items-center">
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
        <div className="relative h-16 w-16 rounded-2xl border border-border bg-background/60 flex items-center justify-center">
          <Icon className="w-7 h-7 text-primary" />
        </div>
      </div>
      <div className="text-base font-bold">{title}</div>
      {description && <div className="text-sm text-muted-foreground mt-1.5 max-w-sm">{description}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Pill-style filter tab used by list pages. */
export function SegTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all",
        active
          ? "copper-fill shadow-[0_6px_18px_-8px_var(--color-primary)]"
          : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
