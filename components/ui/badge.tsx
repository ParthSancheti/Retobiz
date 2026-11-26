import { BadgeCheck, Crown, ReceiptText, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "indigo" | "leaf" | "saffron" | "flame" | "neutral" | "danger";

const TONE: Record<Tone, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  leaf: "bg-leaf-50 text-leaf-700",
  saffron: "bg-saffron-100 text-saffron-700",
  flame: "bg-flame-50 text-flame-700",
  neutral: "bg-surface text-ink-700 border border-hairline",
  danger: "bg-danger-50 text-danger-600",
};

export function Badge({ tone = "neutral", icon, children, className }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-sm px-2 text-[11px] font-semibold leading-none tracking-[0.02em] whitespace-nowrap",
        TONE[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function VerifiedBadge({ compact, className }: { compact?: boolean; className?: string }) {
  if (compact)
    return (
      <BadgeCheck aria-label="Verified" className={cn("size-4 shrink-0 fill-indigo-500 text-white", className)} strokeWidth={2} />
    );
  return (
    <Badge tone="indigo" icon={<BadgeCheck className="size-3.5" strokeWidth={2} />} className={className}>
      Verified
    </Badge>
  );
}

export function GstBadge() {
  return (
    <Badge tone="leaf" icon={<ReceiptText className="size-3.5" strokeWidth={2} />}>
      GST ✓
    </Badge>
  );
}

/** Generic "G" monogram — no Google logo assets (DESIGN §7). */
export function GoogleBadge() {
  return (
    <Badge tone="neutral" icon={<span className="font-display text-[11px] font-extrabold text-indigo-600">G</span>}>
      Google Verified
    </Badge>
  );
}

export function ProBadge({ className }: { className?: string }) {
  return (
    <Badge tone="saffron" icon={<Crown className="size-3.5" strokeWidth={2} />} className={className}>
      PRO
    </Badge>
  );
}

export function NewBadge() {
  return (
    <Badge tone="flame" icon={<Sparkles className="size-3.5" strokeWidth={2} />}>
      Naya
    </Badge>
  );
}

/** Sharp top-left discount badge (DESIGN §4.5). */
export function DiscountChip({ pct, className }: { pct: number; className?: string }) {
  return (
    <span
      className={cn(
        "tabular inline-flex h-6 items-center rounded-sm bg-flame-500 px-1.5 font-sans text-[12px] leading-none font-extrabold text-white",
        className,
      )}
    >
      {pct}% OFF
    </span>
  );
}
