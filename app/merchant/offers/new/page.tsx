import type { Metadata } from "next";
import { OfferComposer } from "@/components/merchant/offer-composer";

export const metadata: Metadata = { title: "Naya Offer" };

export default function Page() {
  return <OfferComposer />;
}
