"use client";
import { Check, Minus, Sparkles } from "lucide-react";
import { useStore } from "@/store";
import { toast } from "@/store/ui";
import { Hydrated } from "@/components/shell/hydrated";
import { Button } from "@/components/ui/button";
import { PRO_MONTHLY_CREDITS, PRO_PRICE_YEARLY } from "@/data/agency-templates";
import { cn } from "@/lib/cn";
import { Card, PageHead, PageSkeleton, useActiveShop } from "./common";

const ROWS: [string, string | boolean, string | boolean][] = [
  ["Dukaan ka online storefront + QR", true, true],
  ["Showroom products", "Unlimited", "Unlimited"],
  ["Live offers / deals", "1", "Unlimited"],
  ["WhatsApp followers (CRM)", true, true],
  ["WhatsApp broadcast", "Basic", "Templates + bulk"],
  ["Studio credits (reel / poster)", false, `${PRO_MONTHLY_CREDITS} / mahina`],
  ["Studio add-ons", "List price", "40% off"],
  ["Search mein Pro badge + ranking", false, true],
];

export function PlanView() {
  return (
    <Hydrated fallback={<PageSkeleton />}>
      <Content />
    </Hydrated>
  );
}

function Cell({ v }: { v: string | boolean }) {
  if (v === true) return <Check className="mx-auto size-4 text-leaf-600" strokeWidth={3} />;
  if (v === false) return <Minus className="mx-auto size-4 text-ink-300" />;
  return <span className="text-[13px] font-semibold">{v}</span>;
}

function Content() {
  const { shop } = useActiveShop();
  const setPlan = useStore((s) => s.setPlan);
  if (!shop) return <PageSkeleton />;
  const pro = shop.plan === "pro";
  const credits = Math.max(0, PRO_MONTHLY_CREDITS - shop.agencyCredits.used);

  return (
    <div>
      <PageHead eyebrow="Plan & Billing" title={pro ? "Aap Retobiz Pro par hain" : "Free plan"} sub={pro ? `${credits}/${PRO_MONTHLY_CREDITS} Studio credits is mahine bache hain` : "1 live offer free. Zyada grahak chahiye? Pro lijiye."} />

      <div className="grid grid-cols-1 gap-4 [&>*]:min-w-0 lg:grid-cols-2">
        <Card className={cn("p-5", !pro && "ring-2 ring-indigo-500")}>
          <div className="text-[12px] font-bold tracking-[0.08em] text-ink-500 uppercase">Free</div>
          <div className="mt-1 text-[32px] leading-none font-extrabold">₹0</div>
          <p className="mt-2 text-[14px] text-ink-500">Shuru karne ke liye — storefront, QR aur 1 offer.</p>
          {!pro ? (
            <div className="mt-4 inline-flex h-9 items-center rounded-full bg-indigo-50 px-3 text-[13px] font-bold text-indigo-700">Current plan</div>
          ) : (
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => {
                setPlan(shop.id, "free");
                toast({ message: "Demo: Free plan par wapas", tone: "default" });
              }}
            >
              Demo: Free par wapas jaayein
            </Button>
          )}
        </Card>
        <div className={cn("rounded-lg bg-gradient-to-br from-saffron-400 to-flame-500 p-5 text-ink-900", pro && "ring-2 ring-ink-900")}>
          <div className="flex items-center gap-1.5 text-[12px] font-extrabold tracking-[0.08em] uppercase">
            <Sparkles className="size-4" /> Pro
          </div>
          <div className="mt-1 flex items-end gap-2">
            <span className="tabular text-[32px] leading-none font-extrabold">₹{PRO_PRICE_YEARLY}</span>
            <span className="pb-0.5 text-[14px] font-semibold">/saal</span>
          </div>
          <p className="mt-2 text-[14px] font-medium">Ek Paithani bikne se poora saal free. Unlimited offers + Studio credits.</p>
          {pro ? (
            <div className="mt-4 inline-flex h-9 items-center rounded-full bg-ink-900 px-3 text-[13px] font-bold text-white">Active ✓</div>
          ) : (
            <Button
              variant="ink"
              className="mt-4"
              onClick={() => {
                setPlan(shop.id, "pro");
                toast({ message: "Pro activate ho gaya", tone: "success" });
              }}
            >
              Pro lein (demo)
            </Button>
          )}
        </div>
      </div>

      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-left text-[14px]">
          <thead className="bg-canvas text-[12px] font-bold tracking-[0.04em] text-ink-500 uppercase">
            <tr>
              <th className="px-4 py-3">Feature</th>
              <th className="w-24 px-2 py-3 text-center">Free</th>
              <th className="w-28 px-2 py-3 text-center">Pro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {ROWS.map(([f, a, b]) => (
              <tr key={f}>
                <td className="px-4 py-3">{f}</td>
                <td className="px-2 py-3 text-center">
                  <Cell v={a} />
                </td>
                <td className="px-2 py-3 text-center">
                  <Cell v={b} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
