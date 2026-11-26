"use client";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useStore } from "@/store";
import { useUiStore } from "@/store/ui";
import { searchOffers, searchShops, type DiscoveryFilters } from "@/store/selectors";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";
import { FilterChip } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/misc";
import { BlurEntrance, ScrollBlurSection } from "@/components/ui/scroll-reveal";
import { Hydrated } from "@/components/shell/hydrated";
import { RetailImage } from "@/components/media/retail-image";
import { CategoryStrip } from "./category-strip";
import { OfferCard, OfferCardSkeleton, ribbonLabel } from "./offer-card";
import { ShopCoverCard } from "./shop-cover-card";
import { FollowSheet } from "./follow-sheet";
import { LeadPanel } from "./lead-panel";
import { useDiscoveryCtx, useLookups } from "./hooks";
import { RADIUS_OPTIONS } from "./location-sheet";

type Mode = "search" | "category" | "offers";
type Tab = "offers" | "shops";
type Sort = NonNullable<DiscoveryFilters["sort"]>;

const SORTS: { value: Sort; label: string }[] = [
  { value: "relevance", label: "Best match" },
  { value: "nearest", label: "Sabse paas" },
  { value: "discount", label: "Sabse zyada off" },
  { value: "ending", label: "Jaldi khatam" },
  { value: "newest", label: "Naye" },
];
const DISCOUNTS = [0, 10, 20, 30, 50];

/* ─────────────────────────── URL state ─────────────────────────── */

interface UrlState {
  q: string;
  tab: Tab;
  cat?: string;
  sub?: string;
  loc?: string;
  r?: number;
  disc: number;
  max?: number;
  v: boolean;
  live: boolean;
  sort: Sort;
  shop?: string;
}

function useUrlState(defaults: Partial<UrlState>) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const state: UrlState = {
    q: params.get("q") ?? "",
    tab: (params.get("tab") as Tab) ?? defaults.tab ?? "offers",
    cat: params.get("cat") ?? defaults.cat,
    sub: params.get("sub") ?? undefined,
    loc: params.get("loc") ?? undefined,
    r: params.has("r") ? Number(params.get("r")) : undefined,
    disc: Number(params.get("disc") ?? 0),
    max: params.has("max") ? Number(params.get("max")) : undefined,
    v: params.get("v") === "1",
    live: params.get("live") === "1",
    sort: (params.get("sort") as Sort) ?? defaults.sort ?? "relevance",
    shop: params.get("shop") ?? undefined,
  };
  const update = (patch: Partial<UrlState>) => {
    const next = { ...state, ...patch };
    const p = new URLSearchParams();
    if (next.q) p.set("q", next.q);
    if (next.tab !== (defaults.tab ?? "offers")) p.set("tab", next.tab);
    if (next.cat && next.cat !== defaults.cat) p.set("cat", next.cat);
    if (next.sub) p.set("sub", next.sub);
    if (next.loc) p.set("loc", next.loc);
    if (next.r != null) p.set("r", String(next.r));
    if (next.disc) p.set("disc", String(next.disc));
    if (next.max) p.set("max", String(next.max));
    if (next.v) p.set("v", "1");
    if (next.live) p.set("live", "1");
    if (next.sort !== (defaults.sort ?? "relevance")) p.set("sort", next.sort);
    if (next.shop) p.set("shop", next.shop);
    const reel = params.get("reel");
    if (reel) p.set("reel", reel);
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  return [state, update] as const;
}

/* ─────────────────────────── View ─────────────────────────── */

export function DiscoveryView({ mode }: { mode: Mode }) {
  return (
    <Suspense fallback={<DiscoverySkeleton />}>
      <Hydrated fallback={<DiscoverySkeleton />}>
        {mode === "category" ? <CategoryDiscovery /> : <Discovery mode={mode} />}
      </Hydrated>
    </Suspense>
  );
}

function CategoryDiscovery() {
  const { slug } = useParams<{ slug: string }>();
  const exists = useStore((s) => s.categories.some((c) => c.slug === slug && c.active));
  if (!exists)
    return (
      <EmptyState
        wash="peach"
        title="Yeh category nahi mili"
        body="Shayad admin ne ise band kar diya hai. Saare offers dekhein?"
        action={<ButtonLink href="/offers" variant="primary-flame">Aaj ke Offers</ButtonLink>}
        className="py-16"
      />
    );
  return <Discovery key={slug} mode="category" categorySlug={slug} />;
}

function DiscoverySkeleton() {
  return (
    <div className="pt-4" aria-busy>
      <Skeleton className="h-[140px] rounded-[24px]" />
      <div className="mt-4 flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <OfferCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function Discovery({ mode, categorySlug }: { mode: Mode; categorySlug?: string }) {
  const ctx = useDiscoveryCtx();
  const { catById, locById } = useLookups();
  const buyerLocation = useStore((s) => s.buyerLocation);
  const category = categorySlug ? ctx.categories.find((c) => c.slug === categorySlug) : undefined;
  const [st, update] = useUrlState({
    tab: "offers",
    cat: category?.id,
    sort: mode === "offers" ? "ending" : mode === "category" ? "discount" : "relevance",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [followShopId, setFollowShopId] = useState<string | null>(null);
  const [followOpen, setFollowOpen] = useState(false);

  const [qDraft, setQDraft] = useState(st.q);
  useEffect(() => {
    if (qDraft === st.q) return;
    const t = setTimeout(() => update({ q: qDraft.trim() }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDraft]);

  const scopeLoc = st.loc ? locById[st.loc] : undefined;
  const isAreaScope = !scopeLoc || scopeLoc.level === "area";
  const originAreaId = scopeLoc?.level === "area" ? scopeLoc.id : buyerLocation.areaId;
  const radius = isAreaScope ? (st.r ?? buyerLocation.radiusKm) : undefined;

  const filters: DiscoveryFilters = useMemo(
    () => ({
      q: st.q || undefined,
      kind: mode === "offers" ? "offer" : undefined,
      categoryId: st.cat,
      subCategoryId: st.sub,
      locationId: scopeLoc && scopeLoc.level !== "area" ? scopeLoc.id : undefined,
      originAreaId,
      radiusKm: radius && radius > 0 ? radius : undefined,
      minDiscount: st.disc || undefined,
      maxPrice: st.max,
      verifiedOnly: st.v || undefined,
      hasActiveOffers: st.live || undefined,
      shopId: st.shop,
      sort: st.sort,
    }),
    [mode, st.q, st.cat, st.sub, scopeLoc, originAreaId, radius, st.disc, st.max, st.v, st.live, st.shop, st.sort],
  );

  const offerResults = useMemo(() => searchOffers(ctx, filters), [ctx, filters]);
  const shopResults = useMemo(() => searchShops(ctx, filters), [ctx, filters]);
  const tab: Tab = mode === "offers" ? "offers" : st.tab;
  const count = tab === "offers" ? offerResults.length : shopResults.length;

  const subs = st.cat ? ctx.subCategories.filter((s) => s.categoryId === st.cat && s.active) : [];
  const activeCount = [st.cat && st.cat !== category?.id, st.sub, st.loc, st.r != null, st.disc, st.max, st.v, st.live, st.shop].filter(Boolean).length;
  const scopeLabel = scopeLoc && scopeLoc.level !== "area" ? `Poora ${scopeLoc.name}` : `${locById[originAreaId]?.name ?? "Akurdi"} · ${radius ? `${radius} km` : "All"}`;

  const clearAll = () => {
    setQDraft("");
    update({ q: "", cat: category?.id, sub: undefined, loc: undefined, r: undefined, disc: 0, max: undefined, v: false, live: false, shop: undefined });
  };

  return (
    <div className="pt-4 pb-8 lg:pt-6">
      <BlurEntrance>
        {mode === "category" && category && <CategoryHero category={category} count={offerResults.length} shops={shopResults.length} />}
        {mode === "offers" && <OffersHero count={offerResults.length} scopeLabel={scopeLabel} />}
      </BlurEntrance>

      {/* Clean Search + Single Filters Button (replaces 6 stacked filter walls!) */}
      <BlurEntrance delay={0.04} className="flex items-center gap-2.5">
        <label className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-black/[0.06] bg-white/95 px-4 shadow-soft backdrop-blur-md transition-colors focus-within:border-indigo-500">
          <Search className="size-[18px] shrink-0 text-ink-900" strokeWidth={2} />
          <input
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            placeholder={mode === "category" && category ? `${category.name} mein dhoondhein…` : mode === "offers" ? "Search offers — saree, mithai, cover…" : "Search shops, sarees, mithai…"}
            aria-label="Search"
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink-900 outline-none placeholder:text-ink-300"
            enterKeyHint="search"
          />
          {qDraft && (
            <button type="button" onClick={() => setQDraft("")} aria-label="Clear" className="flex size-7 items-center justify-center rounded-full hover:bg-sunk">
              <X className="size-4" />
            </button>
          )}
        </label>

        <button
          type="button"
          onClick={() => useUiStore.getState().setLocationOpen(true)}
          className="hidden h-12 shrink-0 items-center gap-1.5 rounded-2xl border border-black/[0.06] bg-white px-3.5 text-[13.5px] font-bold text-ink-900 shadow-soft transition-colors hover:bg-canvas sm:inline-flex lg:hidden"
        >
          <MapPin className="size-4 text-flame-600" />
          <span className="max-w-[90px] truncate">{locById[originAreaId]?.name ?? "Akurdi"}</span>
        </button>

        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="relative flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-ink-900 px-4 text-[14px] font-bold text-white shadow-soft transition-transform active:scale-95 lg:hidden"
        >
          <SlidersHorizontal className="size-4" />
          <span>Filters</span>
          {activeCount > 0 && <span className="tabular flex size-5 items-center justify-center rounded-full bg-flame-500 text-[11px]">{activeCount}</span>}
        </button>
      </BlurEntrance>

      {/* Single calm horizontal pill bar */}
      <BlurEntrance delay={0.08} className="mt-3.5">
        {mode === "offers" ? (
          <CategoryStrip />
        ) : (
          mode !== "category" && (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 lg:mx-0 lg:px-0">
              <CatChip label="All" selected={!st.cat} onClick={() => update({ cat: undefined, sub: undefined })} />
              {ctx.categories
                .filter((c) => c.active)
                .sort((a, b) => a.order - b.order)
                .map((c) => (
                  <CatChip key={c.id} category={c} label={c.name.split(" & ")[0]} selected={st.cat === c.id} onClick={() => update({ cat: st.cat === c.id ? undefined : c.id, sub: undefined })} />
                ))}
            </div>
          )
        )}
        {subs.length > 0 && (
          <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 py-1 lg:mx-0 lg:px-0">
            <FilterChip selected={!st.sub} onClick={() => update({ sub: undefined })}>
              All {catById[st.cat!]?.name.split(" & ")[0]}
            </FilterChip>
            {subs.map((s) => (
              <FilterChip key={s.id} selected={st.sub === s.id} onClick={() => update({ sub: st.sub === s.id ? undefined : s.id })}>
                {s.name}
              </FilterChip>
            ))}
          </div>
        )}
      </BlurEntrance>

      <div className="mt-6 flex gap-8">
        {/* Sticky desktop filter rail */}
        <aside className="hidden w-[264px] shrink-0 lg:sticky lg:top-20 lg:block lg:self-start">
          <div className="rounded-[24px] border border-black/[0.06] bg-white p-4 shadow-soft">
            <FilterPanel st={st} update={update} mode={mode} lockedCat={category} />
          </div>
          <LeadPanel
            title={`${locById[originAreaId]?.name ?? "Akurdi"} ki top ${(st.cat ? catById[st.cat]?.name.split(" & ")[0] : "") || ""} dukaanein WhatsApp par`.replace("  ", " ")}
            shops={shopResults.map((r) => r.shop)}
          />
        </aside>

        <div className="min-w-0 flex-1">
          {/* Results header + Clear active filters */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {mode === "offers" ? (
                <p className="text-[14px] text-ink-500">
                  <b className="tabular text-ink-900">{count}</b> offers · {scopeLabel}
                </p>
              ) : (
                <Segmented
                  id={`tab-${mode}`}
                  value={tab}
                  onChange={(v) => update({ tab: v })}
                  options={[
                    { value: "offers", label: `Offers · ${offerResults.length}` },
                    { value: "shops", label: `Dukaanein · ${shopResults.length}` },
                  ]}
                />
              )}
              {(activeCount > 0 || !!st.q) && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="inline-flex h-7 items-center gap-1 rounded-full bg-flame-50 px-2.5 text-[12px] font-bold text-flame-600 transition-colors hover:bg-flame-100"
                >
                  <X className="size-3" /> Clear filters
                </button>
              )}
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <span className="text-[13px] text-ink-500">Sort</span>
              <select
                value={st.sort}
                onChange={(e) => update({ sort: e.target.value as Sort })}
                className="h-9 rounded-full border border-hairline bg-surface px-3 text-[13px] font-semibold text-ink-900 outline-none focus:border-indigo-500"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {count === 0 ? (
            <ZeroResults
              q={st.q}
              radius={radius}
              onWiden={() => update({ r: 25, loc: undefined })}
              onAnywhere={() => update({ r: 0, loc: undefined })}
              onClear={clearAll}
              hasFilters={activeCount > 0 || !!st.q}
            />
          ) : tab === "offers" ? (
            <ScrollBlurSection exitFade={false} className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:gap-4 xl:grid-cols-4">
              {offerResults.map((r, i) => (
                <div key={r.offer.id} className="h-full min-w-0">
                  <OfferCard offer={r.offer} shop={r.shop} category={catById[r.offer.categoryId]} distanceKm={r.distanceKm} priority={i < 8} className="h-full" />
                </div>
              ))}
            </ScrollBlurSection>
          ) : (
            <ScrollBlurSection exitFade={false} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {shopResults.map((r) => {
                const best = Object.values(ctx.offers)
                  .filter((o) => o.shopId === r.shop.id && o.status === "live")
                  .sort((a, b) => (b.discountPct ?? 0) - (a.discountPct ?? 0))[0];
                return (
                  <div key={r.shop.id} className="h-full min-w-0">
                    <ShopCoverCard
                      shop={r.shop}
                      category={catById[r.shop.categoryId]}
                      areaName={locById[r.shop.areaId]?.name ?? ""}
                      distanceKm={r.distanceKm}
                      topDeal={best ? ribbonLabel(best) : undefined}
                      liveOffers={r.liveOfferCount}
                      className="h-full"
                      onFollow={() => {
                        setFollowShopId(r.shop.id);
                        setFollowOpen(true);
                      }}
                    />
                  </div>
                );
              })}
            </ScrollBlurSection>
          )}
        </div>
      </div>

      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        footer={
          <div className="flex gap-2">
            {(activeCount > 0 || !!st.q) && (
              <Button variant="secondary" size="lg" onClick={clearAll}>
                Clear
              </Button>
            )}
            <Button variant="ink" size="lg" full onClick={() => setFiltersOpen(false)}>
              Show {count} results
            </Button>
          </div>
        }
      >
        <FilterPanel st={st} update={update} mode={mode} lockedCat={category} />
      </Sheet>
      <FollowSheet key={followShopId ?? "none"} shop={followShopId ? ctx.shops[followShopId] : null} open={followOpen} onClose={() => setFollowOpen(false)} />
    </div>
  );
}

/* ─────────────────────────── Pieces ─────────────────────────── */

function CatChip({ category, label, selected, onClick }: { category?: Category; label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex h-10 shrink-0 items-center gap-2 rounded-full border pr-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors",
        category ? "pl-1" : "pl-3.5",
        selected ? "border-ink-900 bg-ink-900 text-white" : "border-hairline bg-surface text-ink-900 hover:border-hairline-strong",
      )}
    >
      {category && <RetailImage imageKey={category.imageKey} size="thumb" mode="cover" wash={category.wash} alt="" priority className="size-8 rounded-full" />}
      {label}
    </button>
  );
}

function FilterPanel({ st, update, mode, lockedCat }: { st: UrlState; update: (p: Partial<UrlState>) => void; mode: Mode; lockedCat?: Category }) {
  const categories = useStore((s) => s.categories);
  const subCategories = useStore((s) => s.subCategories);
  const locations = useStore((s) => s.locations);
  const buyerLocation = useStore((s) => s.buyerLocation);
  const cities = locations.filter((l) => l.level === "city");
  const byId = Object.fromEntries(locations.map((l) => [l.id, l]));
  const activeLoc = byId[st.loc ?? buyerLocation.areaId];
  const activeCityId = activeLoc?.level === "city" ? activeLoc.id : activeLoc?.parentId;
  const areas = locations.filter((l) => l.level === "area" && (!activeCityId || l.parentId === activeCityId));

  const catId = lockedCat?.id ?? st.cat;
  const subs = catId ? subCategories.filter((s) => s.categoryId === catId && s.active) : [];
  const isArea = !st.loc || byId[st.loc]?.level === "area";
  const radius = st.r ?? buyerLocation.radiusKm;

  return (
    <div className="flex flex-col gap-5">
      {!lockedCat && (
        <Group title="Category">
          {categories
            .filter((c) => c.active)
            .sort((a, b) => a.order - b.order)
            .map((c) => (
              <FilterChip key={c.id} selected={st.cat === c.id} onClick={() => update({ cat: st.cat === c.id ? undefined : c.id, sub: undefined })}>
                {c.name}
              </FilterChip>
            ))}
        </Group>
      )}
      {subs.length > 0 && (
        <Group title="Section">
          {subs.map((s) => (
            <FilterChip key={s.id} selected={st.sub === s.id} onClick={() => update({ sub: st.sub === s.id ? undefined : s.id })}>
              {s.name}
            </FilterChip>
          ))}
        </Group>
      )}
      <div>
        <div className="mb-2 text-[13px] font-bold text-ink-900">City & Area</div>
        <div className="flex flex-wrap gap-1.5">
          {cities.map((c) => (
            <FilterChip key={c.id} selected={activeCityId === c.id && st.loc === c.id} onClick={() => update({ loc: c.id, r: undefined })}>
              {c.name.replace(" (PCMC)", "")}
            </FilterChip>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {areas.map((a) => (
            <FilterChip key={a.id} selected={a.id === (st.loc ?? buyerLocation.areaId)} onClick={() => update({ loc: a.id })} icon={<MapPin className="size-3 text-ink-500" />}>
              {a.name}
            </FilterChip>
          ))}
        </div>
        {isArea && (
          <div className="mt-3">
            <div className="mb-1.5 text-[12px] font-semibold text-ink-500">Distance</div>
            <div className="flex flex-wrap gap-1.5">
              {RADIUS_OPTIONS.map((r) => (
                <FilterChip key={r} selected={radius === r} onClick={() => update({ r })}>
                  {r} km
                </FilterChip>
              ))}
              <FilterChip selected={radius === 0} onClick={() => update({ r: 0 })}>
                All
              </FilterChip>
            </div>
          </div>
        )}
      </div>

      <Group title="Min Discount">
        {DISCOUNTS.map((d) => (
          <FilterChip key={d} selected={st.disc === d} onClick={() => update({ disc: d })}>
            {d === 0 ? "Any" : `${d}%+`}
          </FilterChip>
        ))}
      </Group>

      <div className="flex flex-col gap-2">
        <Toggle label="Under ₹499 only" checked={st.max === 499} onChange={(on) => update({ max: on ? 499 : undefined })} />
        <Toggle label="Verified shops only" checked={st.v} onChange={(v) => update({ v })} />
        {mode !== "offers" && <Toggle label="Has live offers" checked={st.live} onChange={(live) => update({ live })} />}
      </div>

      <Group title="Sort by">
        {SORTS.filter((s) => s.value !== "relevance" || mode === "search").map((s) => (
          <FilterChip key={s.value} selected={st.sort === s.value} onClick={() => update({ sort: s.value })}>
            {s.label}
          </FilterChip>
        ))}
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[13px] font-bold text-ink-900">{title}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex items-center justify-between gap-3 rounded-md py-1.5 text-left text-[14px] font-semibold text-ink-900">
      {label}
      <span className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", checked ? "bg-leaf-500" : "bg-hairline-strong")}>
        <motion.span layout transition={spring.snappy} className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow-1", checked ? "right-0.5" : "left-0.5")} />
      </span>
    </button>
  );
}

function ZeroResults({ q, radius, onWiden, onAnywhere, onClear, hasFilters }: { q: string; radius?: number; onWiden: () => void; onAnywhere: () => void; onClear: () => void; hasFilters: boolean }) {
  return (
    <div className="rounded-2xl bg-surface ring-1 ring-ink-900/5">
      <EmptyState
        wash="peach"
        title={q ? `“${q}” ka is area mein koi match nahi` : "Is area mein abhi koi match nahi"}
        body={radius && radius < 25 ? `Radius ${radius} km hai. Thoda door tak dekhein?` : "Filters thode dheele karke dekhein."}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {radius != null && radius < 25 && (
              <Button variant="primary-flame" onClick={onWiden}>
                Radius 25 km karein
              </Button>
            )}
            <Button variant="secondary" onClick={onAnywhere}>
              Poore Maharashtra mein
            </Button>
            {hasFilters && (
              <Button variant="ghost" onClick={onClear}>
                Filters hatayein
              </Button>
            )}
          </div>
        }
      />
    </div>
  );
}

const HERO_TINT: Record<Category["wash"], string> = {
  mint: "bg-[linear-gradient(120deg,#DDF5E7_0%,#A8E6C4_100%)]",
  peach: "bg-[linear-gradient(120deg,#FFE7D6_0%,#FFB98F_100%)]",
  sky: "bg-[linear-gradient(120deg,#E1EDFF_0%,#A9C8FF_100%)]",
  cream: "bg-[linear-gradient(120deg,#FFF3CF_0%,#FFD45E_100%)]",
  lavender: "bg-[linear-gradient(120deg,#EFE6FF_0%,#C9AEFF_100%)]",
};

function CategoryHero({ category, count, shops }: { category: Category; count: number; shops: number }) {
  return (
    <div className={cn("relative mb-5 overflow-hidden rounded-[24px]", HERO_TINT[category.wash])}>
      <div className="relative z-10 flex min-h-[150px] max-w-[62%] flex-col justify-end p-5 lg:min-h-[210px] lg:p-8">
        {category.nameHi && (
          <span lang="hi" className="font-deva text-[16px] font-bold text-ink-900/60">
            {category.nameHi}
          </span>
        )}
        <h1 className="text-[28px] leading-[32px] font-extrabold tracking-[-0.02em] lg:text-[42px] lg:leading-[46px]">{category.name}</h1>
        <p className="tabular mt-1.5 text-[13px] font-semibold text-ink-700">
          {count} offers & products · {shops} dukaanein
        </p>
      </div>
      <div aria-hidden className="absolute top-1/2 right-[6%] aspect-square w-[34%] -translate-y-1/2 rounded-full bg-white/40 lg:w-[26%]" />
      <RetailImage imageKey={category.imageKey} mode="cover" size="cover" wash={category.wash} alt="" priority className="absolute right-0 bottom-0 h-[115%] w-[44%] bg-transparent lg:right-[3%] lg:w-[32%]" />
    </div>
  );
}

function OffersHero({ count, scopeLabel }: { count: number; scopeLabel: string }) {
  return (
    <div className="relative mb-5 overflow-hidden rounded-[28px] bg-[linear-gradient(118deg,#FFC629_0%,#FF9A3D_55%,#FF7A45_100%)] p-5 shadow-soft lg:p-8">
      <div className="relative z-10 max-w-full md:max-w-[58%]">
        <span className="inline-flex h-6 items-center rounded-full bg-ink-900 px-3 text-[10.5px] font-bold tracking-[0.07em] text-saffron-400 uppercase">
          Universal Offers Hub
        </span>
        <h1 className="mt-3 text-[28px] leading-[32px] font-extrabold tracking-[-0.02em] text-ink-900 lg:text-[42px] lg:leading-[46px]">
          Aaj ke saare Offers
        </h1>
        <p className="tabular mt-1.5 text-[13.5px] font-semibold text-ink-900/75 lg:text-[15px]">
          {count} live deals · {scopeLabel}
        </p>
      </div>
      {/* Hidden below md (768px) so 390px mobile never collides with headline */}
      <div className="absolute top-1/2 right-5 hidden -translate-y-1/2 gap-3 md:flex lg:right-8">
        {(["p-kaju-katli", "p-paithani", "p-kolhapuri"] as const).map((k, i) => (
          <RetailImage
            key={k}
            imageKey={k}
            mode="cover"
            size="thumb"
            wash="cream"
            alt=""
            priority
            className={cn("size-[104px] rounded-2xl bg-white/50 shadow-soft backdrop-blur-sm lg:size-[132px]", i === 1 ? "-translate-y-3 rotate-2" : i === 0 ? "-rotate-3" : "rotate-3")}
          />
        ))}
      </div>
    </div>
  );
}
