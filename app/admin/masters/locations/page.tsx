import type { Metadata } from "next";
import { LocationMaster } from "@/components/admin/masters";

export const metadata: Metadata = { title: "Location Master" };

export default function Page() {
  return <LocationMaster />;
}
