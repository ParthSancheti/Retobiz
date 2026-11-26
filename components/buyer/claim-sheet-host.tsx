"use client";
import { useStore } from "@/store";
import { useUiStore } from "@/store/ui";
import { FollowSheet } from "./follow-sheet";

/** Single opt-in sheet for every card's "Claim" / "Follow" action, mounted once in the buyer layout. */
export function ClaimSheetHost() {
  const claim = useUiStore((s) => s.claim);
  const closeClaim = useUiStore((s) => s.closeClaim);
  const shop = useStore((s) => (claim ? s.shops[claim.shopId] : undefined));
  const offerTitle = useStore((s) => (claim?.offerId ? s.offers[claim.offerId]?.title : undefined));
  return (
    <FollowSheet
      key={claim ? `${claim.shopId}-${claim.offerId ?? ""}` : "none"}
      shop={shop ?? null}
      open={!!claim && !!shop}
      onClose={closeClaim}
      source={claim?.source ?? "follow"}
      offerTitle={offerTitle}
    />
  );
}
