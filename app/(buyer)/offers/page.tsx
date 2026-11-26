import type { Metadata } from "next";
import { DiscoveryView } from "@/components/buyer/discovery-view";

export const metadata: Metadata = { title: "Aaj ke Offers" };

export default function OffersPage() {
  return <DiscoveryView mode="offers" />;
}
