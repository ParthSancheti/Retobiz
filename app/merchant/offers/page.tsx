import type { Metadata } from "next";
import { OffersView } from "@/components/merchant/offers-view";

export const metadata: Metadata = { title: "Offers" };

export default function Page() {
  return <OffersView />;
}
