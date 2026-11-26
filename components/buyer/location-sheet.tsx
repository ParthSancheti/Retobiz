"use client";
import { LocateFixed, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import { useStore } from "@/store";
import { useUiStore, toast } from "@/store/ui";
import { DEFAULT_BUYER_AREA_ID } from "@/data/catalog";
import type { Location } from "@/lib/types";

export const RADIUS_OPTIONS = [1, 3, 5, 10, 25] as const;

/**
 * 4-tier location picker (State → District → City → Area) + nearby radius.
 * Writes buyerLocation, which drives Home rails and default /search scope.
 */
export function LocationSheet() {
  const open = useUiStore((s) => s.locationOpen);
  const setOpen = useUiStore((s) => s.setLocationOpen);
  const current = useStore((s) => s.buyerLocation);
  return (
    <Sheet open={open} onClose={() => setOpen(false)} title="Aap kahan hain?" description="Aas-paas ki dukaanein aur offers isi jagah se dikhenge.">
      {open && <LocationForm key={current.areaId + current.radiusKm} onDone={() => setOpen(false)} />}
    </Sheet>
  );
}

function chain(locations: Location[], areaId: string) {
  const byId = Object.fromEntries(locations.map((l) => [l.id, l]));
  const area = byId[areaId];
  const city = area?.parentId ? byId[area.parentId] : undefined;
  const district = city?.parentId ? byId[city.parentId] : undefined;
  const state = district?.parentId ? byId[district.parentId] : undefined;
  return { state: state?.id, district: district?.id, city: city?.id, area: area?.id };
}

function LocationForm({ onDone }: { onDone: () => void }) {
  const locations = useStore((s) => s.locations);
  const current = useStore((s) => s.buyerLocation);
  const setBuyerLocation = useStore((s) => s.setBuyerLocation);
  const init = useMemo(() => chain(locations, current.areaId), [locations, current.areaId]);
  const [stateId, setStateId] = useState<string | undefined>(init.state);
  const [districtId, setDistrictId] = useState<string | undefined>(init.district);
  const [cityId, setCityId] = useState<string | undefined>(init.city);
  const [areaId, setAreaId] = useState<string | undefined>(init.area);
  const [radius, setRadius] = useState(String(current.radiusKm));

  const kids = (parent?: string, level?: Location["level"]) => locations.filter((l) => l.level === level && (!parent || l.parentId === parent));
  const states = kids(undefined, "state");
  const districts = kids(stateId, "district");
  const cities = kids(districtId, "city");
  const areas = kids(cityId, "area");

  const apply = () => {
    if (!areaId) return;
    setBuyerLocation({ areaId, radiusKm: Number(radius) });
    toast({ message: `Location: ${locations.find((l) => l.id === areaId)?.name} · ${radius} km`, tone: "success" });
    onDone();
  };

  return (
    <div className="flex flex-col gap-5 pt-1">
      <button
        type="button"
        onClick={() => {
          const c = chain(locations, DEFAULT_BUYER_AREA_ID);
          setStateId(c.state);
          setDistrictId(c.district);
          setCityId(c.city);
          setAreaId(c.area);
        }}
        className="flex items-center gap-3 rounded-lg border border-flame-500/25 bg-flame-50 p-3 text-left"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-white">
          <LocateFixed className="size-5 text-flame-600" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-bold text-ink-900">Meri current location</span>
          <span className="block text-[12px] text-ink-500">Demo GPS · Akurdi, Pune (PCMC)</span>
        </span>
      </button>

      <Tier label="Rajya (State)" items={states} value={stateId} onPick={(id) => { setStateId(id); setDistrictId(undefined); setCityId(undefined); setAreaId(undefined); }} />
      {stateId && <Tier label="Zilla (District)" items={districts} value={districtId} onPick={(id) => { setDistrictId(id); setCityId(undefined); setAreaId(undefined); }} />}
      {districtId && <Tier label="Shehar (City)" items={cities} value={cityId} onPick={(id) => { setCityId(id); setAreaId(undefined); }} />}
      {cityId && <Tier label="Area" items={areas} value={areaId} onPick={setAreaId} icon />}

      <div>
        <div className="mb-2 text-[13px] font-semibold text-ink-900">Kitni door tak?</div>
        <Segmented id="radius" value={radius} onChange={setRadius} options={RADIUS_OPTIONS.map((r) => ({ value: String(r), label: `${r} km` }))} className="w-full justify-between" />
      </div>

      <Button variant="primary-flame" size="lg" full disabled={!areaId} onClick={apply}>
        {areaId ? `${locations.find((l) => l.id === areaId)?.name} ke ${radius} km mein dekhein` : "Area chunein"}
      </Button>
    </div>
  );
}

function Tier({ label, items, value, onPick, icon }: { label: string; items: Location[]; value?: string; onPick: (id: string) => void; icon?: boolean }) {
  return (
    <div>
      <div className="mb-2 text-[13px] font-semibold text-ink-900">{label}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((l) => (
          <FilterChip key={l.id} selected={l.id === value} onClick={() => onPick(l.id)} icon={icon ? <MapPin className="size-3.5 text-ink-500" /> : undefined}>
            {l.name}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}
