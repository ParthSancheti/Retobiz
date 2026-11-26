"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  BadgePercent,
  Check,
  Compass,
  Heart,
  Home,
  MapPin,
  RotateCcw,
  Store,
  Ticket,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { ButtonLink } from "@/components/ui/button";
import { RetailImage } from "@/components/media/retail-image";
import { GLYPHS, WASH_BG } from "@/components/media/glyphs";
import { useStore } from "@/store";
import { useUiStore } from "@/store/ui";
import { useHydrated } from "@/store/sync";
import { cn } from "@/lib/cn";
import { ease } from "@/lib/motion";
import type { Role } from "@/lib/types";

const subscribeNoop = () => () => {};

/**
 * Full-screen frosted-glass Explore Hub (opened via mobile Menu button or floating dock Explore tab).
 * Hosts all categories, VIP Passes + unread WhatsApp badge, Saved Offers, Location switch, and Demo Role switcher.
 */
export function ExploreMenuHost() {
  return (
    <Suspense fallback={null}>
      <Host />
    </Suspense>
  );
}

function Host() {
  const open = useUiStore((s) => s.exploreOpen);
  const setOpen = useUiStore((s) => s.setExploreOpen);
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>{open && <ExplorePanel onClose={() => setOpen(false)} />}</AnimatePresence>,
    document.body,
  );
}

function ExplorePanel({ onClose }: { onClose: () => void }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const reduce = useReducedMotion();
  const hydrated = useHydrated();
  const categories = useStore((s) => s.categories);
  const locations = useStore((s) => s.locations);
  const buyerLocation = useStore((s) => s.buyerLocation);
  const buyer = useStore((s) => s.buyer);
  const buyerPassIds = useStore((s) => s.buyerPassIds);
  const inbox = useStore((s) => s.inbox);
  const savedOfferIds = useStore((s) => s.savedOfferIds);
  const resetDemo = useStore((s) => s.resetDemo);
  const setLocationOpen = useUiStore((s) => s.setLocationOpen);
  const shutterMuted = useUiStore((s) => s.shutterMuted);
  const toggleShutterMuted = useUiStore((s) => s.toggleShutterMuted);
  const lastRouteByRole = useUiStore((s) => s.lastRouteByRole);

  const [confirmReset, setConfirmReset] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const activeCats = useMemo(
    () => categories.filter((c) => c.active).sort((a, b) => a.order - b.order),
    [categories],
  );
  const areaName = locations.find((l) => l.id === buyerLocation.areaId)?.name ?? "Akurdi";
  const unread = inbox.filter((m) => !m.read).length;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const switchRole = (r: Role) => {
    onClose();
    router.push(lastRouteByRole[r] ?? (r === "buyer" ? "/" : `/${r}`));
  };

  const quickRoutes = [
    { href: "/", label: "Home", sub: "Deals & nearby", icon: Home, active: pathname === "/" },
    { href: "/search?tab=shops", label: "Explore Shops", sub: "Verified stores", icon: Store, active: pathname.startsWith("/search") },
    { href: "/offers", label: "Aaj ke Offers", sub: "Live discounts", icon: BadgePercent, active: pathname.startsWith("/offers") },
    {
      href: "/passes",
      label: "My VIP Passes",
      sub: hydrated ? `${buyerPassIds.length} pass · ${savedOfferIds.length} saved` : "Passes & inbox",
      icon: Ticket,
      active: pathname.startsWith("/passes"),
      badge: hydrated && unread > 0 ? unread : undefined,
    },
  ];

  return (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Explore Retobiz"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.99 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.99 }}
      transition={{ duration: 0.22, ease: ease.out }}
      className="fixed inset-0 z-40 flex flex-col bg-[#FFFDF9]/95 backdrop-blur-2xl"
    >
      {/* Header */}
      <div className="mx-auto flex h-16 w-full max-w-[680px] shrink-0 items-center justify-between border-b border-black/[0.06] px-5">
        <BrandLockup size="sm" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleShutterMuted}
            aria-label={shutterMuted ? "Unmute shutter sound" : "Mute shutter sound"}
            className="flex size-10 items-center justify-center rounded-full border border-black/[0.07] bg-white/80 text-ink-600 transition-colors hover:text-ink-900 active:scale-95"
          >
            {shutterMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Explore menu"
            className="flex size-10 items-center justify-center rounded-full bg-ink-900 text-white shadow-1 active:scale-95"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* Scrollable full-screen body — clears floating dock completely */}
      <div className="mx-auto w-full max-w-[680px] flex-1 overflow-y-auto px-5 py-4 pb-36 lg:pb-10">
        {/* Buyer Profile + Location Pill Row */}
        <div className="mb-4 flex items-center justify-between gap-3 rounded-[22px] border border-black/[0.06] bg-white/90 p-3 shadow-[0_6px_24px_-8px_rgba(18,20,26,0.08)]">
          <button type="button" onClick={() => go("/passes")} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/avatar-buyer.jpg"
              alt="Buyer profile"
              className="size-11 shrink-0 rounded-full border border-saffron-400/50 bg-wash-cream object-cover object-top"
            />
            <div className="min-w-0">
              <div className="truncate font-display text-[15px] font-bold text-ink-900">
                {hydrated && buyer?.name ? buyer.name : "Welcome, Shopper"}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-500">
                <span>{hydrated ? `${buyerPassIds.length} VIP Passes` : "VIP Passes"}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Heart className="size-3 fill-flame-500 text-flame-500" /> {hydrated ? savedOfferIds.length : 0} saved
                </span>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              setLocationOpen(true);
            }}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-canvas px-3 text-[12.5px] font-bold text-ink-900 transition-colors hover:bg-sunk"
          >
            <MapPin className="size-3.5 text-flame-600" />
            <span>{hydrated ? areaName : "Akurdi"}</span>
          </button>
        </div>

        {/* Core Destinations */}
        <div className="mb-4 grid grid-cols-2 gap-2.5">
          {quickRoutes.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-[18px] border p-2.5 transition-all duration-200 active:scale-[0.98]",
                  item.active
                    ? "border-transparent bg-[linear-gradient(135deg,#FF8A2B_0%,#EC4613_100%)] text-white shadow-[0_6px_18px_-6px_rgba(236,70,19,0.5)]"
                    : "border-black/[0.06] bg-white/90 text-ink-900 shadow-1 hover:border-black/[0.12]",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-xl",
                    item.active ? "bg-white/20 text-white" : "bg-canvas text-ink-800",
                  )}
                >
                  <Icon className="size-4" strokeWidth={2} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] leading-[15px] font-bold">{item.label}</span>
                  <span className={cn("mt-0.5 block text-[11px] leading-[13px]", item.active ? "text-white/80" : "text-ink-500")}>{item.sub}</span>
                </span>
                {item.badge != null && (
                  <span className="tabular absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-leaf-500 text-[10.5px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* All 10 Local Categories */}
        <div className="mb-2.5 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold tracking-[0.06em] text-ink-500 uppercase">
            <Compass className="size-3.5 text-flame-500" /> Browse Categories
          </span>
          <Link href="/search" onClick={onClose} className="text-[12.5px] font-bold text-indigo-600">
            All Filters →
          </Link>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2">
          {activeCats.map((cat) => {
            const Icon = GLYPHS[cat.glyph] ?? Store;
            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                onClick={onClose}
                className="group flex items-center gap-2 rounded-[16px] border border-black/[0.06] bg-white/95 p-2 shadow-1 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <div className={cn("relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px]", WASH_BG[cat.wash])}>
                  {cat.imageKey ? (
                    <RetailImage imageKey={cat.imageKey} size="thumb" wash={cat.wash} alt="" className="size-full rounded-[10px]" />
                  ) : (
                    <Icon className="size-4 text-ink-800" strokeWidth={1.85} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-[12px] leading-[14px] font-bold text-ink-900">{cat.name}</div>
                  {cat.nameHi && (
                    <div lang="hi" className="mt-0.5 font-deva text-[10.5px] leading-[12px] text-ink-500">
                      {cat.nameHi}
                    </div>
                  )}
                </div>
                <ArrowRight className="hidden size-3.5 shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-700 md:block" />
              </Link>
            );
          })}
        </div>

        {/* List Your Shop CTA */}
        <ButtonLink href="/list-your-shop" variant="primary-flame" size="md" full onClick={onClose} icon={<Store className="size-4.5" />} className="rounded-full">
          Apni Dukaan List Karein
        </ButtonLink>

        {/* Demo Mode Switcher */}
        <div className="mt-6 rounded-[20px] border border-black/[0.06] bg-canvas p-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-[0.06em] text-ink-500 uppercase">Demo Mode</span>
            <button
              type="button"
              onClick={() => {
                if (!confirmReset) return setConfirmReset(true);
                resetDemo();
                setConfirmReset(false);
                onClose();
              }}
              className={cn("inline-flex items-center gap-1 text-[12px] font-semibold", confirmReset ? "text-flame-600" : "text-ink-500 hover:text-ink-900")}
            >
              <RotateCcw className="size-3.5" />
              {confirmReset ? "Tap again to reset" : "Reset demo"}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { role: "buyer", label: "Buyer" },
                { role: "merchant", label: "Shop Owner" },
                { role: "admin", label: "Admin" },
              ] as const
            ).map((r) => (
              <button
                key={r.role}
                type="button"
                onClick={() => switchRole(r.role)}
                className={cn(
                  "flex h-9 items-center justify-center gap-1 rounded-xl text-[12.5px] font-bold transition-colors",
                  r.role === "buyer" ? "bg-ink-900 text-white" : "border border-black/[0.06] bg-white text-ink-700 hover:text-ink-900",
                )}
              >
                {r.role === "buyer" && <Check className="size-3.5 text-saffron-400" />}
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
