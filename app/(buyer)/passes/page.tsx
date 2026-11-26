import type { Metadata } from "next";
import { PassesView } from "@/components/buyer/passes-view";

export const metadata: Metadata = { title: "Mere VIP Passes" };

export default function PassesPage() {
  return <PassesView />;
}
