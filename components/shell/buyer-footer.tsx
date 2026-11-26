import Link from "next/link";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { ButtonLink } from "@/components/ui/button";

export function BuyerFooter() {
  return (
    <footer className="mt-12 border-t border-hairline bg-surface">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 pt-8 pb-28 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:pb-10">
        <div>
          <BrandLockup size="md" withTagline />
          <p className="mt-3 text-[13px] text-ink-500">Made for Bharat ki dukaanein · Pune · Nashik · Malegaon</p>
        </div>
        <div className="flex flex-col gap-3 rounded-lg bg-saffron-50 p-4 lg:flex-row lg:items-center lg:gap-5 lg:p-5">
          <div>
            <div className="font-display text-[16px] font-bold text-ink-900">Aapki bhi dukaan hai?</div>
            <p className="text-[13px] text-ink-700">2 minute mein free storefront. Pehla offer free.</p>
          </div>
          <ButtonLink href="/list-your-shop" variant="primary-flame" size="md">
            Apni Dukaan List Karein
          </ButtonLink>
        </div>
      </div>
      <div className="mx-auto hidden max-w-[1280px] gap-5 px-8 pb-8 text-[12px] text-ink-500 lg:flex">
        <Link href="/offers" className="hover:text-ink-900">Aaj ke Offers</Link>
        <Link href="/search" className="hover:text-ink-900">Dukaan khojein</Link>
        <Link href="/passes" className="hover:text-ink-900">My VIP Passes</Link>
      </div>
    </footer>
  );
}
