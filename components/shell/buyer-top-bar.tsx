"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  ChevronDown,
  LayoutGrid,
  MapPin,
  Search,
  Store,
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
import { spring } from "@/lib/motion";
import { RotatingSearchHint, STATIC_PLACEHOLDER } from "@/components/buyer/rotating-search-hint";
import { HeaderRoleSwitcher, UtilityRoleSwitcher } from "./role-switcher";

const subscribeNoop = () => () => {};

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
 * Clean single-row sticky buyer navbar (h-16 / 64px).
 * Warm canvas at scrollY === 0, smoothly transitions to Apple frosted glass on scroll.
 */
export function BuyerTopBar() {
  const hydrated = useHydrated();
  const locations = useStore((s) => s.locations);
  const buyerLocation = useStore((s) => s.buyerLocation);
  const searchOpen = useUiStore((s) => s.searchOpen);
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);
  const setLocationOpen = useUiStore((s) => s.setLocationOpen);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
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
          ? "border-b border-black/[0.06] bg-white/85 shadow-[0_4px_24px_rgba(18,20,26,0.06)] backdrop-blur-xl"
          : "border-b border-black/[0.04] bg-[#FFF5D6]",
      )}
    >
      <div className="relative mx-auto flex h-full max-w-[1280px] items-center justify-between gap-2 px-3 lg:gap-4 lg:px-8">
        {/* Left: Logo + compact Location Pill */}
        <div className="flex min-w-0 items-center gap-2 lg:gap-3">
          <Link href="/" aria-label="Retobiz home" className="shrink-0 rounded-md">
            <BrandLockup size="sm" />
          </Link>
          <button
            type="button"
            onClick={() => setLocationOpen(true)}
            className="inline-flex h-9 max-w-[98px] shrink-0 items-center gap-1 rounded-full border border-black/[0.07] bg-white/85 px-2 text-left text-[12px] font-bold text-ink-900 shadow-[0_1px_2px_rgba(18,20,26,0.05)] transition-all duration-200 hover:border-black/[0.14] hover:bg-white active:scale-[0.98] lg:max-w-[190px] lg:gap-1.5 lg:px-3 lg:text-[13px]"
            aria-label={`Location: ${area}, ${city}. Badlein`}
          >
            <MapPin className="size-3.5 shrink-0 text-flame-600" strokeWidth={2.25} />
            <span className="truncate">
              {hydrated ? (
                <>
                  {area}
                  <span className="hidden lg:inline">, {city}</span>
                </>
              ) : (
                <>
                  Akurdi<span className="hidden lg:inline">, Pune</span>
                </>
              )}
            </span>
            <ChevronDown className="size-3.5 shrink-0 text-ink-500" />
          </button>
        </div>

        {/* Center: Primary desktop navigation + Categories Mega-Popover */}
        <Suspense fallback={<div className="hidden h-9 w-[340px] lg:block" />}>
          <DesktopNav />
        </Suspense>

        {/* Right: Search trigger + CTA (desktop) / Search + Categories Drawer + Role (mobile) */}
        <div className="flex shrink-0 items-center gap-1.5 lg:gap-2.5">
          {/* Desktop compact Search bar */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-black/[0.08] bg-white/85 text-ink-600 shadow-[0_1px_2px_rgba(18,20,26,0.05)] transition-all duration-200 hover:border-black/[0.14] hover:bg-white active:scale-[0.98] lg:flex xl:w-[216px] xl:justify-start xl:gap-2 xl:px-3"
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

          {/* Mobile: Search icon + Categories Drawer trigger + Role switcher */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex size-9 items-center justify-center rounded-full border border-black/[0.08] bg-white/85 text-ink-900 shadow-[0_1px_2px_rgba(18,20,26,0.05)] transition-colors hover:bg-white active:scale-95 lg:hidden"
            aria-label={STATIC_PLACEHOLDER}
          >
            <Search className="size-4" strokeWidth={2.1} />
          </button>
          <Suspense fallback={<div className="h-9 w-[74px] lg:hidden" />}>
            <MobileCategoriesTrigger />
          </Suspense>
          <HeaderRoleSwitcher />
        </div>
      </div>
    </header>
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
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.14 } }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-[calc(100%+8px)] left-1/2 z-50 w-[760px] max-w-[calc(100vw-32px)] -translate-x-1/2 overflow-hidden rounded-[24px] border border-black/[0.08] bg-white/95 p-5 shadow-[0_24px_60px_-12px_rgba(18,20,26,0.22)] backdrop-blur-xl"
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

/* ─────────────────── Mobile Categories & Navigation Drawer ─────────────────── */

function MobileCategoriesTrigger() {
  const pathname = usePathname() ?? "/";
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const open = openForPath === pathname;
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenForPath(pathname)}
        aria-expanded={open}
        aria-label="Categories aur menu kholein"
        className={cn(
          "inline-flex h-9 items-center gap-1 rounded-full border px-2.5 text-[12px] font-bold shadow-[0_1px_2px_rgba(18,20,26,0.05)] transition-colors active:scale-95 lg:hidden",
          pathname.startsWith("/category")
            ? "border-ink-900 bg-ink-900 text-white"
            : "border-black/[0.08] bg-white/85 text-ink-900 hover:bg-white",
        )}
      >
        <LayoutGrid className="size-3.5 text-indigo-600" strokeWidth={2.2} />
        <span className="hidden min-[410px]:inline">Categories</span>
        <span className="min-[410px]:hidden">Menu</span>
      </button>
      {mounted && createPortal(<AnimatePresence>{open && <MobileNavDrawer onClose={() => setOpenForPath(null)} />}</AnimatePresence>, document.body)}
    </>
  );
}

function MobileNavDrawer({ onClose }: { onClose: () => void }) {
  const pathname = usePathname() ?? "/";
  const categories = useStore((s) => s.categories);
  const activeCats = useMemo(
    () => categories.filter((c) => c.active).sort((a, b) => a.order - b.order),
    [categories],
  );

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

  const navLinks = [
    { href: "/", label: "Home", active: pathname === "/" },
    { href: "/search?tab=shops", label: "Explore Shops", active: pathname.startsWith("/search") },
    { href: "/offers", label: "Aaj ke Offers", active: pathname.startsWith("/offers") },
    { href: "/passes", label: "My VIP Passes", active: pathname.startsWith("/passes") },
  ];

  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Categories aur navigation">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink-900/45 backdrop-blur-xs"
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={spring.default}
        className="absolute inset-y-0 right-0 flex w-[88vw] max-w-[360px] flex-col bg-surface shadow-2xl"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-hairline px-4">
          <BrandLockup size="sm" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Band karein"
            className="flex size-9 items-center justify-center rounded-full bg-sunk text-ink-900 active:scale-95"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mb-5 grid grid-cols-2 gap-2">
            {navLinks.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={onClose}
                className={cn(
                  "flex h-10 items-center justify-center rounded-xl border text-[13px] font-bold transition-colors",
                  n.active
                    ? "border-ink-900 bg-ink-900 text-white"
                    : "border-hairline bg-canvas text-ink-900 hover:bg-sunk",
                )}
              >
                {n.label}
              </Link>
            ))}
          </div>

          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-[0.06em] text-ink-500 uppercase">Categories</span>
            <Link href="/search" onClick={onClose} className="text-[12px] font-bold text-indigo-600">
              All Filters →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {activeCats.map((cat) => {
              const Icon = GLYPHS[cat.glyph] ?? Store;
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-2.5 rounded-[14px] border border-black/[0.06] bg-white p-2 shadow-1 active:scale-[0.98]"
                >
                  <div className={cn("relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px]", WASH_BG[cat.wash])}>
                    {cat.imageKey ? (
                      <RetailImage imageKey={cat.imageKey} size="thumb" wash={cat.wash} alt="" className="size-full rounded-[10px]" />
                    ) : (
                      <Icon className="size-4 text-ink-800" strokeWidth={1.8} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="line-clamp-2 text-[12px] leading-[15px] font-bold text-ink-900">{cat.name}</div>
                    {cat.nameHi && (
                      <div lang="hi" className="mt-0.5 font-deva text-[10.5px] font-medium text-ink-500">
                        {cat.nameHi}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 border-t border-hairline bg-canvas p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          <ButtonLink
            href="/list-your-shop"
            variant="primary-flame"
            size="md"
            full
            onClick={onClose}
            icon={<Store className="size-4" />}
          >
            Apni Dukaan List Karein
          </ButtonLink>
        </div>
      </motion.div>
    </div>
  );
}
