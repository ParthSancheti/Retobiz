"use client";
import { Check, Sparkles } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";
import { toast } from "@/store/ui";
import { PRO_MONTHLY_CREDITS, PRO_PRICE_YEARLY } from "@/data/agency-templates";

export const PRO_PERKS = [
  "Unlimited live offers — har din naya deal",
  `${PRO_MONTHLY_CREDITS} free Studio credits har mahine (reel / poster)`,
  "Studio ke baaki kaam par 40% off",
  "Search mein ‘Pro’ badge + upar ranking",
  "WhatsApp broadcast templates + scheduling",
];

/** ₹999/yr Pro paywall (DESIGN §6 / Journey 3). Demo toggle upgrades instantly. */
export function PaywallSheet({ open, onClose, onUpgraded, shopId }: { open: boolean; onClose: () => void; onUpgraded?: () => void; shopId: string }) {
  const setPlan = useStore((s) => s.setPlan);
  const upgrade = () => {
    setPlan(shopId, "pro");
    toast({ message: "Pro activate ho gaya — ab unlimited offers daaliye", tone: "success" });
    onUpgraded?.();
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title="Free plan mein 1 live offer hai" description="Doosra offer live karne ke liye Retobiz Pro lijiye — ek saree bikne se poora saal ka kharcha nikal jaata hai.">
      <div className="overflow-hidden rounded-xl bg-gradient-to-br from-saffron-400 via-saffron-400 to-flame-500 p-5 text-ink-900">
        <div className="flex items-center gap-2 text-[12px] font-extrabold tracking-[0.08em] uppercase">
          <Sparkles className="size-4" /> Retobiz Pro
        </div>
        <div className="mt-2 flex items-end gap-2">
          <span className="tabular text-[40px] leading-none font-extrabold tracking-[-0.03em]">₹{PRO_PRICE_YEARLY}</span>
          <span className="pb-1 text-[14px] font-semibold">/saal · sirf ₹83/mahina</span>
        </div>
        <ul className="mt-4 flex flex-col gap-2">
          {PRO_PERKS.map((p) => (
            <li key={p} className="flex items-start gap-2 text-[14px] font-medium">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-ink-900 text-white">
                <Check className="size-3" strokeWidth={3} />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Button variant="ink" size="lg" full onClick={upgrade}>
          Pro lein · ₹{PRO_PRICE_YEARLY}/saal
        </Button>
        <p className="text-center text-[12px] text-ink-500">Demo mode: payment nahi lagega, turant upgrade hoga.</p>
        <Button variant="ghost" size="md" full onClick={onClose}>
          Abhi nahi
        </Button>
      </div>
    </Sheet>
  );
}
