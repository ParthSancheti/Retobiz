import type { Metadata } from "next";
import { ListYourShop } from "@/components/onboarding/list-your-shop";

export const metadata: Metadata = { title: "List your shop" };

export default function Page() {
  return <ListYourShop />;
}
