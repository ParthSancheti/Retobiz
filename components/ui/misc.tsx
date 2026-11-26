"use client";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useUiStore } from "@/store/ui";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-md", className)} />;
}

/** Number that animates only when its value changes (DESIGN §5.3 "Counters"). */
export function AnimatedNumber({ value, format = (n) => String(n), className }: { value: number; format?: (n: number) => string; className?: string }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => format(Math.round(v)));
  const first = useRef(true);
  useEffect(() => {
    if (first.current || reduce) {
      first.current = false;
      mv.set(value);
      return;
    }
    const c = animate(mv, value, { duration: 0.4, ease: [0.22, 1, 0.36, 1] });
    return () => c.stop();
  }, [value, mv, reduce]);
  return <motion.span className={cn("tabular", className)}>{text}</motion.span>;
}

/**
 * One-shot leaf flash when `watch` changes because another tab/role acted (DESIGN §5.3).
 * Never loops.
 */
export function LiveFlash({ watch, children, className }: { watch: unknown; children: ReactNode; className?: string }) {
  const remoteAt = useUiStore((s) => s.lastRemoteSyncAt);
  const prev = useRef(watch);
  const [flashKey, setFlashKey] = useState(0);
  useEffect(() => {
    if (prev.current === watch) return;
    prev.current = watch;
    if (Date.now() - remoteAt > 1500) return;
    const raf = requestAnimationFrame(() => setFlashKey((k) => k + 1));
    return () => cancelAnimationFrame(raf);
  }, [watch, remoteAt]);
  return (
    <span className={cn("relative inline-flex rounded-sm", className)}>
      {flashKey > 0 && (
        <motion.span
          key={flashKey}
          aria-hidden
          className="absolute -inset-1 rounded-sm bg-leaf-50"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}
      <span className="relative">{children}</span>
    </span>
  );
}

export function StatTile({
  label,
  value,
  format,
  delta,
  hint,
  icon,
  spark,
  className,
  tone = "indigo",
}: {
  tone?: "indigo" | "leaf" | "saffron" | "flame";
  label: string;
  value: number;
  format?: (n: number) => string;
  delta?: number;
  hint?: string;
  icon?: ReactNode;
  spark?: number[];
  className?: string;
}) {
  return (
    <div className={cn("rounded-[22px] border border-black/[0.05] bg-gradient-to-b from-white to-[#fbfbfd] p-5 shadow-soft", className)}>
      <div className="flex items-center gap-2.5 text-[12px] font-semibold tracking-[0.02em] text-ink-500">
        {icon && (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-[12px] [&>svg]:size-[18px]",
              tone === "leaf" ? "bg-leaf-50 text-leaf-700" : tone === "saffron" ? "bg-saffron-50 text-saffron-700" : tone === "flame" ? "bg-flame-50 text-flame-700" : "bg-indigo-50 text-indigo-600",
            )}
          >
            {icon}
          </span>
        )}
        {label}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <LiveFlash watch={value}>
            <AnimatedNumber value={value} format={format} className="font-display text-[28px] leading-8 font-bold text-ink-900" />
          </LiveFlash>
          <div className="mt-1 flex items-center gap-2">
            {delta != null && delta !== 0 && (
              <span
                className={cn(
                  "tabular inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-[11px] font-bold",
                  delta > 0 ? "bg-leaf-50 text-leaf-700" : "bg-danger-50 text-danger-600",
                )}
              >
                {delta > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {Math.abs(delta)}%
              </span>
            )}
            {hint && <span className="text-[12px] text-ink-500">{hint}</span>}
          </div>
        </div>
        {spark && spark.length > 1 && <Sparkline points={spark} />}
      </div>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const w = 72;
  const h = 28;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${((i / (points.length - 1)) * w).toFixed(1)},${(h - ((p - min) / span) * (h - 4) - 2).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="shrink-0">
      <path d={d} fill="none" stroke="var(--color-indigo-500)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SectionHeader({ title, action, eyebrow, className }: { title: ReactNode; action?: ReactNode; eyebrow?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-[11px] font-semibold tracking-[0.04em] text-ink-500 uppercase">{eyebrow}</div>}
        <h2 className="text-[20px] leading-[26px] font-bold tracking-[-0.01em] lg:text-[22px] lg:leading-7">{title}</h2>
      </div>
      {action}
    </div>
  );
}
