"use client";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Check, MoreHorizontal, RotateCcw, Store, Users } from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/store";
import { useUiStore } from "@/store/ui";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/cn";
import { spring, tap } from "@/lib/motion";
import { roleForPath } from "./store-boot";

const ROLES: { value: Role; label: string }[] = [
  { value: "buyer", label: "Buyer" },
  { value: "merchant", label: "Shop Owner" },
  { value: "admin", label: "Admin" },
];

/** Shared navigation logic for every switcher placement. */
function useRoleNav() {
  const router = useRouter();
  const role = roleForPath(usePathname() ?? "/");
  const lastRouteByRole = useUiStore((s) => s.lastRouteByRole);
  const go = (r: Role) => {
    if (r !== role) router.push(lastRouteByRole[r] ?? (r === "buyer" ? "/" : `/${r}`));
  };
  return { role, go };
}

function RolePills({ role, onPick, layoutId, className, dense }: { role: Role; onPick: (r: Role) => void; layoutId: string; className?: string; dense?: boolean }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {ROLES.map((r) => {
        const active = r.value === role;
        return (
          <button
            key={r.value}
            type="button"
            onClick={() => onPick(r.value)}
            aria-pressed={active}
            className={cn(
              "relative h-8 flex-1 rounded-full text-[12px]",
              dense ? "px-1.5" : "px-3",
              " font-semibold whitespace-nowrap transition-colors",
              active ? "text-ink-900" : "text-white/75 hover:text-white",
            )}
          >
            {active && <motion.span layoutId={layoutId} transition={spring.pill} className="absolute inset-0 rounded-full bg-white" />}
            <span className="relative">{r.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ───────────── 2. Docked in the desktop sidebar footer ───────────── */

export function DockedRoleSwitcher() {
  return (
    <Suspense fallback={<div className="h-[76px]" />}>
      <DockedInner />
    </Suspense>
  );
}

function DockedInner() {
  const { role, go } = useRoleNav();
  const hydrated = useUiStore((s) => s.hydrated);
  const [menu, setMenu] = useState(false);
  if (!hydrated) return <div className="h-[76px]" />;
  return (
    <div className="relative rounded-lg bg-ink-900 p-1.5 text-white">
      <div className="flex items-center justify-between px-1.5 pt-0.5 pb-1.5">
        <span className="text-[10px] font-semibold tracking-[0.08em] text-white/50 uppercase">Demo role</span>
        <MenuButton open={menu} onToggle={() => setMenu((m) => !m)} small />
      </div>
      <RolePills role={role} onPick={go} layoutId={`role-pill-dock-${role}`} className="rounded-full bg-white/10 p-0.5" dense />
      <AnimatePresence>{menu && <DemoMenu placement="up-left" onClose={() => setMenu(false)} />}</AnimatePresence>
    </div>
  );
}

/* ───────────── 3. Mobile dashboard header (icon → dropdown) ───────────── */

export function HeaderRoleSwitcher() {
  return (
    <Suspense fallback={<div className="size-9" />}>
      <HeaderInner />
    </Suspense>
  );
}

function HeaderInner() {
  const { role, go } = useRoleNav();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClose(ref, open, () => setOpen(false));
  return (
    <div ref={ref} className="relative lg:hidden">
      <motion.button
        type="button"
        whileTap={tap}
        transition={spring.snappy}
        onClick={() => setOpen((o) => !o)}
        aria-label="Demo role badlein"
        aria-expanded={open}
        className="flex size-9 items-center justify-center rounded-full bg-ink-900 text-white"
      >
        <Users className="size-[18px]" strokeWidth={1.75} />
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
            transition={spring.default}
            className="absolute top-[calc(100%+8px)] right-0 z-50 w-[300px] rounded-lg bg-ink-900 p-1.5 text-white shadow-2"
          >
            <div className="px-1.5 pt-0.5 pb-1.5 text-[10px] font-semibold tracking-[0.08em] text-white/50 uppercase">Demo role</div>
            <RolePills role={role} onPick={(r) => { setOpen(false); go(r); }} layoutId="role-pill-header" className="rounded-full bg-white/10 p-0.5" />
            <DemoMenuBody onDone={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────── 4. Desktop buyer utility strip (top of page) ───────────── */

export function UtilityRoleSwitcher() {
  return (
    <Suspense fallback={<div className="h-9" />}>
      <UtilityInner />
    </Suspense>
  );
}

function UtilityInner() {
  const { role, go } = useRoleNav();
  const [menu, setMenu] = useState(false);
  return (
    <div className="relative flex items-center gap-1.5">
      <span className="text-[10px] font-semibold tracking-[0.08em] text-white/50 uppercase">Demo role</span>
      <RolePills role={role} onPick={go} layoutId="role-pill-utility" className="rounded-full bg-white/10 p-0.5" />
      <MenuButton open={menu} onToggle={() => setMenu((m) => !m)} />
      <AnimatePresence>{menu && <DemoMenu placement="down-right" onClose={() => setMenu(false)} />}</AnimatePresence>
    </div>
  );
}

/* ───────────── Shared menu ───────────── */

function MenuButton({ open, onToggle, small }: { open: boolean; onToggle: () => void; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Demo options"
      aria-expanded={open}
      className={cn("flex items-center justify-center rounded-full text-white/75 hover:bg-white/10 hover:text-white", small ? "size-6" : "size-8")}
    >
      <MoreHorizontal className="size-4" />
    </button>
  );
}

function useOutsideClose(ref: React.RefObject<HTMLElement | null>, active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [ref, active, onClose]);
}

function DemoMenu({ onClose, placement }: { onClose: () => void; placement: "up-left" | "down-right" }) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClose(ref, true, onClose);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.12 } }}
      transition={spring.default}
      className={cn(
        "absolute z-50 w-[290px] overflow-hidden rounded-lg bg-ink-900 p-1.5 text-white shadow-2",
        placement === "up-left" && "right-0 bottom-[calc(100%+8px)] lg:right-auto lg:left-0",
        placement === "down-right" && "top-[calc(100%+8px)] right-0",
      )}
    >
      <DemoMenuBody onDone={onClose} />
    </motion.div>
  );
}

function DemoMenuBody({ onDone }: { onDone: () => void }) {
  const shops = useStore((s) => s.shops);
  const shopOrder = useStore((s) => s.shopOrder);
  const activeId = useStore((s) => s.activeMerchantShopId);
  const setActiveMerchant = useStore((s) => s.setActiveMerchant);
  const resetDemo = useStore((s) => s.resetDemo);
  const router = useRouter();
  const list = useMemo(() => shopOrder.map((id) => shops[id]).filter(Boolean), [shops, shopOrder]);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <>
      <div className="px-2 pt-2.5 pb-1.5 text-[10px] font-semibold tracking-[0.08em] text-white/50 uppercase">Shop Owner demo dukaan</div>
      <div className="no-scrollbar max-h-[240px] overflow-y-auto">
        {list.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setActiveMerchant(s.id);
              onDone();
              router.push("/merchant");
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-[13px] hover:bg-white/10"
          >
            <Store className="size-4 shrink-0 text-white/50" strokeWidth={1.75} />
            <span className="min-w-0 flex-1 truncate">{s.name}</span>
            {s.id === activeId && <Check className="size-4 text-saffron-400" />}
          </button>
        ))}
      </div>
      <div className="mt-1 border-t border-white/10 pt-1">
        <button
          type="button"
          onClick={() => {
            if (!confirmReset) return setConfirmReset(true);
            resetDemo();
            onDone();
          }}
          className={cn("flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-[13px] font-semibold hover:bg-white/10", confirmReset && "text-flame-500")}
        >
          <RotateCcw className="size-4" strokeWidth={1.75} />
          {confirmReset ? "Pakka? Sab demo data reset hoga" : "Reset demo data"}
        </button>
      </div>
    </>
  );
}
