"use client";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowUpRight, MapPin, Search, Store, TrendingUp, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useStore } from "@/store";
import { useUiStore } from "@/store/ui";
import { searchOffers, searchShops } from "@/store/selectors";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";
import { RetailImage } from "@/components/media/retail-image";
import { useDiscoveryCtx, useLookups } from "./hooks";
import { SEARCH_HINTS } from "./rotating-search-hint";

type Suggestion =
  | { kind: "category"; id: string; label: string; sub: string; href: string; imageKey?: import("@/data/images").ImageKey; wash: import("@/lib/types").Wash }
  | { kind: "shop"; id: string; label: string; sub: string; href: string; imageKey?: import("@/data/images").ImageKey; wash: import("@/lib/types").Wash }
  | { kind: "offer"; id: string; label: string; sub: string; href: string; imageKey?: import("@/data/images").ImageKey; wash: import("@/lib/types").Wash; price?: string }
  | { kind: "area"; id: string; label: string; sub: string; href: string };

const subscribeNoop = () => () => {};

/**
 * Predictive search (IMPLEMENTATION_PLAN §3.4): grouped Categories · Shops · Offers · Areas,
 * max 3 each, ↑/↓/Enter keyboard nav. Full-screen on mobile, top-anchored panel on desktop.
 */
export function SearchOverlay() {
  const open = useUiStore((s) => s.searchOpen);
  const setOpen = useUiStore((s) => s.setSearchOpen);
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  if (!mounted) return null;
  return createPortal(<AnimatePresence>{open && <Panel onClose={() => setOpen(false)} />}</AnimatePresence>, document.body);
}

function Panel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const ctx = useDiscoveryCtx();
  const { catById, locById } = useLookups();
  const buyerLocation = useStore((s) => s.buyerLocation);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, []);

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const cats: Suggestion[] = ctx.categories
      .filter((c) => c.active && (c.name.toLowerCase().includes(term) || ctx.subCategories.some((s) => s.categoryId === c.id && s.name.toLowerCase().includes(term))))
      .slice(0, 3)
      .map((c) => ({ kind: "category", id: c.id, label: c.name, sub: "Category", href: `/category/${c.slug}`, imageKey: c.imageKey, wash: c.wash }));
    const shops: Suggestion[] = searchShops(ctx, { q: term })
      .slice(0, 3)
      .map((r) => ({
        kind: "shop",
        id: r.shop.id,
        label: r.shop.name,
        sub: `${catById[r.shop.categoryId]?.name ?? ""} · ${locById[r.shop.areaId]?.name ?? ""}`,
        href: `/shop/${r.shop.slug}?src=card`,
        imageKey: r.shop.coverImageKey,
        wash: catById[r.shop.categoryId]?.wash ?? "cream",
      }));
    const offers: Suggestion[] = searchOffers(ctx, { q: term, originAreaId: buyerLocation.areaId })
      .slice(0, 3)
      .map((r) => ({
        kind: "offer",
        id: r.offer.id,
        label: r.offer.title,
        sub: r.shop.name,
        href: `/shop/${r.shop.slug}?offer=${r.offer.id}&src=card`,
        imageKey: r.offer.imageKey,
        wash: catById[r.offer.categoryId]?.wash ?? "cream",
        price: r.offer.price != null ? formatINR(r.offer.price) : r.offer.discountPct ? `${r.offer.discountPct}% off` : undefined,
      }));
    const areas: Suggestion[] = ctx.locations
      .filter((l) => l.level === "area" && l.name.toLowerCase().includes(term))
      .slice(0, 3)
      .map((l) => ({ kind: "area", id: l.id, label: l.name, sub: locById[l.parentId ?? ""]?.name ?? "", href: `/search?loc=${l.id}` }));
    return [
      { title: "Categories", items: cats },
      { title: "Dukaanein", items: shops },
      { title: "Offers", items: offers },
      { title: "Areas", items: areas },
    ].filter((g) => g.items.length);
  }, [q, ctx, catById, locById, buyerLocation.areaId]);

  const flat = groups.flatMap((g) => g.items);
  const go = (href: string) => {
    onClose();
    router.push(href);
  };
  const submit = () => {
    if (flat[active] && q.trim()) return go(flat[active].href);
    go(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/search");
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(flat.length - 1, 0)));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  const popular = ctx.categories.filter((c) => c.active).sort((a, b) => a.order - b.order).slice(0, 6);
  let idx = -1;

  return (
    <div className="fixed inset-0 z-[62]" onKeyDown={onKey} role="dialog" aria-modal="true" aria-label="Search">
      <motion.div className="absolute inset-0 hidden bg-ink-900/40 lg:block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8, transition: { duration: 0.14 } }}
        transition={spring.default}
        className="absolute inset-0 flex flex-col bg-surface lg:inset-x-auto lg:top-4 lg:bottom-auto lg:left-1/2 lg:max-h-[80dvh] lg:w-[680px] lg:-translate-x-1/2 lg:rounded-xl lg:shadow-2"
      >
        <div className="flex items-center gap-2 border-b border-hairline px-3 py-3">
          <button type="button" onClick={onClose} aria-label="Wapas" className="flex size-10 items-center justify-center rounded-full hover:bg-sunk lg:hidden">
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex h-12 flex-1 items-center gap-2.5 rounded-md bg-sunk px-3.5 focus-within:ring-2 focus-within:ring-indigo-500">
            <Search className="size-[18px] text-ink-700" strokeWidth={1.75} />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              placeholder="Saree, kaju katli, screen guard, Akurdi…"
              aria-label="Search"
              className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink-900 outline-none placeholder:text-ink-300"
              enterKeyHint="search"
            />
            {q && (
              <button type="button" onClick={() => setQ("")} aria-label="Clear" className="flex size-7 items-center justify-center rounded-full hover:bg-hairline">
                <X className="size-4" />
              </button>
            )}
          </div>
          <button type="button" onClick={onClose} className="hidden h-10 rounded-md px-3 text-[14px] font-semibold text-ink-700 hover:bg-sunk lg:block">
            Esc
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!q.trim() ? (
            <div className="flex flex-col gap-6">
              <div>
                <div className="mb-2.5 flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.04em] text-ink-500 uppercase">
                  <TrendingUp className="size-3.5" /> Trending {locById[buyerLocation.areaId]?.name ? `in ${locById[buyerLocation.areaId].name}` : ""}
                </div>
                <div className="flex flex-wrap gap-2">
                  {SEARCH_HINTS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => go(`/search?q=${encodeURIComponent(h)}`)}
                      className="h-9 rounded-full border border-hairline px-3.5 text-[13px] font-semibold text-ink-700 hover:border-ink-900 hover:text-ink-900"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2.5 text-[12px] font-semibold tracking-[0.04em] text-ink-500 uppercase">Popular categories</div>
                <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                  {popular.map((c) => (
                    <button key={c.id} type="button" onClick={() => go(`/category/${c.slug}`)} className="group flex flex-col items-center gap-1.5">
                      <RetailImage imageKey={c.imageKey} size="thumb" wash={c.wash} fallbackLabel={c.nameHi ?? c.name} fallbackLang="hi" alt="" className="aspect-square w-full rounded-lg" zoom />
                      <span className="line-clamp-2 text-center text-[12px] leading-4 font-semibold text-ink-900">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : flat.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-[15px] font-semibold text-ink-900">“{q}” ka koi seedha match nahi</p>
              <p className="mt-1 text-[13px] text-ink-500">Poore area mein dhoondhein ya spelling badal kar try karein.</p>
              <button type="button" onClick={submit} className="mt-4 h-10 rounded-md bg-ink-900 px-4 text-[14px] font-bold text-white">
                Sab results dekhein
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {groups.map((g) => (
                <div key={g.title}>
                  <div className="mb-1.5 px-1 text-[11px] font-semibold tracking-[0.06em] text-ink-500 uppercase">{g.title}</div>
                  <ul>
                    {g.items.map((it) => {
                      idx++;
                      const i = idx;
                      return (
                        <li key={it.kind + it.id}>
                          <button
                            type="button"
                            onMouseEnter={() => setActive(i)}
                            onClick={() => go(it.href)}
                            className={cn("flex w-full items-center gap-3 rounded-md px-2 py-2 text-left", active === i ? "bg-sunk" : "hover:bg-sunk")}
                          >
                            {it.kind === "area" ? (
                              <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-flame-50">
                                <MapPin className="size-5 text-flame-600" />
                              </span>
                            ) : (
                              <RetailImage imageKey={it.imageKey} size="thumb" mode="cover" wash={it.wash} fallbackLabel={it.label.slice(0, 1)} alt="" className="size-11 shrink-0 rounded-md" />
                            )}
                            <span className="min-w-0 flex-1">
                              <Highlight text={it.label} q={q} />
                              <span className="block truncate text-[12px] text-ink-500">
                                {it.kind === "shop" && <Store className="mr-1 inline size-3" />}
                                {it.sub}
                              </span>
                            </span>
                            {it.kind === "offer" && it.price && <span className="tabular shrink-0 text-[14px] font-extrabold text-ink-900">{it.price}</span>}
                            <ArrowUpRight className="size-4 shrink-0 text-ink-300" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              <button type="button" onClick={() => go(`/search?q=${encodeURIComponent(q.trim())}`)} className="h-11 rounded-md border border-hairline text-[14px] font-bold text-indigo-600 hover:bg-indigo-50">
                “{q.trim()}” ke saare results
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Highlight({ text, q }: { text: string; q: string }) {
  const t = q.trim();
  const i = t ? text.toLowerCase().indexOf(t.toLowerCase()) : -1;
  if (i < 0) return <span className="block truncate text-[14px] font-semibold text-ink-900">{text}</span>;
  return (
    <span className="block truncate text-[14px] font-semibold text-ink-900">
      {text.slice(0, i)}
      <mark className="rounded-[3px] bg-saffron-100 text-ink-900">{text.slice(i, i + t.length)}</mark>
      {text.slice(i + t.length)}
    </span>
  );
}
