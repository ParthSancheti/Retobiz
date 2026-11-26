import type { Metadata } from "next";
import { DiscoveryView } from "@/components/buyer/discovery-view";
import { SEED_CATEGORIES } from "@/data/catalog";

export const metadata: Metadata = { title: "Category" };

/** Seed categories prerender; admin-added categories resolve client-side from the store. */
export function generateStaticParams() {
  return SEED_CATEGORIES.map((c) => ({ slug: c.slug }));
}

export default function CategoryPage() {
  return <DiscoveryView mode="category" />;
}
