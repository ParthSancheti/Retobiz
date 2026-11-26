import type { Metadata } from "next";
import { QrOrdersView } from "@/components/admin/qr-orders";

export const metadata: Metadata = { title: "QR Orders" };

export default function Page() {
  return <QrOrdersView />;
}
