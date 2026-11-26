"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Suspense } from "react";
import { BadgeCheck, BadgePercent, Clapperboard, Flame, IndianRupee, Sparkles, Store } from "lucide-react";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";

/**
 * Quick-filter pill bar rendered ONLY inside `/` and `/offers` page bodies (non-sticky).
 */
const QUICK = [
  { key: "all", label: "Sab Deals", href: "/offers", icon: BadgePercent, match: (p: string, q: URLSearchParams) => p === "/offers" && !q.toString() },
  { key: "499", label: "Under ₹499", href: "/offers?max=499", icon: IndianRupee, match: (p: string, q: URLSearchParams) => p === "/offers" && q.get("max") === "499" },
  { key: "verified", label: "Verified Only", href: "/search?tab=shops&v=1", icon: BadgeCheck, match: (p: string, q: URLSearchParams) => p === "/search" && q.get("v") === "1" },
  { key: "flash", label: "Flash Sales", href: "/offers?sort=ending", icon: Flame, match: (p: string, q: URLSearchParams) => p === "/offers" && q.get("sort") === "ending" },
  { key: "30", label: "30%+ off", href: "/offers?disc=30", icon: Sparkles, match: (p: string, q: URLSearchParams) => p === "/offers" && q.get("disc") === "30" },
  { key: "reels", label: "Reels", href: "/#reels", icon: Clapperboard, match: () => false },
  { key: "new", label: "Naye Shops", href: "/search?tab=shops&sort=newest", icon: Store, match: (p: string, q: URLSearchParams) => p === "/search" && q.get("sort") === "newest" },
];

export function CategoryStrip({ className }: { className?: string }) {
  return (
    <Suspense fallback={<div className={cn("h-10", className)} />}>
      <Strip className={className} />
    </Suspense>
  );
}

function Strip({ className }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const params = useSearchParams();
  return (
    <nav aria-label="Quick filters" className={cn("relative", className)}>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 lg:mx-0 lg:px-0">
        {QUICK.map((q) => {
          const active = q.match(pathname, params);
          return (
            <Link
              key={q.key}
              href={q.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-bold whitespace-nowrap transition-all duration-200 active:scale-[0.97]",
                active
                  ? "border-ink-900 text-white"
                  : "border-black/[0.08] bg-white/90 text-ink-900 shadow-[0_2px_8px_-4px_rgba(18,20,26,0.12)] hover:border-black/[0.15] hover:bg-white",
              )}
            >
              {active && <motion.span layoutId="quick-pill" transition={spring.pill} className="absolute inset-0 rounded-full bg-ink-900" />}
              <q.icon
                className={cn(
                  "relative size-3.5",
                  active ? "text-saffron-400" : q.key === "flash" ? "text-flame-500" : q.key === "verified" ? "text-indigo-600" : "text-saffron-700",
                )}
                strokeWidth={2.25}
              />
              <span className="relative">{q.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
