import type { Metadata } from "next";
import { QrStandeeView } from "@/components/merchant/qr-standee-view";

export const metadata: Metadata = { title: "QR Standee" };

export default function Page() {
  return <QrStandeeView />;
}
