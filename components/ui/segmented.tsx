"use client";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";

/** Sunk track + white pill morphing via layoutId (DESIGN §5.3 / §7). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  id,
  className,
  size = "md",
  tone = "light",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  /** Unique per group so layoutId pills don't cross-animate. */
  id: string;
  className?: string;
  size?: "sm" | "md";
  tone?: "light" | "dark";
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center rounded-full p-1",
        tone === "light" ? "bg-sunk" : "bg-white/10",
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative rounded-full font-semibold whitespace-nowrap transition-colors",
              size === "sm" ? "h-7 px-3 text-[12px]" : "h-9 px-4 text-[13px]",
              tone === "light"
                ? active ? "text-ink-900" : "text-ink-500 hover:text-ink-700"
                : active ? "text-ink-900" : "text-white/75 hover:text-white",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={spring.pill}
                className={cn("absolute inset-0 rounded-full", tone === "light" ? "bg-surface shadow-1" : "bg-white")}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
