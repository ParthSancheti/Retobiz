"use client";
import { Check, LocateFixed, MapPin, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";
import { useUiStore, toast } from "@/store/ui";
import { DEFAULT_BUYER_AREA_ID } from "@/data/catalog";
import { cn } from "@/lib/cn";

export const RADIUS_OPTIONS = [1, 3, 5, 10, 25] as const;
const QUICK_RADIUS = [3, 5, 10, 25] as const;

/**
 * Minimal Blinkit-style Location Selector:
 * 1) 1-tap "Use Current Location" (applies instantly)
 * 2) Instant area/city search
 * 3) Clean City-grouped Areas + compact Radius selector
 */
export function LocationSheet() {
  const open = useUiStore((s) => s.locationOpen);
  const setOpen = useUiStore((s) => s.setLocationOpen);
  const current = useStore((s) => s.buyerLocation);
  return (
    <Sheet open={open} onClose={() => setOpen(false)} title="Choose location" description="Select your neighborhood to see nearby verified shops & offers.">
      {open && <LocationForm key={current.areaId + current.radiusKm} onDone={() => setOpen(false)} />}
    </Sheet>
  );
}

function LocationForm({ onDone }: { onDone: () => void }) {
  const locations = useStore((s) => s.locations);
  const current = useStore((s) => s.buyerLocation);
  const setBuyerLocation = useStore((s) => s.setBuyerLocation);
  const [query, setQuery] = useState("");
  const [areaId, setAreaId] = useState(current.areaId);
  const [radiusKm, setRadiusKm] = useState(current.radiusKm);

  const byId = useMemo(() => Object.fromEntries(locations.map((l) => [l.id, l])), [locations]);
  const defaultArea = byId[DEFAULT_BUYER_AREA_ID];
  const defaultCity = defaultArea?.parentId ? byId[defaultArea.parentId] : undefined;

  const groupedByCity = useMemo(() => {
    const cities = locations.filter((l) => l.level === "city");
    const areas = locations.filter((l) => l.level === "area");
    const term = query.trim().toLowerCase();

    return cities
      .map((city) => {
        const cleanCity = city.name.replace(" (PCMC)", "");
        const cityMatches = term && cleanCity.toLowerCase().includes(term);
        const kids = areas.filter(
          (a) => a.parentId === city.id && (!term || cityMatches || a.name.toLowerCase().includes(term)),
        );
        return { city, cleanCity, areas: kids };
      })
      .filter((g) => g.areas.length > 0);
  }, [locations, query]);

  const applyInstant = (nextAreaId: string, nextRadius = radiusKm) => {
    setBuyerLocation({ areaId: nextAreaId, radiusKm: nextRadius });
    const loc = byId[nextAreaId];
    toast({ message: `Location set: ${loc?.name ?? "Akurdi"} · ${nextRadius} km`, tone: "success" });
    onDone();
  };

  return (
    <div className="flex flex-col gap-4 pt-1">
      {/* 1. Search area or city */}
      <label className="flex h-11 items-center gap-2.5 rounded-2xl border border-black/[0.08] bg-canvas px-3.5 transition-colors focus-within:border-indigo-500 focus-within:bg-white">
        <Search className="size-4 shrink-0 text-ink-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search area or city (e.g. Akurdi, Nashik)…"
          className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-ink-900 outline-none placeholder:text-ink-300"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-ink-400 hover:text-ink-700">
            <X className="size-4" />
          </button>
        )}
      </label>

      {/* 2. 1-tap Blinkit-style GPS detection */}
      <button
        type="button"
        onClick={() => applyInstant(DEFAULT_BUYER_AREA_ID, radiusKm)}
        className="group flex items-center gap-3.5 rounded-2xl border border-flame-500/20 bg-flame-50/75 p-3.5 text-left transition-all duration-200 hover:border-flame-500/40 hover:bg-flame-50 active:scale-[0.99]"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-flame-600 shadow-1">
          <LocateFixed className="size-5" strokeWidth={2.1} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-bold text-ink-900">Use Current Location</span>
          <span className="block truncate text-[12px] text-ink-500">
            {defaultArea?.name ?? "Akurdi"}, {(defaultCity?.name ?? "Pune").replace(" (PCMC)", "")} · Instant GPS
          </span>
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-bold text-flame-600 shadow-1">Detect</span>
      </button>

      {/* 3. Calm city-grouped neighborhoods */}
      <div className="flex flex-col gap-3.5">
        {groupedByCity.length === 0 ? (
          <p className="rounded-2xl bg-canvas px-4 py-6 text-center text-[13px] text-ink-500">
            No matching neighborhood found for “{query}”.
          </p>
        ) : (
          groupedByCity.map((group) => (
            <div key={group.city.id}>
              <div className="mb-2 text-[11px] font-bold tracking-[0.06em] text-ink-500 uppercase">{group.cleanCity}</div>
              <div className="flex flex-wrap gap-2">
                {group.areas.map((a) => {
                  const selected = a.id === areaId;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAreaId(a.id)}
                      className={cn(
                        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-all duration-200 active:scale-[0.97]",
                        selected
                          ? "border-ink-900 bg-ink-900 text-white shadow-1"
                          : "border-black/[0.08] bg-white text-ink-800 hover:border-black/[0.2] hover:bg-canvas",
                      )}
                    >
                      {selected ? <Check className="size-3.5 text-saffron-400" strokeWidth={2.5} /> : <MapPin className="size-3.5 text-ink-400" />}
                      {a.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Subtle distance radius strip */}
      <div className="flex items-center justify-between gap-2 rounded-2xl bg-canvas px-3.5 py-2.5">
        <span className="text-[12.5px] font-semibold text-ink-600">Radius</span>
        <div className="flex items-center gap-1.5">
          {QUICK_RADIUS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRadiusKm(r)}
              className={cn(
                "h-7 rounded-full px-2.5 text-[12px] font-bold transition-colors",
                radiusKm === r ? "bg-ink-900 text-white" : "bg-white text-ink-600 hover:text-ink-900",
              )}
            >
              {r} km
            </button>
          ))}
        </div>
      </div>

      <Button variant="primary-flame" size="lg" full onClick={() => applyInstant(areaId, radiusKm)}>
        Show {byId[areaId]?.name ?? "Akurdi"} ({radiusKm} km)
      </Button>
    </div>
  );
}
