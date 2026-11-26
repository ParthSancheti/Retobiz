// DESIGN §5.1–5.2 — the only place motion values are defined.
import type { Transition } from "motion/react";

export const spring = {
  default: { type: "spring", stiffness: 380, damping: 28, mass: 1 },
  snappy: { type: "spring", stiffness: 520, damping: 32, mass: 0.8 },
  pill: { type: "spring", stiffness: 420, damping: 34, mass: 1 },
  gentle: { type: "spring", stiffness: 260, damping: 30, mass: 1 },
} satisfies Record<string, Transition>;

export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  shutter: [0.32, 0.72, 0, 1],
} as const;

export const tween = {
  out: { duration: 0.2, ease: ease.out },
  inOut: { duration: 0.28, ease: ease.inOut },
  shutter: { duration: 0.65, ease: ease.shutter },
} satisfies Record<string, Transition>;

export const tap = { scale: 0.97 };

/** Staggered first-mount reveal (max 8 staggered children, DESIGN §5.3). */
export const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.035 } } },
  item: {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: spring.gentle },
  },
} as const;
