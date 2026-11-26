"use client";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useStore } from "@/store";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/misc";

/** Active merchant's shop + category (raw slices, memo-derived). */
export function useActiveShop() {
  const shopId = useStore((s) => s.activeMerchantShopId);
  const shop = useStore((s) => s.shops[s.activeMerchantShopId]);
  const categories = useStore((s) => s.categories);
  const category = useMemo(() => categories.find((c) => c.id === shop?.categoryId), [categories, shop?.categoryId]);
  return { shopId, shop, category };
}

export function PageHead({ title, sub, action, eyebrow }: { title: ReactNode; sub?: ReactNode; action?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-[11px] font-bold tracking-[0.08em] text-ink-500 uppercase">{eyebrow}</div>}
        <h1 className="text-[24px] leading-[30px] font-bold tracking-[-0.015em] lg:text-[28px] lg:leading-9">{title}</h1>
        {sub && <p className="mt-1 text-[14px] text-ink-500">{sub}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-[22px] border border-black/[0.05] bg-surface shadow-soft", className)}>{children}</div>;
}

export function PageSkeleton() {
  return (
    <div className="grid gap-4" aria-busy>
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-24" />
      <div className="grid grid-cols-1 gap-3 [&>*]:min-w-0 lg:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}

export function Field({ label, hint, error, children, className }: { label: string; hint?: ReactNode; error?: string | false; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[13px] font-semibold text-ink-900">{label}</span>
      {children}
      {error ? <span className="text-[12px] font-medium text-danger-600">{error}</span> : hint ? <span className="text-[12px] text-ink-500">{hint}</span> : null}
    </label>
  );
}

export const inputCls =
  "h-11 w-full rounded-[14px] border border-hairline bg-surface px-3.5 text-[15px] text-ink-900 outline-none placeholder:text-ink-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Tiny stepper used by QR orders + agency tracker. */
export function Stepper({ steps, current, className }: { steps: string[]; current: number; className?: string }) {
  return (
    <ol className={cn("flex items-center gap-1", className)}>
      {steps.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className={cn("h-1.5 rounded-full", done ? "bg-leaf-500" : "bg-sunk")} />
            <span className={cn("truncate text-[11px] font-semibold", i === current ? "text-ink-900" : done ? "text-leaf-700" : "text-ink-300")}>{s}</span>
          </li>
        );
      })}
    </ol>
  );
}
