"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ease } from "@/lib/motion";

/**
 * Clean section landmark wrapper: stays crisp (opacity: 1, blur: 0) so tall lists/grids
 * and nested AppearItem cards never double-delay or blur across the middle viewport.
 */
export function ScrollBlurSection({
  children,
  className,
  id,
  "aria-labelledby": ariaLabelledBy,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  "aria-labelledby"?: string;
  exitFade?: boolean;
}) {
  return (
    <section id={id} aria-labelledby={ariaLabelledBy} className={className}>
      {children}
    </section>
  );
}

/**
 * Fast, crystal-clear entrance for hero / above-the-fold containers (zero muddy blur linger).
 */
export function BlurEntrance({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, delay, ease: ease.out }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Card-level "appear out of thin air" materialization on scroll:
 * Scales smoothly from 0.94 -> 1 with crisp fade & gentle lift right as it enters view.
 */
export function AppearItem({
  children,
  index = 0,
  immediate = false,
  className,
}: {
  children: ReactNode;
  index?: number;
  immediate?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  const staggerDelay = Math.min((index % 4) * 0.035, 0.105);

  if (immediate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.32, delay: staggerDelay, ease: ease.out }}
        className={cn(className)}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.01, margin: "120px 0px 40px 0px" }}
      transition={{ duration: 0.34, delay: staggerDelay, ease: ease.out }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
