"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, BadgePercent, Flame, LayoutGrid, Store, Timer } from "lucide-react";
import { useMemo, useState } from "react";
import { useStore } from "@/store";
import { searchOffers, searchShops } from "@/store/selectors";
import { daysLeft, formatINR } from "@/lib/format";
import { cn } from "@/lib/cn";
import { spring, stagger } from "@/lib/motion";
import { SectionHeader, Skeleton } from "@/components/ui/misc";
import { BlurEntrance, ScrollBlurSection } from "@/components/ui/scroll-reveal";
import { Hydrated } from "@/components/shell/hydrated";
import { RetailImage } from "@/components/media/retail-image";
import type { ImageKey } from "@/data/images";
import { CategoryStrip } from "./category-strip";
import { CategoryTile } from "./category-tile";
import { OfferCard, OfferCardSkeleton, ribbonLabel } from "./offer-card";
import { ShopCoverCard } from "./shop-cover-card";
import { ReelCard } from "./reel-card";
import { Rail } from "./rail";
import { FollowSheet } from "./follow-sheet";
import { useDiscoveryCtx, useLookups } from "./hooks";

type JumpSection = "offers" | "shops" | "categories";

const JUMP_OPTIONS: { id: JumpSection; targetId: string; label: string; icon: typeof BadgePercent }[] = [
  { id: "offers", targetId: "home-offers", label: "Offers", icon: BadgePercent },
  { id: "shops", targetId: "home-shops", label: "Shops", icon: Store },
  { id: "categories", targetId: "home-categories", label: "Categories", icon: LayoutGrid },
];

/** Buyer Home — calm frosted bazaar aesthetic with Apple scroll-blur choreography. */
export function HomeView() {
  return (
    <Hydrated fallback={<HomeSkeleton />}>
      <HomeContent />
    </Hydrated>
  );
}

function BazaarBand({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative pt-3 pb-6 lg:pt-5 lg:pb-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-[100dvw] -translate-x-1/2 bg-[linear-gradient(180deg,#FFF5D6_0%,#FFF8E7_44%,var(--color-canvas)_100%)]"
      />
      {children}
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div aria-busy>
      <BazaarBand>
        <div className="mb-4 flex items-center justify-between gap-3">
          <Skeleton className="h-10 w-[260px] rounded-full" />
        </div>
        <div className="grid grid-cols-1 gap-3 [&>*]:min-w-0 lg:grid-cols-12 lg:gap-4">
          <Skeleton className="h-[240px] rounded-[28px] lg:col-span-8 lg:h-[340px]" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:gap-4">
            <Skeleton className="h-[126px] rounded-[24px] lg:h-[162px]" />
            <Skeleton className="h-[126px] rounded-[24px] lg:h-[162px]" />
          </div>
        </div>
      </BazaarBand>
      <div className="mt-2 grid grid-cols-4 gap-3 md:grid-cols-5 lg:grid-cols-10">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
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
  const [activeJump, setActiveJump] = useState<JumpSection>("offers");

  const areaName = locById[buyerLocation.areaId]?.name ?? "Akurdi";
  const scope = useMemo(() => ({ originAreaId: buyerLocation.areaId, radiusKm: buyerLocation.radiusKm }), [buyerLocation]);

  const categories = useMemo(() => ctx.categories.filter((c) => c.active).sort((a, b) => a.order - b.order), [ctx.categories]);

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

  const jumpTo = (opt: (typeof JUMP_OPTIONS)[number]) => {
    setActiveJump(opt.id);
    document.getElementById(opt.targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col gap-10 pb-6 lg:gap-14">
      <BazaarBand>
        {/* Clean single segmented switcher above hero — fits 390px with zero clipping */}
        <BlurEntrance className="mb-4 flex items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Marketplace sections"
            className="inline-flex items-center gap-1 rounded-full border border-black/[0.06] bg-white/80 p-1 shadow-[0_2px_12px_-4px_rgba(18,20,26,0.08)] backdrop-blur-xl"
          >
            {JUMP_OPTIONS.map((opt) => {
              const active = activeJump === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => jumpTo(opt)}
                  className={cn(
                    "relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-bold whitespace-nowrap transition-colors duration-200",
                    active ? "text-white" : "text-ink-700 hover:text-ink-900",
                  )}
                >
                  {active && <motion.span layoutId="home-jump-pill" transition={spring.pill} className="absolute inset-0 rounded-full bg-ink-900" />}
                  <Icon className={cn("relative size-3.5", active ? "text-saffron-400" : "text-ink-500")} strokeWidth={2.2} />
                  <span className="relative">{opt.label}</span>
                </button>
              );
            })}
          </div>
          <span className="hidden text-[12.5px] font-medium text-ink-500 md:inline">
            <b className="font-bold text-ink-900">{areaName}</b> · verified local shops & live offers
          </span>
        </BlurEntrance>

        <BlurEntrance delay={0.04}>
          <HeroBento />
        </BlurEntrance>

        {/* Calm non-sticky quick intent chips below hero */}
        <BlurEntrance delay={0.08} className="mt-4">
          <CategoryStrip />
        </BlurEntrance>
      </BazaarBand>

      {/* Category Window */}
      <ScrollBlurSection id="home-categories" aria-labelledby="cat-window" className="-mt-4 scroll-mt-24 rounded-[28px] border border-black/[0.05] bg-white/95 p-5 shadow-soft lg:-mt-6 lg:p-6">
        <SectionHeader eyebrow="10 categories · aas-paas" title={<span id="cat-window">Kya dhoondh rahe hain?</span>} className="mb-4" />
        <motion.ul variants={stagger.container} initial="hidden" animate="show" className="grid grid-cols-4 gap-x-2.5 gap-y-4 md:grid-cols-5 lg:grid-cols-10 lg:gap-4">
          {categories.map((c, i) => (
            <motion.li key={c.id} variants={i < 8 ? stagger.item : undefined}>
              <CategoryTile category={c} />
            </motion.li>
          ))}
        </motion.ul>
      </ScrollBlurSection>

      {/* Flash deals */}
      <ScrollBlurSection id="home-offers" className="scroll-mt-24">
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
          itemClassName="w-[44%] min-w-[162px] md:w-[230px] lg:w-[260px]"
        >
          {flash.map((r, i) => (
            <OfferCard key={r.offer.id} offer={r.offer} shop={r.shop} category={catById[r.offer.categoryId]} distanceKm={r.distanceKm} size="sm" priority={i < 4} className="h-full w-full" />
          ))}
        </Rail>
      </ScrollBlurSection>

      {/* Reels */}
      {reelList.length > 0 && (
        <ScrollBlurSection id="reels" className="scroll-mt-24">
          <Rail id="reels-title" eyebrow="Dukaanon aur local creators se" title="Local Reels" itemClassName="">
            {reelList.map((r) => (
              <ReelCard key={r.id} size="lg" reel={r} shop={ctx.shops[r.shopId]} category={catById[ctx.shops[r.shopId].categoryId]} href={`/?reel=${r.id}`} />
            ))}
          </Rail>
        </ScrollBlurSection>
      )}

      {/* Showroom offers grid */}
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
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 md:gap-4 xl:grid-cols-4 xl:gap-5">
          {showroom.slice(0, 8).map((r) => (
            <div key={r.offer.id} className="h-full min-w-0">
              <OfferCard offer={r.offer} shop={r.shop} category={catById[r.offer.categoryId]} distanceKm={r.distanceKm} className="h-full" />
            </div>
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
          {nearbyShops.map((r) => (
            <ShopCoverCard
              key={r.shop.id}
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
          ))}
        </div>
      </ScrollBlurSection>

      <FollowSheet key={followShopId ?? "none"} shop={followShopId ? ctx.shops[followShopId] : null} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}

/* ─────────────────────────── Hero bento ─────────────────────────── */

function HeroBento() {
  const shops = useStore((s) => s.shops);
  const offers = useStore((s) => s.offers);
  const categories = useStore((s) => s.categories);
  const hero = shops["shop-lsc"];
  const heroOffer = offers["shop-lsc-o1"];
  const heroFrom = offers["shop-lsc-o2"];
  const mithai = offers["shop-msb-o1"];
  const mobileShop = shops["shop-osm"];
  const mobileOffer = offers["shop-osm-o1"];
  const left = daysLeft(heroOffer?.validTill);
  const mobileCat = categories.find((c) => c.id === "cat-mobile");
  const mithaiShop = shops["shop-msb"];

  return (
    <div className="grid grid-cols-1 gap-3.5 [&>*]:min-w-0 lg:grid-cols-12 lg:gap-5">
      <Link
        href={hero ? `/shop/${hero.slug}${heroOffer ? `?offer=${heroOffer.id}&src=card` : "?src=card"}` : "/offers"}
        className="group relative flex min-h-[250px] overflow-hidden rounded-[28px] bg-[linear-gradient(118deg,#FFC629_0%,#FF9A3D_55%,#FF6A3D_100%)] shadow-lift ring-1 ring-white/40 ring-inset transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 active:scale-[0.99] lg:col-span-8 lg:min-h-[340px]"
      >
        <div className="relative z-10 flex w-[62%] flex-col justify-between p-5 lg:w-[54%] lg:p-9">
          <div>
            <span className="inline-flex min-h-[26px] items-center rounded-full bg-ink-900 px-2.5 py-1 text-[10px] font-bold tracking-[0.07em] whitespace-nowrap text-saffron-400 uppercase lg:px-3 lg:text-[11px]">
              Lagna Season Sale
            </span>
            <h1 className="mt-3 text-[25px] leading-[28px] font-extrabold tracking-[-0.025em] text-ink-900 lg:text-[48px] lg:leading-[50px]">
              Silk sarees par <span className="whitespace-nowrap">flat 20% off</span>
            </h1>
            <p className="mt-2 text-[12.5px] leading-[17px] font-semibold text-ink-900/75 lg:text-[15px]">
              {hero?.name ?? "Laxmi Saree Centre"}, Akurdi{left != null ? ` · Sirf ${left} din` : ""}
            </p>
          </div>
          <div className="mt-4 flex flex-col items-start gap-2 md:flex-row md:flex-wrap md:items-center md:gap-2.5">
            {heroFrom?.price != null && (
              <span className="tabular inline-flex items-center rounded-full bg-white/85 px-3 py-1 text-[12px] font-bold whitespace-nowrap text-ink-900 backdrop-blur-md lg:py-1.5 lg:text-[15px]">
                Paithani {formatINR(heroFrom.price)} se
              </span>
            )}
            <span className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-ink-900 px-4 text-[13px] font-bold whitespace-nowrap text-white shadow-[0_8px_20px_-8px_rgba(18,20,26,0.7)] lg:h-12 lg:px-5 lg:text-[14px]">
              Offer Dekhein <ArrowRight className="size-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1" />
            </span>
          </div>
        </div>
        {/* Cutout hero: glow disc + layered sarees */}
        <div aria-hidden className="absolute top-1/2 right-[2%] aspect-square w-[44%] -translate-y-1/2 rounded-full bg-white/35 lg:right-[6%] lg:w-[40%]" />
        <div aria-hidden className="absolute top-[18%] right-[28%] aspect-square w-[14%] rounded-full bg-white/20 lg:right-[38%] lg:w-[10%]" />
        <RetailImage
          imageKey={"p-paithani" as ImageKey}
          mode="cover"
          size="cover"
          wash="cream"
          alt="Yeola Paithani silk saree"
          priority
          zoom
          className="absolute right-[-6%] bottom-[-4%] h-[92%] w-[48%] bg-transparent lg:right-[2%] lg:bottom-[-6%] lg:h-[108%] lg:w-[44%]"
        />
        <RetailImage
          imageKey={"p-bridal-saree" as ImageKey}
          mode="cover"
          size="card"
          wash="cream"
          alt=""
          priority
          className="absolute right-[30%] bottom-[-8%] hidden h-[62%] w-[24%] -rotate-6 bg-transparent lg:block"
        />
        <span className="tabular absolute top-3.5 right-3.5 z-10 flex size-[60px] rotate-[8deg] flex-col items-center justify-center rounded-full bg-flame-500 text-white shadow-2 ring-4 ring-white/40 lg:top-6 lg:right-6 lg:size-[92px]">
          <span className="text-[19px] leading-none font-extrabold lg:text-[32px]">20%</span>
          <span className="text-[9.5px] font-bold tracking-[0.08em] lg:text-[11px]">OFF</span>
        </span>
      </Link>

      {/* Spacious full-width promo stack on mobile (390px), 2-col on tablet, stacked right rail on desktop */}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:gap-5">
        <PromoCard
          href={mithaiShop ? `/shop/${mithaiShop.slug}${mithai ? `?offer=${mithai.id}&src=card` : "?src=card"}` : "/category/bakery-mithai"}
          imageKey="p-kaju-katli"
          eyebrow="Mithai & Bakery"
          title={mithai?.price != null ? `Kaju Katli ${formatINR(mithai.price)}/kg` : "Mithai offers"}
          sub={mithaiShop ? `${mithaiShop.name}, Chinchwad` : undefined}
          wash="peach"
        />
        <PromoCard
          href={mobileCat ? `/category/${mobileCat.slug}` : "/offers"}
          imageKey="p-phone-covers"
          eyebrow="Mobile Accessories"
          title={mobileOffer?.price != null ? `${formatINR(299)} ke andar` : "Accessories deals"}
          sub={mobileShop ? `Screen guard ${formatINR(mobileOffer?.price ?? 199)} · ${mobileShop.name}` : undefined}
          wash="sky"
        />
      </div>
    </div>
  );
}

const PROMO_TONE = {
  peach: { bg: "bg-[#FFDDC8]", eyebrow: "text-flame-700", cta: "bg-flame-600" },
  sky: { bg: "bg-[#D4E4FF]", eyebrow: "text-indigo-700", cta: "bg-indigo-600" },
} as const;

/** Instamart-style banner card: saturated tint, roomy text left, big cutout right, pill CTA. */
function PromoCard({ href, imageKey, eyebrow, title, sub, wash }: { href: string; imageKey: ImageKey; eyebrow: string; title: string; sub?: string; wash: "peach" | "sky" }) {
  const t = PROMO_TONE[wash];
  return (
    <Link
      href={href}
      className={`group relative flex min-h-[136px] overflow-hidden rounded-[24px] ${t.bg} shadow-soft ring-1 ring-white/50 ring-inset transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_14px_34px_-10px_rgba(18,20,26,0.12)] active:scale-[0.98] lg:min-h-[162px]`}
    >
      <div className="relative z-10 flex w-[62%] flex-col justify-between p-4 lg:w-[56%] lg:p-5">
        <div>
          <span className={`block text-[10.5px] font-extrabold tracking-[0.08em] whitespace-nowrap uppercase ${t.eyebrow}`}>{eyebrow}</span>
          <span className="mt-1 block font-display text-[19px] leading-[23px] font-extrabold tracking-[-0.015em] text-ink-900 lg:text-[21px] lg:leading-[24px]">{title}</span>
          {sub && <span className="mt-1 line-clamp-2 block text-[12px] leading-[16px] text-ink-700">{sub}</span>}
        </div>
        <span className={`mt-2.5 inline-flex h-8 w-fit items-center gap-1 rounded-full px-3.5 text-[11.5px] font-extrabold tracking-[0.03em] whitespace-nowrap text-white uppercase ${t.cta}`}>
          Dekhein <ArrowRight className="size-3.5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5" />
        </span>
      </div>
      <RetailImage imageKey={imageKey} mode="cover" size="card" wash="cream" alt="" priority zoom className="absolute right-[-2%] bottom-0 h-[108%] w-[44%] bg-transparent lg:-right-[6%] lg:h-[112%] lg:w-[52%]" />
    </Link>
  );
}
