"use client";
import { useMemo } from "react";
import { useStore } from "@/store";
import type { DiscoveryContext } from "@/store/selectors";
import type { Category, Location, SubCategory } from "@/lib/types";

/** Memoised discovery context from raw slices (never build new objects inside useStore selectors). */
export function useDiscoveryCtx(): DiscoveryContext {
  const shops = useStore((s) => s.shops);
  const offers = useStore((s) => s.offers);
  const categories = useStore((s) => s.categories);
  const subCategories = useStore((s) => s.subCategories);
  const locations = useStore((s) => s.locations);
  return useMemo(() => ({ shops, offers, categories, subCategories, locations }), [shops, offers, categories, subCategories, locations]);
}

export function useLookups() {
  const categories = useStore((s) => s.categories);
  const subCategories = useStore((s) => s.subCategories);
  const locations = useStore((s) => s.locations);
  return useMemo(
    () => ({
      catById: Object.fromEntries(categories.map((c) => [c.id, c])) as Record<string, Category>,
      subById: Object.fromEntries(subCategories.map((c) => [c.id, c])) as Record<string, SubCategory>,
      locById: Object.fromEntries(locations.map((l) => [l.id, l])) as Record<string, Location>,
    }),
    [categories, subCategories, locations],
  );
}
