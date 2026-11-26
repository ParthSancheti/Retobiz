import type { Metadata } from "next";
import { MerchantHome } from "@/components/merchant/merchant-home";

export const metadata: Metadata = { title: "Merchant Home" };

export default function Page() {
  return <MerchantHome />;
}
