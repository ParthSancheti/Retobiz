"use client";
import { useMemo, useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { useStore } from "@/store";
import { toast } from "@/store/ui";
import { Hydrated } from "@/components/shell/hydrated";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/chip";
import { RetailImage } from "@/components/media/retail-image";
import { CategoryTile } from "@/components/buyer/category-tile";
import { Card, Field, inputCls, PageHead, PageSkeleton } from "@/components/merchant/common";
import { IMAGES, type ImageKey } from "@/data/images";
import type { Category, Location, LocationLevel, Wash } from "@/lib/types";
import { cn } from "@/lib/cn";

const WASHES: Wash[] = ["mint", "peach", "sky", "cream", "lavender"];
const WASH_BG: Record<Wash, string> = { mint: "bg-wash-mint", peach: "bg-wash-peach", sky: "bg-wash-sky", cream: "bg-wash-cream", lavender: "bg-wash-lavender" };
const PICKABLE = (Object.keys(IMAGES) as ImageKey[]).filter((k) => IMAGES[k].tone === "cutout");

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onChange} className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", on ? "bg-leaf-500" : "bg-ink-300/50")}>
      <span className={cn("absolute top-0.5 left-0 size-5 rounded-full bg-white shadow-1 transition-transform", on ? "translate-x-[18px]" : "translate-x-0.5")} />
    </button>
  );
}

/* ───────────── Categories ───────────── */

export function CategoryMaster() {
  return (
    <Hydrated fallback={<PageSkeleton />}>
      <Categories />
    </Hydrated>
  );
}

function Categories() {
  const categories = useStore((s) => s.categories);
  const subCategories = useStore((s) => s.subCategories);
  const upsertCategory = useStore((s) => s.upsertCategory);
  const toggleCategory = useStore((s) => s.toggleCategory);
  const upsertSub = useStore((s) => s.upsertSubCategory);
  const toggleSub = useStore((s) => s.toggleSubCategory);
  const sorted = useMemo(() => [...categories].sort((a, b) => a.order - b.order), [categories]);
  const [selId, setSelId] = useState(sorted[0]?.id ?? "");
  const sel = categories.find((c) => c.id === selId);
  const subs = subCategories.filter((s) => s.categoryId === selId);
  const [subName, setSubName] = useState("");

  const [draft, setDraft] = useState<{ name: string; nameHi: string; wash: Wash; imageKey: ImageKey }>({ name: "", nameHi: "", wash: "mint", imageKey: "promo-new-shops" });
  const preview: Category = { id: "preview", slug: "preview", name: draft.name || "Nayi category", nameHi: draft.nameHi, wash: draft.wash, imageKey: draft.imageKey, glyph: "store", order: 0, active: true };

  return (
    <div>
      <PageHead eyebrow="Masters" title="Categories & sub-categories" sub="Yahan badlav turant Buyer category window, filters aur Merchant upload dropdowns mein dikhta hai." />
      <div className="grid grid-cols-1 gap-6 [&>*]:min-w-0 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4">
          <Card className="divide-y divide-hairline overflow-hidden">
            {sorted.map((c) => (
              <div key={c.id} className={cn("flex items-center gap-3 px-3 py-2.5", selId === c.id && "bg-indigo-50/60")}>
                <span className={cn("relative size-11 shrink-0 overflow-hidden rounded-md", WASH_BG[c.wash])}>{c.imageKey && <RetailImage imageKey={c.imageKey} size="thumb" alt="" className="size-full bg-transparent" />}</span>
                <button type="button" onClick={() => setSelId(c.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[14px] font-semibold", !c.active && "text-ink-300 line-through")}>{c.name}</span>
                    <span className="text-[12px] text-ink-500">
                      {c.nameHi} · {subCategories.filter((s) => s.categoryId === c.id).length} sub
                    </span>
                  </span>
                  <ChevronRight className="size-4 text-ink-300" />
                </button>
                <Toggle on={c.active} label={`${c.name} active`} onChange={() => toggleCategory(c.id)} />
              </div>
            ))}
          </Card>

          {sel && (
            <Card className="p-4">
              <div className="mb-3 text-[15px] font-bold">{sel.name} → sub-categories</div>
              <div className="flex flex-wrap gap-2">
                {subs.map((s) => (
                  <FilterChip key={s.id} selected={s.active} onClick={() => toggleSub(s.id)}>
                    {s.name}
                  </FilterChip>
                ))}
              </div>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (subName.trim().length < 2) return;
                  upsertSub({ name: subName.trim(), categoryId: sel.id });
                  toast({ message: `“${subName.trim()}” add hua — buyer filters aur merchant upload mein live`, tone: "success" });
                  setSubName("");
                }}
              >
                <input className={inputCls} value={subName} onChange={(e) => setSubName(e.target.value)} placeholder="Jaise: Smartwatch Straps" aria-label="Nayi sub-category" />
                <Button type="submit" variant="ink" icon={<Plus className="size-4" />}>
                  Add
                </Button>
              </form>
              <p className="mt-2 text-[12px] text-ink-500">Chip tap = active / inactive.</p>
            </Card>
          )}
        </div>

        <Card className="flex flex-col gap-4 self-start p-4 lg:sticky lg:top-8">
          <div className="text-[15px] font-bold">Nayi category</div>
          <div className="flex justify-center rounded-lg bg-bazaar py-4">
            <div className="w-24">
              <CategoryTile category={preview} href="#" />
            </div>
          </div>
          <Field label="Naam">
            <input className={inputCls} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Jaise: Toys & Games" />
          </Field>
          <Field label="Hindi naam">
            <input className={inputCls} value={draft.nameHi} onChange={(e) => setDraft({ ...draft, nameHi: e.target.value })} placeholder="खिलौने" />
          </Field>
          <div>
            <div className="mb-1.5 text-[13px] font-semibold">Wash</div>
            <div className="flex gap-2">
              {WASHES.map((w) => (
                <button key={w} type="button" aria-label={w} aria-pressed={draft.wash === w} onClick={() => setDraft({ ...draft, wash: w })} className={cn("size-8 rounded-full ring-2 ring-offset-2", WASH_BG[w], draft.wash === w ? "ring-indigo-500" : "ring-transparent")} />
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-[13px] font-semibold">Image</div>
            <div className="grid max-h-36 grid-cols-6 gap-1.5 overflow-y-auto">
              {PICKABLE.map((k) => (
                <button key={k} type="button" aria-label={k} aria-pressed={draft.imageKey === k} onClick={() => setDraft({ ...draft, imageKey: k })} className={cn("relative aspect-square overflow-hidden rounded-md bg-canvas ring-2", draft.imageKey === k ? "ring-indigo-500" : "ring-transparent")}>
                  <RetailImage imageKey={k} size="thumb" alt="" className="size-full bg-transparent" />
                </button>
              ))}
            </div>
          </div>
          <Button
            variant="primary-indigo"
            disabled={draft.name.trim().length < 3}
            onClick={() => {
              const c = upsertCategory({ name: draft.name.trim(), nameHi: draft.nameHi.trim() || undefined, wash: draft.wash, imageKey: draft.imageKey });
              setSelId(c.id);
              toast({ message: `${c.name} category live`, tone: "success" });
              setDraft({ name: "", nameHi: "", wash: "mint", imageKey: "promo-new-shops" });
            }}
          >
            Category add karein
          </Button>
        </Card>
      </div>
    </div>
  );
}

/* ───────────── Locations ───────────── */

const CHILD: Partial<Record<LocationLevel, LocationLevel>> = { state: "district", district: "city", city: "area" };

export function LocationMaster() {
  return (
    <Hydrated fallback={<PageSkeleton />}>
      <Locations />
    </Hydrated>
  );
}

function Locations() {
  const locations = useStore((s) => s.locations);
  const upsert = useStore((s) => s.upsertLocation);
  const shops = useStore((s) => s.shops);
  const [adding, setAdding] = useState<string | null>(null);
  const [name, setName] = useState("");
  const children = (id?: string) => locations.filter((l) => l.parentId === id);
  const roots = locations.filter((l) => !l.parentId);
  const shopCount = (areaId: string) => Object.values(shops).filter((s) => s.areaId === areaId).length;

  const add = (parent: Location) => {
    const level = CHILD[parent.level];
    if (!level || name.trim().length < 2) return;
    // New areas inherit a nearby centroid from a sibling so radius search works.
    const sib = children(parent.id).find((l) => l.lat != null);
    upsert({ name: name.trim(), level, parentId: parent.id, lat: sib?.lat ? sib.lat + 0.004 : parent.lat, lng: sib?.lng ? sib.lng + 0.004 : parent.lng });
    toast({ message: `${name.trim()} add hua — location sheet aur onboarding mein live`, tone: "success" });
    setName("");
    setAdding(null);
  };

  const renderNode = (loc: Location, depth: number) => {
    const kids = children(loc.id);
    const childLevel = CHILD[loc.level];
    return (
      <li key={loc.id}>
        <div className="flex items-center gap-2 py-1.5" style={{ paddingLeft: depth * 18 }}>
          <span className="rounded-sm bg-sunk px-1.5 py-0.5 text-[10px] font-bold tracking-[0.04em] text-ink-500 uppercase">{loc.level}</span>
          <span className="text-[14px] font-semibold">{loc.name}</span>
          {loc.level === "area" && <span className="text-[12px] text-ink-500">· {shopCount(loc.id)} shops</span>}
          {childLevel && (
            <button type="button" onClick={() => setAdding(adding === loc.id ? null : loc.id)} className="ml-auto inline-flex h-7 items-center gap-1 rounded-full px-2 text-[12px] font-bold text-indigo-600 hover:bg-indigo-50">
              <Plus className="size-3.5" /> {childLevel}
            </button>
          )}
        </div>
        {adding === loc.id && (
          <form
            className="mb-2 flex gap-2"
            style={{ paddingLeft: depth * 18 + 18 }}
            onSubmit={(e) => {
              e.preventDefault();
              add(loc);
            }}
          >
            <input autoFocus className={cn(inputCls, "h-9")} value={name} onChange={(e) => setName(e.target.value)} placeholder={`Naya ${childLevel}`} aria-label={`Naya ${childLevel}`} />
            <Button type="submit" variant="ink" size="sm">
              Add
            </Button>
          </form>
        )}
        {kids.length > 0 && (
          <ul className={cn(depth === 0 && "border-l border-hairline")}>
            {kids.map((k) => renderNode(k, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div>
      <PageHead eyebrow="Masters" title="Locations" sub="State → District → City → Area. Naye areas buyer location sheet aur onboarding mein turant dikhte hain." />
      <Card className="p-4">
        <ul>
          {roots.map((r) => renderNode(r, 0))}
        </ul>
      </Card>
    </div>
  );
}
