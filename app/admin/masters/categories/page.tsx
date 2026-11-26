import type { Metadata } from "next";
import { CategoryMaster } from "@/components/admin/masters";

export const metadata: Metadata = { title: "Category Master" };

export default function Page() {
  return <CategoryMaster />;
}
