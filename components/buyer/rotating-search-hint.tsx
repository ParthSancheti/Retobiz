"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ease } from "@/lib/motion";

export const SEARCH_HINTS = ["Paithani Saree", "Kaju Katli", "Mobile Screen Guard", "Kirana Combo", "Kolhapuri Chappal", "Kundan Earrings", "LED Bulb"];
export const STATIC_PLACEHOLDER = "Search sarees, mithai, mobile repair…";

/**
 * DESIGN §5.5 — "Search 'X'…" where only X slides (2.8s). Pauses when the tab is
 * hidden, when off-screen, or when `paused`. Reduced motion → static string.
 */
export function RotatingSearchHint({ paused, suffix }: { paused?: boolean; suffix?: string }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(true);
  const [docVisible, setDocVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    const onVis = () => setDocVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const running = !paused && visible && docVisible && !reduce;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setI((x) => (x + 1) % SEARCH_HINTS.length), 2800);
    return () => clearInterval(t);
  }, [running]);

  if (reduce) return <span className="truncate">{STATIC_PLACEHOLDER}</span>;

  return (
    <span ref={ref} aria-hidden className="flex min-w-0 items-center gap-1 truncate">
      <span>Search</span>
      <span className="relative inline-flex h-[22px] min-w-0 flex-1 overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={i}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { duration: 0.22, delay: 0.04, ease: ease.out } }}
            exit={{ y: -12, opacity: 0, transition: { duration: 0.18, ease: ease.out } }}
            className="truncate font-semibold text-ink-900"
          >
            ‘{SEARCH_HINTS[i]}’{suffix ? <span className="font-normal text-ink-500"> {suffix}</span> : "…"}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
