import type { Metadata } from "next";
import { StorefrontView } from "@/components/buyer/storefront-view";
import { buildSeed, SSR_SEED_ANCHOR } from "@/data/seed";

export const metadata: Metadata = { title: "Dukaan" };

/** Seed shops prerender; onboarded shops resolve client-side from the store. */
export function generateStaticParams() {
  const seed = buildSeed(SSR_SEED_ANCHOR);
  return seed.shopOrder.map((id) => ({ slug: seed.shops[id].slug }));
}

export default function ShopPage() {
  return <StorefrontView />;
}
