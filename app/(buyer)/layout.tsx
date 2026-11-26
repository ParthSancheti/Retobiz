import { BuyerTopBar, DemoUtilityBar } from "@/components/shell/buyer-top-bar";
import { BuyerFooter } from "@/components/shell/buyer-footer";
import { BottomNav, BUYER_NAV } from "@/components/shell/nav";
import { SearchOverlay } from "@/components/buyer/search-overlay";
import { LocationSheet } from "@/components/buyer/location-sheet";
import { ExploreMenuHost } from "@/components/buyer/explore-menu";
import { ReelViewerHost } from "@/components/buyer/reel-viewer";
import { ClaimSheetHost } from "@/components/buyer/claim-sheet-host";

export default function BuyerLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-surface">
      <DemoUtilityBar />
      <BuyerTopBar />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-28 lg:px-8 lg:pb-0">{children}</main>
      <BuyerFooter />
      <BottomNav items={BUYER_NAV} id="buyer" />
      <SearchOverlay />
      <LocationSheet />
      <ExploreMenuHost />
      <ReelViewerHost />
      <ClaimSheetHost />
    </div>
  );
}
