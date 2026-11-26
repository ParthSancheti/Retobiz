import type { Metadata } from "next";
import { ReferralsView } from "@/components/admin/referrals";

export const metadata: Metadata = { title: "Referrals" };

export default function Page() {
  return <ReferralsView />;
}
