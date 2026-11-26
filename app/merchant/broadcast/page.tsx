import type { Metadata } from "next";
import { BroadcastView } from "@/components/merchant/broadcast-view";

export const metadata: Metadata = { title: "Broadcast" };

export default function Page() {
  return <BroadcastView />;
}
