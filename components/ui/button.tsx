"use client";
import Link from "next/link";
import { motion, type HTMLMotionProps } from "motion/react";
import { Loader2 } from "lucide-react";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { spring, tap } from "@/lib/motion";

export type ButtonVariant = "primary-flame" | "primary-indigo" | "secondary" | "ghost" | "whatsapp" | "ink";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT: Record<ButtonVariant, string> = {
  "primary-flame": "bg-flame-500 text-white hover:bg-flame-600 font-bold",
  "primary-indigo": "bg-indigo-600 text-white hover:bg-indigo-700 font-bold",
  secondary: "bg-surface text-ink-900 border border-hairline hover:border-hairline-strong font-semibold",
  ghost: "bg-transparent text-ink-700 hover:bg-sunk font-semibold",
  whatsapp: "bg-leaf-500 text-white hover:bg-leaf-600 font-bold",
  ink: "bg-ink-900 text-white hover:bg-ink-700 font-bold",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5 rounded-full",
  md: "h-11 px-5 text-[14px] gap-2 rounded-[14px]",
  lg: "h-[52px] px-6 text-[15px] gap-2 rounded-[16px]",
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  full?: boolean;
  className?: string;
  children?: ReactNode;
}

export function buttonClasses({ variant = "secondary", size = "md", full, className }: CommonProps) {
  return cn(
    "inline-flex select-none items-center justify-center whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
    VARIANT[variant],
    SIZE[size],
    full && "w-full",
    className,
  );
}

type ButtonProps = CommonProps & Omit<HTMLMotionProps<"button">, "children">;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, icon, iconRight, loading, full, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      whileTap={disabled || loading ? undefined : tap}
      transition={spring.snappy}
      disabled={disabled || loading}
      className={buttonClasses({ variant, size, full, className })}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
      {iconRight}
    </motion.button>
  );
});

const MotionLink = motion.create(Link);

type ButtonLinkProps = CommonProps & { href: string; prefetch?: boolean; onClick?: () => void; "aria-label"?: string };

export function ButtonLink({ variant, size, icon, iconRight, full, className, children, href, ...rest }: ButtonLinkProps) {
  return (
    <MotionLink
      href={href}
      whileTap={tap}
      transition={spring.snappy}
      className={buttonClasses({ variant, size, full, className })}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </MotionLink>
  );
}

/** Icon-only round button (44×44 hit target). */
export const IconButton = forwardRef<HTMLButtonElement, Omit<HTMLMotionProps<"button">, "children"> & { label: string; children: ReactNode; tone?: "light" | "dark" }>(
  function IconButton({ label, children, className, tone = "light", type = "button", ...rest }, ref) {
    return (
      <motion.button
        ref={ref}
        type={type}
        aria-label={label}
        title={label}
        whileTap={tap}
        transition={spring.snappy}
        className={cn(
          "inline-flex size-11 items-center justify-center rounded-full transition-colors",
          tone === "light" ? "text-ink-700 hover:bg-sunk" : "text-white hover:bg-white/10",
          className,
        )}
        {...rest}
      >
        {children}
      </motion.button>
    );
  },
);
