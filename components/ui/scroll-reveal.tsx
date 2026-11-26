"use client";
import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ease } from "@/lib/motion";

/**
 * Apple-style scroll choreography:
 * Sections softly de-blur & rise into focus as they enter the viewport,
 * and subtly fade upward with gentle blur as they scroll out at the top.
 */
export function ScrollBlurSection({
  children,
  className,
  id,
  "aria-labelledby": ariaLabelledBy,
  exitFade = true,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  "aria-labelledby"?: string;
  exitFade?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 98%", "end 4%"],
  });

  const opacity = useTransform(
    scrollYProgress,
    exitFade ? [0, 0.1, 0.88, 1] : [0, 0.12, 1],
    exitFade ? [0.25, 1, 1, 0.35] : [0.25, 1, 1],
  );
  const scale = useTransform(
    scrollYProgress,
    exitFade ? [0, 0.1, 0.88, 1] : [0, 0.12, 1],
    exitFade ? [0.975, 1, 1, 0.975] : [0.975, 1, 1],
  );
  const y = useTransform(
    scrollYProgress,
    exitFade ? [0, 0.1, 0.88, 1] : [0, 0.12, 1],
    exitFade ? [18, 0, 0, -10] : [18, 0, 0],
  );
  const blurAmount = useTransform(
    scrollYProgress,
    exitFade ? [0, 0.1, 0.88, 1] : [0, 0.12, 1],
    exitFade ? [5, 0, 0, 5] : [5, 0, 0],
  );
  const filter = useMotionTemplate`blur(${blurAmount}px)`;

  if (reduce) {
    return (
      <section ref={ref} id={id} aria-labelledby={ariaLabelledBy} className={className}>
        {children}
      </section>
    );
  }

  return (
    <motion.section
      ref={ref}
      id={id}
      aria-labelledby={ariaLabelledBy}
      style={{ opacity, scale, y, filter }}
      className={cn("will-change-[transform,opacity,filter]", className)}
    >
      {children}
    </motion.section>
  );
}

/**
 * Subtle de-blur entrance for initial hero / header blocks or individual grid cards.
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
      initial={{ opacity: 0, y: 12, scale: 0.985, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.48, delay, ease: ease.out }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
