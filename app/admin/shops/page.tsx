import type { Metadata } from "next";
import { ShopsTable } from "@/components/admin/shops-table";

export const metadata: Metadata = { title: "Shops" };

export default function Page() {
  return <ShopsTable />;
}
