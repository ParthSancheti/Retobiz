import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Megaphone, QrCode, ReceiptIndianRupee, Store } from "lucide-react";

export const metadata: Metadata = { title: "More" };

const ITEMS = [
  { href: "/merchant/qr-standee", label: "QR Standee Studio", sub: "Counter poster + ₹49 doorstep standee", icon: QrCode },
  { href: "/merchant/broadcast", label: "WhatsApp Broadcast", sub: "Customers ko offer bhejein", icon: Megaphone },
  { href: "/merchant/profile", label: "Storefront Profile", sub: "Timing, address, showroom items", icon: Store },
  { href: "/merchant/plan", label: "Plan & Billing", sub: "Free vs Pro ₹999/saal", icon: ReceiptIndianRupee },
];

export default function MorePage() {
  return (
    <div>
      <h1 className="mb-4 text-[24px] leading-[30px] font-bold tracking-[-0.015em]">Aur tools</h1>
      <ul className="divide-y divide-hairline overflow-hidden rounded-lg border border-hairline bg-surface">
        {ITEMS.map(({ href, label, sub, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-canvas">
              <span className="flex size-10 items-center justify-center rounded-md bg-indigo-50">
                <Icon className="size-5 text-indigo-600" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-ink-900">{label}</span>
                <span className="block text-[13px] text-ink-500">{sub}</span>
              </span>
              <ChevronRight className="size-4 text-ink-300" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
