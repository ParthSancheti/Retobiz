import type { Metadata } from "next";
import { StudioView } from "@/components/merchant/studio-view";

export const metadata: Metadata = { title: "Studio" };

export default function Page() {
  return <StudioView />;
}
