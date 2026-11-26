"use client";
import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo } from "motion/react";
import { X } from "lucide-react";
import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";
import { IconButton } from "./button";

const DESKTOP_QUERY = "(min-width: 1024px)";

function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(DESKTOP_QUERY);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

const subscribeNoop = () => () => {};
function useMounted() {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

/**
 * Responsive sheet (DESIGN §5.3 / §6.3):
 * mobile → spring bottom sheet with drag-to-dismiss;
 * desktop → right drawer (480px) or centred modal (≤560px).
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  desktop = "modal",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  desktop?: "modal" | "drawer";
  className?: string;
}) {
  const mounted = useMounted();
  const isDesktop = useIsDesktop();
  const reduce = useReducedMotion();
  const drag = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Esc to close, focus in, scroll lock, focus restore.
  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>("input, textarea, select, [data-autofocus]");
      (first ?? panelRef.current)?.focus();
    }, 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) trapTab(e, panelRef.current);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      lastFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const variant: "bottom" | "drawer" | "modal" = !isDesktop ? "bottom" : desktop;
  const fade = reduce ? { duration: 0.15 } : spring.default;
  const motionFor = {
    bottom: { initial: { y: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }, animate: { y: 0, opacity: 1 }, exit: { y: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 } },
    drawer: { initial: { x: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }, animate: { x: 0, opacity: 1 }, exit: { x: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 } },
    modal: { initial: { y: reduce ? 0 : 16, scale: reduce ? 1 : 0.98, opacity: 0 }, animate: { y: 0, scale: 1, opacity: 1 }, exit: { y: reduce ? 0 : 12, scale: reduce ? 1 : 0.98, opacity: 0 } },
  }[variant];

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const h = panelRef.current?.offsetHeight ?? 600;
    if (info.offset.y > h * 0.3 || info.velocity.y > 500) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[68]">
          <motion.div
            className="absolute inset-0 bg-ink-900/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-0 flex",
              variant === "bottom" && "items-end",
              variant === "drawer" && "justify-end",
              variant === "modal" && "items-center justify-center p-6",
            )}
          >
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              tabIndex={-1}
              {...motionFor}
              transition={fade}
              drag={variant === "bottom" && !reduce ? "y" : false}
              dragListener={false}
              dragControls={drag}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={onDragEnd}
              className={cn(
                "pointer-events-auto flex max-h-[92dvh] w-full flex-col bg-surface outline-none",
                variant === "bottom" && "rounded-t-xl shadow-sheet",
                variant === "drawer" && "h-full max-h-none w-[480px] shadow-sheet",
                variant === "modal" && "max-w-[560px] rounded-xl shadow-2",
                className,
              )}
            >
              {variant === "bottom" && (
                <div
                  className="flex h-6 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
                  onPointerDown={(e) => drag.start(e)}
                  aria-hidden
                >
                  <span className="h-1 w-9 rounded-full bg-hairline-strong" />
                </div>
              )}
              {(title || description) && (
                <div className={cn("flex shrink-0 items-start gap-3 px-5", variant === "bottom" ? "pb-3" : "pt-5 pb-3")}>
                  <div className="min-w-0 flex-1">
                    {title && (
                      <h2 id={titleId} className="text-[20px] leading-[26px] font-bold tracking-[-0.01em]">
                        {title}
                      </h2>
                    )}
                    {description && <p className="mt-1 text-[13px] leading-[18px] text-ink-500">{description}</p>}
                  </div>
                  <IconButton label="Band karein" onClick={onClose} className="-mt-1.5 -mr-2 size-10">
                    <X className="size-5" strokeWidth={1.75} />
                  </IconButton>
                </div>
              )}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
              {footer && <div className="shrink-0 border-t border-hairline px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">{footer}</div>}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function trapTab(e: KeyboardEvent, root: HTMLElement) {
  const nodes = root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  if (!nodes.length) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
