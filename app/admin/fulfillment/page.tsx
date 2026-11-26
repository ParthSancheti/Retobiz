import type { Metadata } from "next";
import { AgencyKanban } from "@/components/admin/kanban";

export const metadata: Metadata = { title: "Agency Kanban" };

export default function Page() {
  return <AgencyKanban />;
}
