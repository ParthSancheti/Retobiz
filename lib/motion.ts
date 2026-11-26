// DESIGN §5.1–5.2 — motion tokens, Apple cubic-bezier curves, and spring presets.
import type { Transition } from "motion/react";

export const spring = {
  default: { type: "spring", stiffness: 360, damping: 30, mass: 0.95 },
  snappy: { type: "spring", stiffness: 500, damping: 32, mass: 0.8 },
  pill: { type: "spring", stiffness: 380, damping: 32, mass: 0.95 },
  gentle: { type: "spring", stiffness: 260, damping: 28, mass: 1 },
  sheet: { type: "spring", stiffness: 340, damping: 34, mass: 1 },
} satisfies Record<string, Transition>;

export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  shutter: [0.32, 0.72, 0, 1],
} as const;

export const tween = {
  out: { duration: 0.24, ease: ease.out },
  inOut: { duration: 0.28, ease: ease.inOut },
  shutter: { duration: 0.78, ease: ease.shutter },
  blurIn: { duration: 0.52, ease: ease.out },
} satisfies Record<string, Transition>;

export const tap = { scale: 0.97 };

/** Staggered first-mount reveal (max 8 staggered children). */
export const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.04 } } },
  item: {
    hidden: { opacity: 0, y: 12, scale: 0.985 },
    show: { opacity: 1, y: 0, scale: 1, transition: tween.blurIn },
  },
} as const;
