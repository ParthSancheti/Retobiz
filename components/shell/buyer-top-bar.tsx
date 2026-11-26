"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  ChevronDown,
  Heart,
  MapPin,
  Menu,
  RotateCcw,
  Search,
  Store,
  Ticket,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { BrandLockup, BrandMark } from "@/components/brand/brand-lockup";
import { ButtonLink } from "@/components/ui/button";
import { RetailImage } from "@/components/media/retail-image";
import { GLYPHS, WASH_BG } from "@/components/media/glyphs";
import { useStore } from "@/store";
import { useUiStore } from "@/store/ui";
import { useHydrated } from "@/store/sync";
import { cn } from "@/lib/cn";
import { ease } from "@/lib/motion";
import type { Role } from "@/lib/types";
import { RotatingSearchHint, STATIC_PLACEHOLDER } from "@/components/buyer/rotating-search-hint";
import { UtilityRoleSwitcher } from "./role-switcher";

/** Desktop-only slim ink strip that hosts the demo role switcher (never overlaps content). */
export function DemoUtilityBar() {
  return (
    <div className="hidden h-9 bg-ink-900 text-white lg:block">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-8">
        <span className="text-[12px] text-white/60">Retobiz demo prototype · data sirf is browser mein rehta hai</span>
        <UtilityRoleSwitcher />
      </div>
    </div>
  );
}

/**
 * Minimalist single-row sticky buyer navbar (h-16 / 64px).
 * - Mobile (390px): BrandMark + calm Location pill on left; Search + Menu + Profile Avatar image on right.
 * - Desktop (1024px+): Lockup + Location pill | Home · Explore Shops · Offers · Categories | Search + List Shop + Profile Avatar.
 * - Scroll behavior: warm canvas at scrollY === 0, transitioning smoothly to Apple frosted glass on scroll.
 */
export function BuyerTopBar() {
  const hydrated = useHydrated();
  const locations = useStore((s) => s.locations);
  const buyerLocation = useStore((s) => s.buyerLocation);
  const searchOpen = useUiStore((s) => s.searchOpen);
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);
  const setLocationOpen = useUiStore((s) => s.setLocationOpen);
  const setExploreOpen = useUiStore((s) => s.setExploreOpen);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { area, city } = useMemo(() => {
    const a = locations.find((l) => l.id === buyerLocation.areaId);
    const c = locations.find((l) => l.id === a?.parentId);
    return {
      area: a?.name ?? "Akurdi",
      city: (c?.name ?? "Pune").replace(" (PCMC)", ""),
    };
  }, [locations, buyerLocation.areaId]);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 h-16 transition-[background-color,box-shadow,border-color,backdrop-filter] duration-[250ms] ease-out",
        scrolled
          ? "border-b border-black/[0.06] bg-white/85 shadow-[0_6px_28px_rgba(18,20,26,0.07)] backdrop-blur-2xl"
          : "border-b border-black/[0.04] bg-[#FFF5D6]",
      )}
    >
      <div className="relative mx-auto flex h-full max-w-[1280px] items-center justify-between gap-3 px-4 lg:gap-4 lg:px-8">
        {/* Left: Minimalist Mark (mobile) / Lockup (desktop) + Calm Location Pill */}
        <div className="flex min-w-0 items-center gap-2.5 lg:gap-3">
          <Link href="/" aria-label="Retobiz home" className="shrink-0 rounded-full transition-transform active:scale-95">
            <span className="lg:hidden">
              <BrandMark size={28} />
            </span>
            <span className="hidden lg:inline-flex">
              <BrandLockup size="sm" />
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setLocationOpen(true)}
            className="inline-flex h-10 max-w-[152px] shrink-0 items-center gap-1.5 rounded-full border border-black/[0.07] bg-white/85 px-3 text-left text-[13px] font-bold text-ink-900 shadow-[0_2px_8px_-3px_rgba(18,20,26,0.08)] backdrop-blur-md transition-all duration-200 hover:border-black/[0.15] hover:bg-white active:scale-[0.97] lg:h-9 lg:max-w-[196px]"
            aria-label={`Location: ${area}, ${city}. Badlein`}
          >
            <MapPin className="size-3.5 shrink-0 text-flame-600" strokeWidth={2.25} />
            <span className="truncate">
              {hydrated ? (
                <>
                  {area}
                  <span className="hidden sm:inline lg:inline">, {city}</span>
                </>
              ) : (
                <>
                  Akurdi<span className="hidden sm:inline lg:inline">, Pune</span>
                </>
              )}
            </span>
            <ChevronDown className="size-3.5 shrink-0 text-ink-500" />
          </button>
        </div>

        {/* Center: Primary Desktop Navigation + Categories Mega-Popover */}
        <Suspense fallback={<div className="hidden h-9 w-[340px] lg:block" />}>
          <DesktopNav />
        </Suspense>

        {/* Right: Minimalist 3-button cluster (Search · Menu · Profile Image on mobile / Search · CTA · Profile on desktop) */}
        <div className="flex shrink-0 items-center gap-2 lg:gap-2.5">
          {/* Desktop compact Search bar */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-black/[0.08] bg-white/85 text-ink-700 shadow-[0_1px_2px_rgba(18,20,26,0.05)] transition-all duration-200 hover:border-black/[0.15] hover:bg-white active:scale-[0.97] lg:flex xl:w-[212px] xl:justify-start xl:gap-2 xl:px-3"
            aria-label={STATIC_PLACEHOLDER}
          >
            <Search className="size-4 shrink-0 text-ink-900" strokeWidth={2} />
            <span className="hidden min-w-0 flex-1 text-[13px] xl:flex">
              <RotatingSearchHint paused={searchOpen} />
            </span>
          </button>

          {/* Desktop primary CTA */}
          <ButtonLink
            href="/list-your-shop"
            variant="primary-flame"
            size="sm"
            icon={<Store className="size-4 shrink-0" strokeWidth={2.1} />}
            className="hidden h-9 rounded-full px-4 text-[13px] shadow-[0_6px_16px_-6px_rgba(236,70,19,0.55)] lg:inline-flex"
          >
            Apni Dukaan List Karein
          </ButtonLink>

          {/* Mobile 1/3: Search glass button */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex size-10 items-center justify-center rounded-full border border-black/[0.07] bg-white/85 text-ink-900 shadow-[0_2px_8px_-3px_rgba(18,20,26,0.08)] backdrop-blur-md transition-all duration-200 hover:bg-white active:scale-95 lg:hidden"
            aria-label={STATIC_PLACEHOLDER}
          >
            <Search className="size-[18px]" strokeWidth={2.1} />
          </button>

          {/* Mobile 2/3: Full-screen Menu button */}
          <button
            type="button"
            onClick={() => setExploreOpen(true)}
            className="flex size-10 items-center justify-center rounded-full border border-black/[0.07] bg-white/85 text-ink-900 shadow-[0_2px_8px_-3px_rgba(18,20,26,0.08)] backdrop-blur-md transition-all duration-200 hover:bg-white active:scale-95 lg:hidden"
            aria-label="Open menu and categories"
          >
            <Menu className="size-[18px]" strokeWidth={2.1} />
          </button>

          {/* 3/3 (Mobile + Desktop): Profile Picture Avatar opening Account & Options */}
          <Suspense fallback={<div className="size-10 rounded-full bg-wash-cream lg:size-9" />}>
            <ProfileAvatarMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────── Profile Avatar Menu ─────────────────── */

function ProfileAvatarMenu() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const router = useRouter();
  const hydrated = useHydrated();
  const buyer = useStore((s) => s.buyer);
  const buyerPassIds = useStore((s) => s.buyerPassIds);
  const savedOfferIds = useStore((s) => s.savedOfferIds);
  const inbox = useStore((s) => s.inbox);
  const resetDemo = useStore((s) => s.resetDemo);
  const setLocationOpen = useUiStore((s) => s.setLocationOpen);
  const shutterMuted = useUiStore((s) => s.shutterMuted);
  const toggleShutterMuted = useUiStore((s) => s.toggleShutterMuted);
  const lastRouteByRole = useUiStore((s) => s.lastRouteByRole);

  const [openRoute, setOpenRoute] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const open = openRoute === routeKey;
  const wrapRef = useRef<HTMLDivElement>(null);

  const unread = inbox.filter((m) => !m.read).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpenRoute(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenRoute(null);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const switchRole = (r: Role) => {
    setOpenRoute(null);
    router.push(lastRouteByRole[r] ?? (r === "buyer" ? "/" : `/${r}`));
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpenRoute((prev) => (prev === routeKey ? null : routeKey))}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Profile and options"
        className="relative flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-wash-cream shadow-[0_2px_10px_-2px_rgba(18,20,26,0.16)] transition-transform duration-200 hover:scale-[1.03] active:scale-95 lg:size-9"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/avatar-buyer.jpg"
          alt="Profile"
          className="size-full object-cover object-top"
        />
        {hydrated && unread > 0 && (
          <span aria-hidden className="absolute right-0 bottom-0 size-2.5 rounded-full bg-leaf-500 ring-2 ring-white" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 6, scale: 0.96, filter: "blur(4px)", transition: { duration: 0.14 } }}
            transition={{ duration: 0.22, ease: ease.out }}
            className="absolute top-[calc(100%+10px)] right-0 z-50 w-[290px] overflow-hidden rounded-[24px] border border-black/[0.08] bg-white/95 p-3 shadow-[0_24px_60px_-12px_rgba(18,20,26,0.22)] backdrop-blur-2xl"
          >
            {/* Buyer identity */}
            <div className="flex items-center gap-3 rounded-[16px] bg-canvas p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/avatar-buyer.jpg"
                alt=""
                className="size-11 shrink-0 rounded-full border border-white object-cover object-top shadow-1"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold text-ink-900">
                  {hydrated && buyer?.name ? buyer.name : "Namaste, Shopper"}
                </div>
                <div className="text-[11.5px] text-ink-500">
                  {hydrated && buyer?.mobile ? `+91 ${buyer.mobile}` : "Guest Buyer · Retobiz"}
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="mt-2 flex flex-col gap-1">
              <Link
                href="/passes"
                onClick={() => setOpenRoute(null)}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-ink-900 transition-colors hover:bg-canvas"
              >
                <span className="flex items-center gap-2.5">
                  <Ticket className="size-4 text-flame-600" /> My VIP Passes
                </span>
                <span className="tabular rounded-full bg-saffron-100 px-2 py-0.5 text-[11px] font-bold text-ink-900">
                  {hydrated ? buyerPassIds.length : 0}
                </span>
              </Link>

              <Link
                href="/passes"
                onClick={() => setOpenRoute(null)}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-ink-900 transition-colors hover:bg-canvas"
              >
                <span className="flex items-center gap-2.5">
                  <Heart className="size-4 text-flame-500" /> Saved Offers
                </span>
                <span className="tabular text-[12px] font-bold text-ink-500">{hydrated ? savedOfferIds.length : 0}</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setOpenRoute(null);
                  setLocationOpen(true);
                }}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13.5px] font-semibold text-ink-900 transition-colors hover:bg-canvas"
              >
                <span className="flex items-center gap-2.5">
                  <MapPin className="size-4 text-indigo-600" /> Change Location
                </span>
                <ArrowRight className="size-3.5 text-ink-400" />
              </button>

              <button
                type="button"
                onClick={toggleShutterMuted}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13.5px] font-semibold text-ink-900 transition-colors hover:bg-canvas"
              >
                <span className="flex items-center gap-2.5">
                  {shutterMuted ? <VolumeX className="size-4 text-ink-500" /> : <Volume2 className="size-4 text-leaf-600" />}
                  Shutter Sound
                </span>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", shutterMuted ? "bg-sunk text-ink-500" : "bg-leaf-50 text-leaf-700")}>
                  {shutterMuted ? "Off" : "On"}
                </span>
              </button>

              <Link
                href="/list-your-shop"
                onClick={() => setOpenRoute(null)}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[13.5px] font-bold text-flame-600 transition-colors hover:bg-flame-50"
              >
                <span className="flex items-center gap-2.5">
                  <Store className="size-4" /> Apni Dukaan List Karein
                </span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {/* Compact Role Switcher (mobile convenience) */}
            <div className="mt-2 border-t border-hairline pt-2.5">
              <div className="mb-1.5 flex items-center justify-between px-1">
                <span className="text-[10.5px] font-bold tracking-[0.06em] text-ink-500 uppercase">Switch Demo View</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!confirmReset) return setConfirmReset(true);
                    resetDemo();
                    setConfirmReset(false);
                    setOpenRoute(null);
                  }}
                  className={cn("inline-flex items-center gap-1 text-[11px] font-semibold", confirmReset ? "text-flame-600" : "text-ink-400 hover:text-ink-800")}
                >
                  <RotateCcw className="size-3" /> {confirmReset ? "Confirm?" : "Reset"}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(
                  [
                    { r: "buyer", label: "Buyer" },
                    { r: "merchant", label: "Owner" },
                    { r: "admin", label: "Admin" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.r}
                    type="button"
                    onClick={() => switchRole(item.r)}
                    className={cn(
                      "h-8 rounded-lg text-[12px] font-bold transition-colors",
                      item.r === "buyer" ? "bg-ink-900 text-white" : "bg-canvas text-ink-700 hover:bg-sunk",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────── Desktop Navigation & Mega-Popover ─────────────────── */

function DesktopNav() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const categories = useStore((s) => s.categories);
  const subCategories = useStore((s) => s.subCategories);
  const [openRoute, setOpenRoute] = useState<string | null>(null);
  const catOpen = openRoute === routeKey;
  const wrapRef = useRef<HTMLDivElement>(null);

  const activeCats = useMemo(
    () => categories.filter((c) => c.active).sort((a, b) => a.order - b.order),
    [categories],
  );

  useEffect(() => {
    if (!catOpen) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpenRoute(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenRoute(null);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [catOpen]);

  const isHome = pathname === "/";
  const isShops = pathname.startsWith("/search");
  const isOffers = pathname.startsWith("/offers");
  const isCatRoute = pathname.startsWith("/category");

  const linkCls = (active: boolean) =>
    cn(
      "inline-flex h-9 items-center gap-1 rounded-full px-3.5 text-[13.5px] font-semibold whitespace-nowrap transition-all duration-200",
      active
        ? "bg-ink-900 text-white shadow-[0_2px_8px_rgba(18,20,26,0.16)]"
        : "text-ink-700 hover:bg-black/[0.05] hover:text-ink-900",
    );

  return (
    <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex" ref={wrapRef}>
      <Link href="/" aria-current={isHome ? "page" : undefined} className={linkCls(isHome)}>
        Home
      </Link>
      <Link href="/search?tab=shops" aria-current={isShops ? "page" : undefined} className={linkCls(isShops)}>
        Explore Shops
      </Link>
      <Link href="/offers" aria-current={isOffers ? "page" : undefined} className={linkCls(isOffers)}>
        Offers
      </Link>

      <div className="static">
        <button
          type="button"
          onClick={() => setOpenRoute((prev) => (prev === routeKey ? null : routeKey))}
          aria-expanded={catOpen}
          aria-haspopup="true"
          className={linkCls(catOpen || isCatRoute)}
        >
          <span>Categories</span>
          <ChevronDown className={cn("size-3.5 transition-transform duration-200", catOpen && "rotate-180")} />
        </button>

        <AnimatePresence>
          {catOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 6, scale: 0.98, filter: "blur(4px)", transition: { duration: 0.14 } }}
              transition={{ duration: 0.22, ease: ease.out }}
              className="absolute top-[calc(100%+8px)] left-1/2 z-50 w-[760px] max-w-[calc(100vw-32px)] -translate-x-1/2 overflow-hidden rounded-[24px] border border-black/[0.08] bg-white/95 p-5 shadow-[0_24px_60px_-12px_rgba(18,20,26,0.22)] backdrop-blur-2xl"
            >
              <div className="mb-3.5 flex items-center justify-between border-b border-hairline pb-2.5">
                <div>
                  <span className="text-[11px] font-bold tracking-[0.06em] text-ink-500 uppercase">Local Marketplace</span>
                  <h3 className="text-[16px] font-bold text-ink-900">Sabhi 10 Categories</h3>
                </div>
                <Link
                  href="/search"
                  onClick={() => setOpenRoute(null)}
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1.5 text-[12.5px] font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
                >
                  All filters <ArrowRight className="size-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {activeCats.map((cat) => {
                  const Icon = GLYPHS[cat.glyph] ?? Store;
                  const subCount = subCategories.filter((s) => s.categoryId === cat.id && s.active).length;
                  return (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      onClick={() => setOpenRoute(null)}
                      className="group flex items-center gap-3 rounded-[16px] border border-transparent p-2 transition-all duration-200 hover:border-black/[0.06] hover:bg-canvas"
                    >
                      <div className={cn("relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[12px]", WASH_BG[cat.wash])}>
                        {cat.imageKey ? (
                          <RetailImage
                            imageKey={cat.imageKey}
                            size="thumb"
                            wash={cat.wash}
                            alt=""
                            zoom
                            className="size-full rounded-[12px]"
                          />
                        ) : (
                          <Icon className="size-5 text-ink-800" strokeWidth={1.85} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[13.5px] font-bold text-ink-900 group-hover:text-indigo-700">
                            {cat.name}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-ink-500">
                          {cat.nameHi && (
                            <span lang="hi" className="font-deva font-medium">
                              {cat.nameHi}
                            </span>
                          )}
                          {cat.nameHi && subCount > 0 && <span>·</span>}
                          {subCount > 0 && <span>{subCount} sections</span>}
                        </div>
                      </div>
                      <ArrowRight className="size-3.5 shrink-0 text-ink-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-600" />
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
