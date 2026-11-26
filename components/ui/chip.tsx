"use client";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { spring, tap } from "@/lib/motion";

/** 32px filter chip; selected = ink fill with a check sliding in (DESIGN §7). */
export function FilterChip({
  selected,
  onClick,
  children,
  icon,
  className,
}: {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      whileTap={tap}
      transition={spring.snappy}
      layout="position"
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold whitespace-nowrap transition-colors",
        selected ? "border-ink-900 bg-ink-900 text-white" : "border-hairline bg-surface text-ink-700 hover:border-hairline-strong",
        className,
      )}
    >
      <AnimatePresence initial={false}>
        {selected && (
          <motion.span
            key="check"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 14, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={spring.snappy}
            className="inline-flex overflow-hidden"
          >
            <Check className="size-3.5" strokeWidth={2.5} />
          </motion.span>
        )}
      </AnimatePresence>
      {!selected && icon}
      {children}
    </motion.button>
  );
}
