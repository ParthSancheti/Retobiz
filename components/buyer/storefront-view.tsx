"use client";
import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Share2,
  Star,
  Users,
  X,
} from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/store";
import { useUiStore, toast } from "@/store/ui";
import { followerCount, searchShops } from "@/store/selectors";
import type { Category, Offer } from "@/lib/types";
import { cn } from "@/lib/cn";
import { formatCompactIN, formatDistance, timeAgo } from "@/lib/format";
import { haversineKm } from "@/lib/geo";
import { openStatus } from "@/lib/hours";
import { spring } from "@/lib/motion";
import { Hydrated } from "@/components/shell/hydrated";
import { FilterChip } from "@/components/ui/chip";
import { Badge, GoogleBadge, GstBadge, ProBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { LiveFlash, Skeleton } from "@/components/ui/misc";
import { RetailImage } from "@/components/media/retail-image";
import { OfferCard, OfferCardSkeleton, ribbonLabel } from "./offer-card";
import { ReelCard } from "./reel-card";
import { ShopCoverCard } from "./shop-cover-card";
import { ShopMonogram } from "./shop-card";
import { Shutter } from "./shutter";
import { useLookups } from "./hooks";

type Tab = "showroom" | "offers" | "reels" | "about";

const COVER_TINT: Record<Category["wash"], string> = {
  mint: "bg-[linear-gradient(120deg,#E3F6EC_0%,#B3E9CB_100%)]",
  peach: "bg-[linear-gradient(120deg,#FFE9DD_0%,#FFC1A0_100%)]",
  sky: "bg-[linear-gradient(120deg,#E3EEFD_0%,#B5CFFF_100%)]",
  cream: "bg-[linear-gradient(120deg,#FFF6DC_0%,#FFDB73_100%)]",
  lavender: "bg-[linear-gradient(120deg,#EEEAFB_0%,#CDB6FF_100%)]",
};

export function StorefrontView() {
  return (
    <Suspense fallback={<StorefrontSkeleton />}>
      <Hydrated fallback={<StorefrontSkeleton />}>
        <StorefrontKeyed />
      </Hydrated>
    </Suspense>
  );
}

function StorefrontKeyed() {
  const { slug } = useParams<{ slug: string }>();
  return <Storefront key={slug} />;
}

function StorefrontSkeleton() {
  return (
    <div className="pt-4" aria-busy>
      <Skeleton className="h-[230px] rounded-2xl lg:h-[280px]" />
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <OfferCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function Storefront() {
  const { slug } = useParams<{ slug: string }>();
  const params = useSearchParams();
  const pathname = usePathname();
  const shops = useStore((s) => s.shops);
  const offers = useStore((s) => s.offers);
  const reels = useStore((s) => s.reels);
  const categories = useStore((s) => s.categories);
  const subCategories = useStore((s) => s.subCategories);
  const locations = useStore((s) => s.locations);
  const buyerLocation = useStore((s) => s.buyerLocation);
  const activeMerchantShopId = useStore((s) => s.activeMerchantShopId);
  const trackView = useStore((s) => s.trackView);
  const trackQrScan = useStore((s) => s.trackQrScan);
  const seenShutter = useUiStore((s) => s.seenShutterShopIds);
  const markShutterSeen = useUiStore((s) => s.markShutterSeen);
  const openClaim = useUiStore((s) => s.openClaim);
  const { catById, locById } = useLookups();

  const shop = useMemo(() => Object.values(shops).find((s) => s.slug === slug), [shops, slug]);
  const category = shop ? catById[shop.categoryId] : undefined;
  const fromQr = params.get("src") === "qr";
  const ownerMode = params.get("as") === "owner" && shop?.id === activeMerchantShopId;
  const focusOffer = params.get("offer");

  const following = useStore((s) => !!shop && s.buyerPassIds.some((id) => s.customers[id]?.shopId === shop.id));

  // Shutter plays directly on top of already-painted storefront (zero blank white flash).
  const [shutterSeq, setShutterSeq] = useState(0);
  const [shutterOpen, setShutterOpen] = useState(() => !!shop && (fromQr || params.get("src") === "card" || !seenShutter.includes(shop.id)));
  const [shutterDone, setShutterDone] = useState(() => !shutterOpen);

  const tracked = useRef(false);
  useEffect(() => {
    if (!shop || tracked.current) return;
    tracked.current = true;
    trackView(shop.id);
    if (fromQr) trackQrScan(shop.id);
  }, [shop, fromQr, trackView, trackQrScan]);

  const onShutterDone = useCallback(() => {
    if (!shop) return;
    setShutterOpen(false);
    setShutterDone(true);
    markShutterSeen(shop.id);
    if (fromQr && !following && !ownerMode) {
      setTimeout(() => openClaim(shop.id, undefined, "qr"), 550);
    }
  }, [shop, markShutterSeen, fromQr, following, ownerMode, openClaim]);

  const shopOffers = useMemo(() => (shop ? Object.values(offers).filter((o) => o.shopId === shop.id && o.status === "live") : []), [offers, shop]);
  const promos = shopOffers.filter((o) => o.kind === "offer");
  const products = useMemo(() => {
    if (!shop) return [];
    const featured = shop.featuredItemIds.map((id) => offers[id]).filter((o): o is Offer => !!o && o.status === "live");
    const rest = shopOffers.filter((o) => o.kind === "product" && !shop.featuredItemIds.includes(o.id));
    return [...featured, ...rest];
  }, [shop, offers, shopOffers]);
  const shopReels = useMemo(() => (shop ? Object.values(reels).filter((r) => r.shopId === shop.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : []), [reels, shop]);

  const initialTab: Tab = focusOffer && promos.some((o) => o.id === focusOffer) ? "offers" : "showroom";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [q, setQ] = useState("");
  const [sub, setSub] = useState<string | undefined>();

  // Smoothly scroll to a deep-linked offer ONLY after the shutter fully finishes (~900ms).
  const scrolledFocusRef = useRef<string | null>(null);
  useEffect(() => {
    if (!shutterDone || !focusOffer || scrolledFocusRef.current === focusOffer) return;
    scrolledFocusRef.current = focusOffer;
    const t = setTimeout(() => {
      document.getElementById(`offer-${focusOffer}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => clearTimeout(t);
  }, [shutterDone, focusOffer]);

  if (!shop)
    return (
      <EmptyState
        wash="peach"
        title="Yeh dukaan nahi mili"
        body="Shayad link purana hai ya dukaan ne listing band kar di."
        action={
          <ButtonLink href="/" variant="primary-flame" icon={<ArrowLeft className="size-4" />}>
            Explore All Nearby Shops
          </ButtonLink>
        }
        className="py-20"
      />
    );

  const origin = locById[buyerLocation.areaId];
  const distance = origin?.lat != null && origin.lng != null ? haversineKm({ lat: origin.lat, lng: origin.lng }, shop.geo) : undefined;
  const status = openStatus(shop.hours);
  const followers = followerCount(shop);
  const areaName = locById[shop.areaId]?.name ?? "";
  const fullAddress = !areaName || shop.address.toLowerCase().includes(areaName.toLowerCase()) ? shop.address : `${shop.address}, ${areaName}`;
  const subs = subCategories.filter((s) => shop.subCategoryIds.includes(s.id) && s.active);
  const term = q.trim().toLowerCase();
  const filterList = (list: Offer[]) => list.filter((o) => (!sub || o.subCategoryId === sub) && (!term || o.title.toLowerCase().includes(term) || (o.description ?? "").toLowerCase().includes(term)));
  const visible = tab === "offers" ? filterList(promos) : tab === "showroom" ? filterList(products).slice(0, term || sub ? undefined : 10) : [];

  const similar = searchShops({ shops, offers, categories, subCategories, locations }, { originAreaId: buyerLocation.areaId, sort: "nearest" })
    .filter((r) => r.shop.id !== shop.id)
    .sort((a, b) => Number(b.shop.categoryId === shop.categoryId) - Number(a.shop.categoryId === shop.categoryId))
    .slice(0, 3);

  const share = async () => {
    const url = `${window.location.origin}/shop/${shop.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: shop.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast({ message: "Dukaan ka link copy ho gaya", tone: "success" });
      }
    } catch {
      /* user cancelled */
    }
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "showroom", label: "Showroom", count: products.length },
    { id: "offers", label: "Offers", count: promos.length },
    { id: "reels", label: "Reels", count: shopReels.length },
    { id: "about", label: "About" },
  ];

  return (
    <div className={cn("pb-28 lg:pb-10", ownerMode && "pt-0")}>
      <Shutter shop={shop} category={category} open={shutterOpen} runKey={shutterSeq} onDone={onShutterDone} />

      {ownerMode && <OwnerModeBar views={shop.stats.views7d} delay={shutterOpen ? 0.85 : 0} />}

      <div>
        {/* Top utility row */}
        <div className="flex items-center justify-between gap-2 pt-3 pb-3 lg:pt-5">
          <Link href="/" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-sunk px-3 text-[13px] font-bold whitespace-nowrap text-ink-900 transition-colors hover:bg-hairline">
            <ArrowLeft className="size-4" /> <span className="md:hidden">Aas-paas ki dukaanein</span><span className="hidden md:inline">Explore All Nearby Shops</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setShutterDone(false);
                setShutterSeq((s) => s + 1);
                setShutterOpen(true);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold text-ink-500 transition-colors hover:bg-sunk hover:text-ink-900"
            >
              <RotateCcw className="size-3.5" /> <span className="hidden md:inline">Replay shutter</span>
            </button>
            <button type="button" onClick={share} aria-label="Share" className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-sunk">
              <Share2 className="size-4" />
            </button>
          </div>
        </div>

        {/* Cover / profile: balanced 2-column editorial flex/grid */}
        <section className={cn("relative overflow-hidden rounded-[28px] border border-black/[0.05] shadow-soft", COVER_TINT[category?.wash ?? "cream"])}>
          <div className="flex flex-col items-stretch justify-between gap-6 p-5 md:flex-row md:items-center md:p-7 lg:gap-10 lg:p-9">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-3.5">
                <ShopMonogram shop={shop} wash={category?.wash ?? "cream"} size={60} className="bg-white shadow-1" />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold tracking-[0.08em] text-ink-900/60 uppercase">{category?.name}</div>
                  <h1 className="text-[24px] leading-[28px] font-extrabold tracking-[-0.02em] lg:text-[36px] lg:leading-[40px]">{shop.name}</h1>
                  {shop.tagline && <p className="mt-1 text-[13.5px] font-medium text-ink-700 lg:text-[15px]">{shop.tagline}</p>}
                </div>
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                {shop.isVerified && <Badge tone="indigo" icon={<BadgeCheck className="size-3.5" strokeWidth={2} />}>Verified</Badge>}
                {shop.verification.gst && <GstBadge />}
                {shop.verification.google && <GoogleBadge />}
                {shop.plan === "pro" && <ProBadge />}
                {shop.verification.status === "pending" && <Badge tone="saffron">Verification pending</Badge>}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px]">
                {shop.rating != null && (
                  <span className="tabular inline-flex h-6 items-center gap-0.5 rounded-md bg-leaf-600 px-1.5 font-extrabold text-white">
                    {shop.rating.toFixed(1)} <Star className="size-3 fill-white" strokeWidth={0} />
                    <span className="ml-1 text-[11px] font-semibold text-white/85">({shop.ratingCount})</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 font-semibold text-ink-900">
                  <Users className="size-4 text-ink-500" />
                  <LiveFlash watch={followers}>
                    <span className="tabular">{formatCompactIN(followers)}</span>
                  </LiveFlash>{" "}
                  followers
                </span>
                <span className={cn("inline-flex items-center gap-1 font-semibold", status.open ? "text-leaf-700" : "text-danger-600")}>
                  <Clock className="size-4" /> {status.label}
                </span>
              </div>

              <p className="mt-2.5 flex items-start gap-1.5 text-[12.5px] text-ink-700">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-flame-600" />
                <span>
                  {fullAddress}
                  {shop.landmark && ` · ${shop.landmark}`}
                  {distance != null && <b className="tabular whitespace-nowrap text-ink-900"> · {formatDistance(distance)}</b>}
                </span>
              </p>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                {ownerMode ? (
                  <span className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-white/75 px-3.5 text-[13px] font-semibold text-ink-700">
                    Aap owner hain — buyers ko yahan Follow button dikhega
                  </span>
                ) : (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => openClaim(shop.id)}
                    className={cn(
                      "inline-flex h-11 items-center gap-2 rounded-xl px-4 text-[14px] font-bold shadow-1 transition-colors",
                      following ? "bg-white text-leaf-700" : "bg-leaf-500 text-white hover:bg-leaf-600",
                    )}
                  >
                    {following ? <Check className="size-4" strokeWidth={2.5} /> : <MessageCircle className="size-[18px]" strokeWidth={2.25} />}
                    {following ? "Following · VIP" : "Follow & WhatsApp pe Offers"}
                  </motion.button>
                )}
                <a href={`tel:+91${shop.phone}`} className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-white px-3.5 text-[13.5px] font-bold text-ink-900 shadow-1 transition-colors hover:bg-white/85">
                  <Phone className="size-4" /> Call
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${shop.geo.lat},${shop.geo.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-white px-3.5 text-[13.5px] font-bold text-indigo-600 shadow-1 transition-colors hover:bg-white/85"
                >
                  <Navigation className="size-4" /> Raasta
                </a>
              </div>
            </div>

            {/* Editorial product showcase frame */}
            <div className="relative w-full shrink-0 md:w-[320px] lg:w-[460px] xl:w-[500px]">
              <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-[22px] border border-white/70 bg-white/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-sm md:aspect-[16/10] lg:p-5">
                <div aria-hidden className="absolute aspect-square w-[56%] rounded-full bg-white/65 shadow-[0_0_40px_rgba(255,255,255,0.45)]" />
                <RetailImage
                  imageKey={shop.coverImageKey}
                  mode="cover"
                  size="cover"
                  wash={category?.wash ?? "cream"}
                  alt={shop.name}
                  priority
                  className="relative z-10 h-full w-full bg-transparent"
                />
                {promos[0] && (
                  <span className="absolute bottom-3 left-3 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-[11.5px] font-bold text-ink-900 shadow-1 backdrop-blur-md">
                    <span className="size-2 rounded-full bg-flame-500" />
                    {ribbonLabel(promos[0]) ?? "Featured Offer"} · {promos.length} live
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Live offers ribbon */}
        {promos.length > 0 && (
          <div className="no-scrollbar -mx-4 mt-4 flex gap-2.5 overflow-x-auto px-4 py-1 lg:mx-0 lg:px-0">
            {promos.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setTab("offers");
                  setTimeout(() => document.getElementById(`offer-${o.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
                }}
                className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-dashed border-flame-500/50 bg-flame-50 py-2 pr-4 pl-2 text-left transition-colors hover:bg-flame-100/60"
              >
                <span className="tabular rounded-lg bg-flame-500 px-2 py-1.5 text-[12px] font-extrabold text-white">{ribbonLabel(o) ?? "OFFER"}</span>
                <span className="max-w-[220px] truncate text-[13px] font-bold text-ink-900">{o.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* Story-style reels strip */}
        {shopReels.length > 0 && (
          <div className="no-scrollbar -mx-4 mt-4 flex gap-3 overflow-x-auto px-4 py-1 lg:mx-0 lg:px-0" aria-label="Reels">
            {shopReels.slice(0, 8).map((r) => (
              <Link
                key={r.id}
                href={`${pathname}?${new URLSearchParams({ ...Object.fromEntries(params), reel: r.id })}`}
                scroll={false}
                className="flex w-[76px] shrink-0 flex-col items-center gap-1.5"
              >
                <span className="rounded-full bg-gradient-to-tr from-saffron-400 via-flame-500 to-indigo-500 p-[2.5px]">
                  <span className="block rounded-full bg-surface p-[2px]">
                    <RetailImage imageKey={r.frames[0]?.imageKey} mode="cover" size="thumb" wash={category?.wash ?? "cream"} alt="" className="size-16 rounded-full" />
                  </span>
                </span>
                <span className="line-clamp-2 text-center text-[11px] leading-[13px] font-semibold text-ink-700">{r.caption}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Sticky tabs — aligned strictly below h-16 navbar (and OwnerModeBar if active) */}
        <div
          className={cn(
            "sticky z-20 -mx-4 mt-5 border-b border-hairline bg-surface/95 px-4 backdrop-blur-md lg:mx-0 lg:px-0",
            ownerMode ? "top-28" : "top-16",
          )}
        >
          <div className="no-scrollbar flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)} className="relative flex h-12 shrink-0 items-center gap-1.5 px-3 text-[14px] font-bold">
                <span className={tab === t.id ? "text-ink-900" : "text-ink-500"}>{t.label}</span>
                {t.count != null && <span className={cn("tabular rounded-full px-1.5 text-[11px]", tab === t.id ? "bg-ink-900 text-white" : "bg-sunk text-ink-500")}>{t.count}</span>}
                {tab === t.id && <motion.span layoutId="shop-tab" transition={spring.pill} className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-flame-500" />}
              </button>
            ))}
          </div>
        </div>

        {/* In-shop search + sub-category chips */}
        {(tab === "showroom" || tab === "offers") && (
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="flex h-11 items-center gap-2 rounded-xl bg-sunk px-3 lg:w-[320px]">
              <Search className="size-4 text-ink-500" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${shop.name.split(" ")[0]} mein dhoondhein…`} className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink-300" />
              {q && (
                <button type="button" onClick={() => setQ("")} aria-label="Clear">
                  <X className="size-4 text-ink-500" />
                </button>
              )}
            </label>
            {subs.length > 1 && (
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
                <FilterChip selected={!sub} onClick={() => setSub(undefined)}>
                  Sab
                </FilterChip>
                {subs.map((s) => (
                  <FilterChip key={s.id} selected={sub === s.id} onClick={() => setSub(sub === s.id ? undefined : s.id)}>
                    {s.name}
                  </FilterChip>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-5 pt-2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              {(tab === "showroom" || tab === "offers") &&
                (visible.length ? (
                  <>
                    {tab === "showroom" && !term && !sub && (
                      <p className="mb-4 text-[13px] text-ink-500">
                        <b className="text-ink-900">Top {Math.min(10, products.length)}</b> showroom items · dukaan mein aakar dekhein, ya CLAIM karke WhatsApp par details paayein
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-5 pt-1 md:grid-cols-3 lg:gap-x-5 xl:grid-cols-4">
                      {visible.map((o) => (
                        <div
                          key={o.id}
                          id={`offer-${o.id}`}
                          className={cn(
                            "h-full rounded-[22px] transition-shadow",
                            ownerMode ? "scroll-mt-44" : "scroll-mt-32",
                            o.id === focusOffer && "ring-4 ring-flame-500/70 ring-offset-4 ring-offset-surface",
                          )}
                        >
                          <OfferCard offer={o} shop={shop} category={category} className="h-full" />
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState
                    wash={category?.wash ?? "cream"}
                    title={term || sub ? "Is filter mein kuch nahi mila" : tab === "offers" ? "Abhi koi live offer nahi" : "Showroom jaldi update hoga"}
                    body={term || sub ? "Search ya chip badal kar dekhein." : "Follow karein — naya offer aate hi WhatsApp par bataenge."}
                  />
                ))}

              {tab === "reels" &&
                (shopReels.length ? (
                  <div className="flex flex-wrap gap-3 pt-1">
                    {shopReels.map((r) => (
                      <ReelCard key={r.id} reel={r} shop={shop} category={category} href={`${pathname}?${new URLSearchParams({ ...Object.fromEntries(params), reel: r.id })}`} />
                    ))}
                  </div>
                ) : (
                  <EmptyState wash={category?.wash ?? "cream"} title="Abhi koi reel nahi" body="Dukaan ki pehli reel Retobiz Studio se jaldi aa rahi hai." />
                ))}

              {tab === "about" && (
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoRow label="Address" value={fullAddress} sub={shop.landmark} />
                  <InfoRow label="Timing" value={shop.hours} sub={status.label} />
                  <InfoRow label="Owner" value={shop.ownerName} sub={`Retobiz par ${timeAgo(shop.createdAt).replace(" pehle", "")} se`} />
                  <InfoRow
                    label="Verification"
                    value={shop.isVerified ? "Verified dukaan" : shop.verification.status === "pending" ? "Verification pending" : "Abhi verified nahi"}
                    sub={[shop.verification.gst && shop.verification.gstin && `GSTIN ${shop.verification.gstin}`, shop.verification.google && "Google Business verified"].filter(Boolean).join(" · ") || undefined}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Keep exploring — QR scanners are never trapped in one store */}
        <section className="mt-10 rounded-3xl bg-canvas p-4 lg:p-6">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="text-[11px] font-bold tracking-[0.08em] text-ink-500 uppercase">Aas-paas aur bhi</div>
              <h2 className="text-[20px] leading-[26px] font-bold">Milti-julti dukaanein</h2>
            </div>
            <Link href="/" className="inline-flex shrink-0 items-center gap-1 text-[14px] font-bold whitespace-nowrap text-indigo-600">
              Sab dekhein <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {similar.map((r) => {
              const best = Object.values(offers)
                .filter((o) => o.shopId === r.shop.id && o.status === "live")
                .sort((a, b) => (b.discountPct ?? 0) - (a.discountPct ?? 0))[0];
              return (
                <ShopCoverCard
                  key={r.shop.id}
                  shop={r.shop}
                  category={catById[r.shop.categoryId]}
                  areaName={locById[r.shop.areaId]?.name ?? ""}
                  distanceKm={r.distanceKm}
                  topDeal={best ? ribbonLabel(best) : undefined}
                  liveOffers={r.liveOfferCount}
                  className="h-full"
                />
              );
            })}
          </div>
          <ButtonLink href="/" variant="secondary" className="mt-5 w-full justify-center" icon={<ArrowLeft className="size-4" />}>
            Explore All Nearby Shops
          </ButtonLink>
        </section>
      </div>

      {/* Mobile sticky CTA */}
      {!ownerMode && (
        <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 border-t border-hairline bg-surface/95 px-4 py-2.5 backdrop-blur lg:hidden">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => openClaim(shop.id)}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold",
              following ? "bg-saffron-100 text-ink-900" : "bg-leaf-500 text-white",
            )}
          >
            {following ? "Mera VIP Pass dekhein" : (
              <>
                <MessageCircle className="size-5" strokeWidth={2.25} /> Follow & WhatsApp pe Offers Paayein
              </>
            )}
          </motion.button>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-canvas p-4">
      <div className="text-[11px] font-bold tracking-[0.08em] text-ink-500 uppercase">{label}</div>
      <div className="mt-1 text-[15px] font-bold text-ink-900">{value}</div>
      {sub && <div className="mt-0.5 text-[12.5px] text-ink-500">{sub}</div>}
    </div>
  );
}

/** DESIGN §5.7 — merchant viewing own storefront. */
function OwnerModeBar({ views, delay = 0 }: { views: number; delay?: number }) {
  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...spring.default, delay }}
      className="sticky top-16 z-30 -mx-4 flex h-12 items-center justify-between gap-2 bg-indigo-600 px-4 text-white lg:mx-0 lg:rounded-b-xl"
    >
      <span className="min-w-0 truncate text-[13px]">
        <b>Aapki dukaan live hai</b>
        <span className="hidden sm:inline"> · </span>
        <span className="tabular hidden sm:inline">
          <LiveFlash watch={views}>{views}</LiveFlash> views is hafte
        </span>
      </span>
      <span className="flex shrink-0 gap-2">
        <Link href="/merchant/profile" className="inline-flex h-8 items-center gap-1 rounded-lg bg-white/15 px-2.5 text-[12.5px] font-bold hover:bg-white/25">
          <Pencil className="size-3.5" /> <span className="hidden sm:inline">Edit Storefront</span>
        </Link>
        <Link href="/merchant/offers/new" className="inline-flex h-8 items-center gap-1 rounded-lg bg-white px-2.5 text-[12.5px] font-bold text-indigo-700">
          <Plus className="size-3.5" /> Naya Offer
        </Link>
      </span>
    </motion.div>
  );
}
