import type { Metadata } from "next";
import { DiscoveryView } from "@/components/buyer/discovery-view";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return <DiscoveryView mode="search" />;
}
