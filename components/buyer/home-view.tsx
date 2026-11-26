"use client";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Flame, LayoutGrid, Sparkles, Timer } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/store";
import { searchOffers, searchShops } from "@/store/selectors";
import { daysLeft, formatINR } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ease, spring } from "@/lib/motion";
import { SectionHeader, Skeleton } from "@/components/ui/misc";
import { AppearItem, BlurEntrance, ScrollBlurSection } from "@/components/ui/scroll-reveal";
import { Hydrated } from "@/components/shell/hydrated";
import { RetailImage } from "@/components/media/retail-image";
import type { ImageKey } from "@/data/images";
import type { Category } from "@/lib/types";
import { CategoryStrip } from "./category-strip";
import { CategoryTile } from "./category-tile";
import { OfferCard, OfferCardSkeleton, ribbonLabel } from "./offer-card";
import { ShopCoverCard } from "./shop-cover-card";
import { ReelCard } from "./reel-card";
import { Rail } from "./rail";
import { FollowSheet } from "./follow-sheet";
import { useDiscoveryCtx, useLookups } from "./hooks";

type CatGroup = "all" | "daily" | "fashion" | "tech";

const CAT_GROUPS: { id: CatGroup; label: string; slugs?: string[] }[] = [
  { id: "all", label: "Sabhi (10)" },
  { id: "daily", label: "Daily", slugs: ["kirana", "bakery-mithai", "medical-chemist", "stationery-gifts"] },
  { id: "fashion", label: "Fashion", slugs: ["saree-readymade", "footwear-bags", "jewellers-imitation"] },
  { id: "tech", label: "Tech & Care", slugs: ["mobile-repair", "hardware-electricals", "salon-parlour"] },
];

const AUTO_ADVANCE_MS = 4500;

/** Buyer Home — structured, decluttered marketplace with auto-swiping hero spotlight & clear categorized discovery. */
export function HomeView() {
  return (
    <Hydrated fallback={<HomeSkeleton />}>
      <HomeContent />
    </Hydrated>
  );
}

function BazaarBand({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative pt-2 pb-5 lg:pt-5 lg:pb-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 bottom-0 left-1/2 -z-10 w-[100dvw] -translate-x-1/2 bg-[linear-gradient(180deg,#FFF3D1_0%,#FFF8E7_56%,rgba(255,255,255,0)_100%)]"
      />
      {children}
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div aria-busy>
      <BazaarBand>
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-6 w-44 rounded-full" />
        </div>
        <Skeleton className="h-[224px] rounded-[26px] lg:hidden" />
        <div className="hidden grid-cols-12 gap-5 lg:grid">
          <Skeleton className="col-span-8 h-[340px] rounded-[28px]" />
          <div className="col-span-4 flex flex-col gap-5">
            <Skeleton className="h-[160px] rounded-[24px]" />
            <Skeleton className="h-[160px] rounded-[24px]" />
          </div>
        </div>
      </BazaarBand>
      <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-[76px] rounded-[20px] lg:h-[136px]" />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <OfferCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function HomeContent() {
  const ctx = useDiscoveryCtx();
  const { catById, locById } = useLookups();
  const reels = useStore((s) => s.reels);
  const buyerLocation = useStore((s) => s.buyerLocation);
  const [followShopId, setFollowShopId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [catGroup, setCatGroup] = useState<CatGroup>("all");

  const areaName = locById[buyerLocation.areaId]?.name ?? "Akurdi";
  const scope = useMemo(() => ({ originAreaId: buyerLocation.areaId, radiusKm: buyerLocation.radiusKm }), [buyerLocation]);

  const categories = useMemo(() => ctx.categories.filter((c) => c.active).sort((a, b) => a.order - b.order), [ctx.categories]);
  const filteredCats = useMemo(() => {
    const grp = CAT_GROUPS.find((g) => g.id === catGroup);
    if (!grp?.slugs) return categories;
    return categories.filter((c) => grp.slugs!.includes(c.slug));
  }, [categories, catGroup]);

  const flash = useMemo(() => {
    const near = searchOffers(ctx, { ...scope, kind: "offer", sort: "ending" });
    return (near.length >= 4 ? near : searchOffers(ctx, { kind: "offer", originAreaId: scope.originAreaId, sort: "ending" })).slice(0, 10);
  }, [ctx, scope]);

  const showroom = useMemo(() => {
    const near = searchOffers(ctx, { ...scope, minDiscount: 10, sort: "discount" });
    return (near.length >= 6 ? near : searchOffers(ctx, { originAreaId: scope.originAreaId, minDiscount: 10, sort: "discount" })).slice(0, 10);
  }, [ctx, scope]);

  const nearbyShops = useMemo(() => {
    const near = searchShops(ctx, { ...scope, sort: "nearest" });
    return (near.length >= 3 ? near : searchShops(ctx, { originAreaId: scope.originAreaId, sort: "nearest" })).slice(0, 6);
  }, [ctx, scope]);

  const reelList = useMemo(() => Object.values(reels).filter((r) => ctx.shops[r.shopId]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [reels, ctx.shops]);

  const topDealFor = (shopId: string) => {
    const best = Object.values(ctx.offers)
      .filter((o) => o.shopId === shopId && o.status === "live")
      .sort((a, b) => (b.discountPct ?? 0) - (a.discountPct ?? 0))[0];
    return best ? ribbonLabel(best) : undefined;
  };

  return (
    <div className="flex flex-col gap-9 pb-6 lg:gap-14">
      <BazaarBand>
        <BlurEntrance>
          <SpotlightHero areaName={areaName} />
        </BlurEntrance>
      </BazaarBand>

      {/* Categorized Shop Directory — prominent & immediately discoverable on screen 1 */}
      <ScrollBlurSection
        id="home-categories"
        aria-labelledby="cat-window"
        className="-mt-3 scroll-mt-24 lg:-mt-6 lg:rounded-[28px] lg:border lg:border-black/[0.06] lg:bg-white lg:p-6 lg:shadow-[0_8px_30px_-12px_rgba(90,42,0,0.08)]"
      >
        <div className="mb-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-[0.07em] text-flame-600 uppercase">
              <LayoutGrid className="size-3.5" /> Browse by Category
            </span>
            <h2 id="cat-window" className="mt-0.5 text-[20px] leading-[25px] font-extrabold tracking-[-0.015em] text-ink-900 lg:text-[24px]">
              Kya dhoondh rahe hain?
            </h2>
          </div>
          <Link href="/search?tab=shops" className="shrink-0 text-[13px] font-bold whitespace-nowrap text-indigo-600 hover:text-indigo-700">
            Sab dukaanein →
          </Link>
        </div>

        {/* Interactive Category Group Selector — fits cleanly in one single mobile row */}
        <div
          role="tablist"
          aria-label="Category groups"
          className="no-scrollbar -mx-1 mb-3.5 flex gap-1.5 overflow-x-auto px-1 py-0.5"
        >
          {CAT_GROUPS.map((g) => {
            const active = catGroup === g.id;
            return (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCatGroup(g.id)}
                className={cn(
                  "relative inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-[12px] font-bold whitespace-nowrap transition-colors lg:px-3.5 lg:text-[12.5px]",
                  active
                    ? "border-transparent text-white shadow-[0_4px_12px_-3px_rgba(236,70,19,0.4)]"
                    : "border-[#EADEC6] bg-white text-[#5C5044] hover:border-[#D9C7A3] hover:text-ink-900",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="home-cat-group"
                    transition={spring.pill}
                    className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,#FF8A2B_0%,#EC4613_100%)]"
                  />
                )}
                <span className="relative">{g.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bigger 2-col cards on mobile, symmetrical 5-col showcase on desktop */}
        <AnimatePresence mode="wait">
          <motion.ul
            key={catGroup}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: ease.out }}
            className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-5 lg:gap-3.5"
          >
            {filteredCats.map((c: Category, i: number) => (
              <li key={c.id}>
                <AppearItem index={i} immediate>
                  <CategoryTile category={c} layout="card" />
                </AppearItem>
              </li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </ScrollBlurSection>

      {/* Flash deals + integrated quick intent filters */}
      <ScrollBlurSection id="home-offers" className="scroll-mt-24">
        <CategoryStrip className="mb-4" />
        <Rail
          id="flash"
          eyebrow={
            <span className="inline-flex items-center gap-1 text-flame-600">
              <Timer className="size-3.5" strokeWidth={2.25} /> Jaldi khatam ho rahe hain
            </span>
          }
          title={
            <span className="inline-flex items-center gap-2">
              Aaj ki Flash Deals <Flame className="size-5 fill-flame-500 text-flame-500" />
            </span>
          }
          action={
            <Link href="/offers?sort=ending" className="mr-1 text-[14px] font-bold text-indigo-600 hover:text-indigo-700">
              Sab dekhein
            </Link>
          }
          itemClassName="w-[74%] min-w-[268px] max-w-[300px] md:w-[260px] lg:w-[276px]"
        >
          {flash.map((r, i) => (
            <AppearItem key={r.offer.id} index={i} className="h-full w-full">
              <OfferCard offer={r.offer} shop={r.shop} category={catById[r.offer.categoryId]} distanceKm={r.distanceKm} priority={i < 4} className="h-full w-full" />
            </AppearItem>
          ))}
        </Rail>
      </ScrollBlurSection>

      {/* Reels */}
      {reelList.length > 0 && (
        <ScrollBlurSection id="reels" className="scroll-mt-24">
          <Rail id="reels-title" eyebrow="Dukaanon aur local creators se" title="Local Reels" itemClassName="">
            {reelList.map((r, i) => (
              <AppearItem key={r.id} index={i}>
                <ReelCard size="lg" reel={r} shop={ctx.shops[r.shopId]} category={catById[ctx.shops[r.shopId].categoryId]} href={`/?reel=${r.id}`} />
              </AppearItem>
            ))}
          </Rail>
        </ScrollBlurSection>
      )}

      {/* Showroom offers grid — generous full-width cards on phones */}
      <ScrollBlurSection aria-labelledby="showroom" className="scroll-mt-24">
        <SectionHeader
          eyebrow={`${areaName} ke ${buyerLocation.radiusKm} km mein`}
          title={<span id="showroom">Top Showroom Offers Near {areaName}</span>}
          action={
            <Link href="/offers" className="text-[14px] font-bold text-indigo-600 hover:text-indigo-700">
              Sab offers
            </Link>
          }
          className="mb-4"
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5">
          {showroom.slice(0, 8).map((r, i) => (
            <AppearItem key={r.offer.id} index={i} className="h-full min-w-0">
              <OfferCard offer={r.offer} shop={r.shop} category={catById[r.offer.categoryId]} distanceKm={r.distanceKm} className="h-full" />
            </AppearItem>
          ))}
        </div>
      </ScrollBlurSection>

      {/* Nearby shops */}
      <ScrollBlurSection id="home-shops" aria-labelledby="nearby" className="scroll-mt-24" exitFade={false}>
        <SectionHeader
          eyebrow="Verified & local"
          title={<span id="nearby">Aas-paas ki Dukaanein</span>}
          action={
            <Link href="/search?tab=shops" className="text-[14px] font-bold text-indigo-600 hover:text-indigo-700">
              Sab dukaanein
            </Link>
          }
          className="mb-4"
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {nearbyShops.map((r, i) => (
            <AppearItem key={r.shop.id} index={i} className="h-full min-w-0">
              <ShopCoverCard
                shop={r.shop}
                category={catById[r.shop.categoryId]}
                areaName={locById[r.shop.areaId]?.name ?? ""}
                distanceKm={r.distanceKm}
                topDeal={topDealFor(r.shop.id)}
                liveOffers={r.liveOfferCount}
                className="h-full"
                onFollow={() => {
                  setFollowShopId(r.shop.id);
                  setSheetOpen(true);
                }}
              />
            </AppearItem>
          ))}
        </div>
      </ScrollBlurSection>

      <FollowSheet key={followShopId ?? "none"} shop={followShopId ? ctx.shops[followShopId] : null} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}

/* ─────────────────── Spotlight Hero: Auto-Swiping Mobile Carousel + Desktop Bento ─────────────────── */

interface SpotlightSlide {
  id: string;
  href: string;
  badge: string;
  badgeTone: string;
  title: string;
  sub: string;
  priceChip?: string;
  cta: string;
  bg: string;
  imageKey: ImageKey;
  imageAlt: string;
  cornerPill?: { top: string; bottom: string };
}

function SpotlightHero({ areaName }: { areaName: string }) {
  const shops = useStore((s) => s.shops);
  const offers = useStore((s) => s.offers);
  const categories = useStore((s) => s.categories);
  const hero = shops["shop-lsc"];
  const heroOffer = offers["shop-lsc-o1"];
  const heroFrom = offers["shop-lsc-o2"];
  const mithai = offers["shop-msb-o1"];
  const mithaiShop = shops["shop-msb"];
  const mobileShop = shops["shop-osm"];
  const mobileOffer = offers["shop-osm-o1"];
  const mobileCat = categories.find((c) => c.id === "cat-mobile");
  const left = daysLeft(heroOffer?.validTill);

  const slides: SpotlightSlide[] = [
    {
      id: "saree",
      href: hero ? `/shop/${hero.slug}${heroOffer ? `?offer=${heroOffer.id}&src=card` : "?src=card"}` : "/offers",
      badge: "Lagna Season Sale",
      badgeTone: "bg-ink-900 text-saffron-400",
      title: "Silk sarees par flat 20% off",
      sub: `${hero?.name ?? "Laxmi Saree Centre"}, Akurdi${left != null ? ` · Sirf ${left} din` : ""}`,
      priceChip: heroFrom?.price != null ? `Paithani ${formatINR(heroFrom.price)} se` : undefined,
      cta: "Offer Dekhein",
      bg: "bg-[linear-gradient(122deg,#FFC629_0%,#FF9A3D_55%,#FF6A3D_100%)]",
      imageKey: "p-paithani",
      imageAlt: "Yeola Paithani silk saree",
      cornerPill: { top: "20%", bottom: "OFF" },
    },
    {
      id: "mithai",
      href: mithaiShop ? `/shop/${mithaiShop.slug}${mithai ? `?offer=${mithai.id}&src=card` : "?src=card"}` : "/category/bakery-mithai",
      badge: "Mithai & Bakery",
      badgeTone: "bg-flame-600 text-white",
      title: mithai?.price != null ? `Fresh Kaju Katli ${formatINR(mithai.price)}/kg` : "Fresh Festive Mithai",
      sub: mithaiShop ? `${mithaiShop.name}, Chinchwad` : "Pure ghee sweets & bakery",
      priceChip: mithai?.mrp ? `MRP ${formatINR(mithai.mrp)}` : "Daily Fresh Stock",
      cta: "Explore Mithai",
      bg: "bg-[linear-gradient(125deg,#FFE3CF_0%,#FFC19C_100%)]",
      imageKey: "p-kaju-katli",
      imageAlt: "Fresh Kaju Katli tray",
      cornerPill: { top: "19%", bottom: "OFF" },
    },
    {
      id: "mobile",
      href: mobileCat ? `/category/${mobileCat.slug}` : "/offers",
      badge: "Mobile Accessories",
      badgeTone: "bg-indigo-600 text-white",
      title: "Phone Covers & Tempered Glass",
      sub: mobileShop ? `Screen guard ${formatINR(mobileOffer?.price ?? 199)} · ${mobileShop.name}` : "Printed & silicone covers",
      priceChip: `Deals under ${formatINR(299)}`,
      cta: "Shop Deals",
      bg: "bg-[linear-gradient(125deg,#DCE9FF_0%,#B4CEFF_100%)]",
      imageKey: "p-phone-covers",
      imageAlt: "Designer phone back covers",
      cornerPill: { top: "₹199", bottom: "STARTS" },
    },
  ];

  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (paused || reduce) return;
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [paused, reduce, slides.length, slide]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    touchStart.current = { x: t.clientX, y: t.clientY };
    setPaused(true);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    const t = e.changedTouches[0];
    touchStart.current = null;
    setPaused(false);
    if (!start || !t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.15) {
      setSlide((s) => (dx < 0 ? (s + 1) % slides.length : (s - 1 + slides.length) % slides.length));
    }
  };

  return (
    <div>
      {/* Clear Spotlight Section Heading */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-flame-500 text-white shadow-1">
            <Sparkles className="size-3.5" strokeWidth={2.2} />
          </span>
          <h1 className="font-display text-[17px] leading-tight font-extrabold tracking-[-0.015em] text-ink-900 lg:text-[20px]">
            Aaj ke Spotlight Deals
          </h1>
        </div>
        <span className="text-[12px] font-semibold text-ink-600 lg:hidden">
          {slide + 1} / {slides.length} · {areaName}
        </span>
        <span className="hidden text-[13px] font-semibold text-ink-600 lg:inline">
          <b className="font-bold text-ink-900">{areaName}</b> · curated local offers
        </span>
      </div>

      {/* ── MOBILE (< lg): Timed Auto-Swiping Hero Carousel + Dot & Line Indicator ── */}
      <div
        className="lg:hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        role="region"
        aria-roledescription="carousel"
        aria-label="Aaj ke Spotlight Deals"
      >
        <div className="overflow-hidden rounded-[26px] shadow-lift">
          <motion.div
            animate={{ x: `-${slide * 100}%` }}
            transition={{ type: "spring", stiffness: 310, damping: 32, mass: 0.9 }}
            className="flex"
          >
            {slides.map((s) => (
              <Link
                key={s.id}
                href={s.href}
                className={cn(
                  "group relative flex min-h-[228px] w-full shrink-0 overflow-hidden p-5 ring-1 ring-white/45 ring-inset active:scale-[0.995]",
                  s.bg,
                )}
              >
                <div className="relative z-10 flex w-[62%] flex-col justify-between">
                  <div>
                    <span className={cn("inline-flex min-h-[24px] items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold tracking-[0.06em] whitespace-nowrap uppercase", s.badgeTone)}>
                      {s.badge}
                    </span>
                    <h2 className="mt-2.5 font-display text-[22px] leading-[26px] font-extrabold tracking-[-0.02em] text-ink-900">
                      {s.title}
                    </h2>
                    <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-[17px] font-semibold text-ink-900/75">
                      {s.sub}
                    </p>
                  </div>
                  <div className="mt-3.5 flex flex-col items-start gap-2">
                    {s.priceChip && (
                      <span className="tabular inline-flex items-center rounded-full bg-white/88 px-3 py-1 text-[11.5px] font-bold whitespace-nowrap text-ink-900 backdrop-blur-md">
                        {s.priceChip}
                      </span>
                    )}
                    <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink-900 px-4 text-[12.5px] font-bold whitespace-nowrap text-white shadow-[0_8px_18px_-6px_rgba(18,20,26,0.65)]">
                      {s.cta} <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </div>

                {/* Glow backdrop + crisp product visual */}
                <div aria-hidden className="absolute top-1/2 right-[2%] aspect-square w-[44%] -translate-y-1/2 rounded-full bg-white/45" />
                <RetailImage
                  imageKey={s.imageKey}
                  mode="cover"
                  size="cover"
                  wash="cream"
                  alt={s.imageAlt}
                  priority
                  className="absolute right-[-3%] bottom-[2%] h-[82%] w-[44%] bg-transparent"
                />
                {s.cornerPill && (
                  <span className="tabular absolute top-3 right-3 z-10 flex size-[54px] rotate-[6deg] flex-col items-center justify-center rounded-full bg-flame-500 text-white shadow-2 ring-3 ring-white/50">
                    <span className="text-[16px] leading-none font-extrabold">{s.cornerPill.top}</span>
                    <span className="mt-0.5 text-[8px] font-bold tracking-[0.06em]">{s.cornerPill.bottom}</span>
                  </span>
                )}
              </Link>
            ))}
          </motion.div>
        </div>

        {/* Animated Dot + Progress Line Indicator */}
        <div className="mt-3 flex items-center justify-center gap-2" role="tablist" aria-label="Spotlight slides">
          {slides.map((s, idx) => {
            const active = idx === slide;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Slide ${idx + 1}: ${s.title}`}
                onClick={() => setSlide(idx)}
                className="flex h-5 items-center justify-center px-0.5"
              >
                {active ? (
                  <span className="relative h-1.5 w-8 overflow-hidden rounded-full bg-ink-900/15">
                    {reduce || paused ? (
                      <span className="block h-full w-full rounded-full bg-flame-500" />
                    ) : (
                      <motion.span
                        key={slide}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: AUTO_ADVANCE_MS / 1000, ease: "linear" }}
                        style={{ transformOrigin: "0% 50%" }}
                        className="block h-full w-full rounded-full bg-[linear-gradient(90deg,#FF8A2B,#EC4613)]"
                      />
                    )}
                  </span>
                ) : (
                  <span className="size-1.5 rounded-full bg-ink-900/20 transition-colors hover:bg-ink-900/45" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── DESKTOP (lg+): Balanced 8 + 4 Editorial Bento ── */}
      <div className="hidden grid-cols-12 gap-5 [&>*]:min-w-0 lg:grid">
        <Link
          href={slides[0].href}
          className="group relative col-span-8 flex min-h-[340px] overflow-hidden rounded-[28px] bg-[linear-gradient(118deg,#FFC629_0%,#FF9A3D_55%,#FF6A3D_100%)] shadow-lift ring-1 ring-white/40 ring-inset transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 active:scale-[0.99]"
        >
          <div className="relative z-10 flex w-[54%] flex-col justify-between p-9">
            <div>
              <span className="inline-flex min-h-[26px] items-center rounded-full bg-ink-900 px-3 py-1 text-[11px] font-bold tracking-[0.07em] whitespace-nowrap text-saffron-400 uppercase">
                Lagna Season Sale
              </span>
              <h2 className="mt-3 text-[48px] leading-[50px] font-extrabold tracking-[-0.025em] text-ink-900">
                Silk sarees par <span className="whitespace-nowrap">flat 20% off</span>
              </h2>
              <p className="mt-2 text-[15px] font-semibold text-ink-900/75">
                {slides[0].sub}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {slides[0].priceChip && (
                <span className="tabular inline-flex items-center rounded-full bg-white/85 px-3.5 py-1.5 text-[15px] font-bold whitespace-nowrap text-ink-900 backdrop-blur-md">
                  {slides[0].priceChip}
                </span>
              )}
              <span className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-ink-900 px-5 text-[14px] font-bold whitespace-nowrap text-white shadow-[0_8px_20px_-8px_rgba(18,20,26,0.7)]">
                Offer Dekhein <ArrowRight className="size-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1" />
              </span>
            </div>
          </div>
          <div aria-hidden className="absolute top-1/2 right-[6%] aspect-square w-[40%] -translate-y-1/2 rounded-full bg-white/35" />
          <div aria-hidden className="absolute top-[18%] right-[38%] aspect-square w-[10%] rounded-full bg-white/20" />
          <RetailImage
            imageKey="p-paithani"
            mode="cover"
            size="cover"
            wash="cream"
            alt="Yeola Paithani silk saree"
            priority
            zoom
            className="absolute right-[2%] bottom-[-6%] h-[108%] w-[44%] bg-transparent"
          />
          <RetailImage
            imageKey="p-bridal-saree"
            mode="cover"
            size="card"
            wash="cream"
            alt=""
            priority
            className="absolute right-[30%] bottom-[-8%] h-[62%] w-[24%] -rotate-6 bg-transparent"
          />
          <span className="tabular absolute top-6 right-6 z-10 flex size-[92px] rotate-[8deg] flex-col items-center justify-center rounded-full bg-flame-500 text-white shadow-2 ring-4 ring-white/40">
            <span className="text-[32px] leading-none font-extrabold">20%</span>
            <span className="text-[11px] font-bold tracking-[0.08em]">OFF</span>
          </span>
        </Link>

        <div className="col-span-4 grid grid-cols-1 gap-5">
          {slides.slice(1).map((s) => (
            <Link
              key={s.id}
              href={s.href}
              className={cn(
                "group relative flex min-h-[162px] overflow-hidden rounded-[24px] shadow-soft ring-1 ring-white/50 ring-inset transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_14px_34px_-10px_rgba(18,20,26,0.12)] active:scale-[0.98]",
                s.bg,
              )}
            >
              <div className="relative z-10 flex w-[56%] flex-col justify-between p-5">
                <div>
                  <span className="block text-[10.5px] font-extrabold tracking-[0.08em] whitespace-nowrap text-ink-900/70 uppercase">
                    {s.badge}
                  </span>
                  <span className="mt-1 block font-display text-[20px] leading-[23px] font-extrabold tracking-[-0.015em] text-ink-900">
                    {s.title}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-[12px] leading-[16px] text-ink-700">{s.sub}</span>
                </div>
                <span className="mt-2.5 inline-flex h-8 w-fit items-center gap-1 rounded-full bg-white/88 px-3.5 text-[12px] font-bold whitespace-nowrap text-ink-900 shadow-1 backdrop-blur-sm transition-colors group-hover:bg-white">
                  {s.cta} <ArrowRight className="size-3.5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5" />
                </span>
              </div>
              <RetailImage imageKey={s.imageKey} mode="cover" size="card" wash="cream" alt={s.imageAlt} priority zoom className="absolute -right-[6%] bottom-0 h-[112%] w-[52%] bg-transparent" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
