import type { Metadata } from "next";
import { QrEntry } from "@/components/buyer/qr-entry";
import { buildSeed, SSR_SEED_ANCHOR } from "@/data/seed";

export const metadata: Metadata = { title: "Swagat hai" };

export function generateStaticParams() {
  const seed = buildSeed(SSR_SEED_ANCHOR);
  return seed.shopOrder.map((id) => ({ shopId: seed.shops[id].qrCode }));
}

export default function QrPage() {
  return <QrEntry />;
}
