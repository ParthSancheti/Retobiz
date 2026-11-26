"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { useEffect } from "react";
import { useUiStore, type Toast } from "@/store/ui";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/cn";

/** Bottom-centre ink toasts, above the bottom nav (DESIGN §7). Auto-dismiss 3s. */
export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(92px+env(safe-area-inset-bottom))] z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-8"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useUiStore((s) => s.dismissToast);
  useEffect(() => {
    const id = setTimeout(() => dismiss(toast.id), 3000);
    return () => clearTimeout(id);
  }, [toast.id, dismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.15 } }}
      transition={spring.default}
      className="pointer-events-auto flex max-w-[420px] items-center gap-2.5 rounded-md bg-ink-900 py-2.5 pr-2 pl-3.5 text-[14px] font-medium text-white shadow-2"
      role="status"
    >
      {toast.tone === "success" && <CheckCircle2 className="size-[18px] shrink-0 text-leaf-500" strokeWidth={2} />}
      {toast.tone === "error" && <CircleAlert className="size-[18px] shrink-0 text-flame-500" strokeWidth={2} />}
      <span className={cn("min-w-0 flex-1", !toast.action && "pr-1.5")}>{toast.message}</span>
      {toast.action?.href && (
        <Link
          href={toast.action.href}
          onClick={() => dismiss(toast.id)}
          className="rounded-sm px-2 py-1 text-[13px] font-bold text-saffron-400 hover:bg-white/10"
        >
          {toast.action.label}
        </Link>
      )}
    </motion.div>
  );
}
