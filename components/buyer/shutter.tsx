"use client";
import { motion, useReducedMotion } from "motion/react";
import { BadgeCheck } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Category, Shop } from "@/lib/types";
import { TAGLINE } from "@/components/brand/brand-lockup";
import { WASH_BG } from "@/components/media/glyphs";

/**
 * Digital Shop Shutter — realistic brushed slate-indigo corrugated metal shutter.
 *
 * Physics Choreography (0.85s total):
 *  - 0ms–120ms: subtle mechanical unlatch drop (y: 0 -> 8px) with a faint shadow shift
 *  - 120ms–850ms: smooth accelerating roll-up (y: 8px -> -105%, ease [0.22, 1, 0.36, 1])
 *    with a rolling bottom cast-shadow gliding upward over the already-painted storefront.
 */
export function Shutter({
  shop,
  category,
  open,
  runKey = 0,
  onDone,
}: {
  shop: Shop;
  category?: Category;
  open: boolean;
  runKey?: number;
  onDone: () => void;
}) {
  const reduce = useReducedMotion();
  const completedRef = useRef(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!open) return;
    completedRef.current = false;
    // Safety net in case tab is backgrounded during animation
    const fallback = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onDoneRef.current();
      }
    }, reduce ? 300 : 1050);
    return () => clearTimeout(fallback);
  }, [open, runKey, reduce]);

  if (!open) return null;

  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onDoneRef.current();
  };

  if (reduce) {
    return (
      <motion.div
        key={`shutter-reduced-${runKey}`}
        aria-hidden
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onAnimationComplete={finish}
        className="fixed inset-0 z-50 bg-[#1E2436]"
      />
    );
  }

  return (
    <div key={`shutter-${runKey}`} aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Stationary left & right metallic guide-rails */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 1, 0] }}
        transition={{ duration: 0.85, times: [0, 0.78, 1], ease: "easeOut" }}
        className="pointer-events-none absolute inset-y-0 left-0 z-20 w-3 border-r border-white/10 bg-[linear-gradient(90deg,#0E121D_0%,#323A52_45%,#171C2B_100%)] shadow-[2px_0_8px_rgba(0,0,0,0.45)] sm:w-4"
      />
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 1, 0] }}
        transition={{ duration: 0.85, times: [0, 0.78, 1], ease: "easeOut" }}
        className="pointer-events-none absolute inset-y-0 right-0 z-20 w-3 border-l border-white/10 bg-[linear-gradient(90deg,#171C2B_0%,#323A52_55%,#0E121D_100%)] shadow-[-2px_0_8px_rgba(0,0,0,0.45)] sm:w-4"
      />

      {/* Outer roll-up container: 120ms–850ms glides from y: 0% -> -105% */}
      <motion.div
        initial={{ y: "0%" }}
        animate={{ y: "-105%" }}
        transition={{ delay: 0.12, duration: 0.73, ease: [0.22, 1, 0.36, 1] }}
        onAnimationComplete={finish}
        className="relative h-full w-full will-change-transform"
      >
        {/* Inner curtain: 0ms–120ms mechanical unlatch drop (y: 0 -> 8px) */}
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: 8 }}
          transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-full w-full will-change-transform"
        >
          {/* Corrugated metallic slate-indigo slats with 3D bevel highlights */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: "#1B2133",
              backgroundImage:
                "repeating-linear-gradient(180deg, rgba(255,255,255,0.13) 0px, rgba(255,255,255,0.13) 1.5px, #2E364D 1.5px, #242B3E 5px, #1B2133 5px, #161B2B 11px, #0E121E 11px, #0E121E 12.5px, #3C4660 12.5px, #3C4660 14px), linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.1) 22%, rgba(255,255,255,0.01) 52%, rgba(255,255,255,0.08) 78%, rgba(255,255,255,0.02) 100%)",
            }}
          />

          {/* Top drum specular sheen & housing shadow */}
          <div className="absolute inset-x-0 top-0 h-[22%] bg-[linear-gradient(180deg,rgba(10,12,20,0.42)_0%,rgba(255,255,255,0.12)_12%,rgba(255,255,255,0)_100%)]" />

          {/* Painted / illuminated shop signboard across upper third */}
          <div className="absolute inset-x-6 top-[14%] sm:inset-x-12 md:inset-x-[16%] lg:inset-x-[22%]">
            <div
              className={`relative overflow-hidden rounded-[14px] border-[3px] border-[#404A66] px-5 py-5 text-center shadow-[0_18px_40px_rgba(8,10,18,0.55),inset_0_2px_8px_rgba(0,0,0,0.2)] lg:py-7 ${WASH_BG[category?.wash ?? "cream"]}`}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0)_100%)]"
              />
              {/* Corner mounting rivets */}
              <span className="absolute top-2.5 left-2.5 size-1.5 rounded-full bg-slate-600/45" />
              <span className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-slate-600/45" />
              <span className="absolute bottom-2.5 left-2.5 size-1.5 rounded-full bg-slate-600/45" />
              <span className="absolute right-2.5 bottom-2.5 size-1.5 rounded-full bg-slate-600/45" />

              <div className="relative text-[11px] font-bold tracking-[0.14em] text-ink-900/65 uppercase">
                {category?.name ?? "Dukaan"}
              </div>
              <div className="relative mt-1 font-display text-[26px] leading-[30px] font-extrabold tracking-[-0.02em] text-ink-900 lg:text-[42px] lg:leading-[46px]">
                {shop.name}
              </div>
              {shop.isVerified && (
                <div className="relative mt-2.5 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[12px] font-bold text-white shadow-1">
                  <BadgeCheck className="size-3.5" /> Verified
                </div>
              )}
            </div>
          </div>

          {/* Heavy bottom steel bar with central pull-handle / lock groove */}
          <div className="absolute inset-x-0 bottom-0 flex h-[56px] flex-col items-center justify-center border-t-2 border-white/25 border-b-[3px] border-b-[#0D111B] bg-[linear-gradient(180deg,#525E7A_0%,#343D54_30%,#1E2436_85%,#131724_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
            <span className="absolute left-6 size-2.5 rounded-full bg-[#121623] ring-1 ring-white/20 sm:left-10" />
            <span className="absolute right-6 size-2.5 rounded-full bg-[#121623] ring-1 ring-white/20 sm:right-10" />

            {/* Recessed central pull-handle / lock groove */}
            <div className="flex h-4 w-24 items-center justify-center rounded-full bg-[#0E121D] shadow-[inset_0_2px_5px_rgba(0,0,0,0.85)] ring-1 ring-white/15">
              <span className="h-1.5 w-12 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.6),rgba(255,255,255,0.2))]" />
            </div>
            <span lang="mr" className="mt-1 font-deva text-[11.5px] leading-none font-medium text-white/70">
              {TAGLINE.mr}
            </span>
          </div>

          {/* Rolling bottom cast-shadow gliding upward across the bright storefront underneath */}
          <motion.div
            initial={{ opacity: 0.65 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none absolute inset-x-0 top-full h-10 bg-[linear-gradient(180deg,rgba(12,14,22,0.52)_0%,rgba(12,14,22,0.18)_45%,rgba(12,14,22,0)_100%)]"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
