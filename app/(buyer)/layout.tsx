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
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-[linear-gradient(180deg,#FFF3D1_0%,#FFF9EC_220px,#FFFFFF_420px)]">
      <DemoUtilityBar />
      {/* Subtle top-edge frost veil behind the floating mobile header capsule */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-20 h-[76px] bg-gradient-to-b from-[#FFF8E6]/92 via-[#FFF9EC]/60 to-transparent backdrop-blur-[2px] lg:hidden"
      />
      <BuyerTopBar />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-16 lg:px-8 lg:pb-0">{children}</main>
      <BuyerFooter />
      {/* Subtle bottom-edge frost veil ONLY at the extreme screen bottom behind the floating dock */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-20 bg-gradient-to-t from-[#FFFBF2]/95 via-[#FFFBF2]/65 to-transparent backdrop-blur-[2px] lg:hidden"
      />
      <BottomNav items={BUYER_NAV} id="buyer" />
      <SearchOverlay />
      <LocationSheet />
      <ExploreMenuHost />
      <ReelViewerHost />
      <ClaimSheetHost />
    </div>
  );
}
