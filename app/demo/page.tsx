import type { Metadata } from "next";
import { DemoLauncher } from "@/components/demo/demo-launcher";

export const metadata: Metadata = { title: "Demo" };

export default function Page() {
  return <DemoLauncher />;
}
