"use client";
/**
 * Ephemeral, per-tab UI state — deliberately NOT persisted.
 * Keeping it out of the persisted store matters for cross-tab sync: any set() on a
 * persisted store writes that tab's whole snapshot to localStorage, so a UI-only
 * update in a stale tab could overwrite another tab's fresh domain write.
 */
import { create } from "zustand";
import { nanoid } from "nanoid";

export interface Toast {
  id: string;
  message: string;
  tone?: "default" | "success" | "error";
  action?: { label: string; href?: string };
}

type Role = "buyer" | "merchant" | "admin";

interface UiState {
  hydrated: boolean;
  /** Per-tab memory so the Role Switcher returns you where you left off. */
  lastRouteByRole: Record<Role, string>;
  rememberRoute: (role: Role, path: string) => void;
  seenShutterShopIds: string[];
  toasts: Toast[];
  /** Bumped when another tab changed the store; drives the one-shot live-sync flash. */
  lastRemoteSyncAt: number;
  setHydrated: (v: boolean) => void;
  markShutterSeen: (shopId: string) => void;
  resetShutters: () => void;
  noteRemoteSync: () => void;
  pushToast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
  /** Buyer overlays opened from the shared top bar. */
  searchOpen: boolean;
  locationOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  setLocationOpen: (v: boolean) => void;
  /** One shared Follow/Claim sheet for every card (Zepto-style "ADD" → our opt-in). */
  claim: { shopId: string; offerId?: string; source?: "qr" | "follow" } | null;
  openClaim: (shopId: string, offerId?: string, source?: "qr" | "follow") => void;
  closeClaim: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  hydrated: false,
  lastRouteByRole: { buyer: "/", merchant: "/merchant", admin: "/admin" },
  rememberRoute: (role, path) => set((s) => ({ lastRouteByRole: { ...s.lastRouteByRole, [role]: path } })),
  seenShutterShopIds: [],
  toasts: [],
  lastRemoteSyncAt: 0,
  setHydrated: (v) => set({ hydrated: v }),
  markShutterSeen: (shopId) =>
    set((s) => (s.seenShutterShopIds.includes(shopId) ? s : { seenShutterShopIds: [...s.seenShutterShopIds, shopId] })),
  resetShutters: () => set({ seenShutterShopIds: [] }),
  noteRemoteSync: () => set({ lastRemoteSyncAt: Date.now() }),
  pushToast: (t) => set((s) => ({ toasts: [...s.toasts, { id: nanoid(6), ...t }].slice(-3) })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  searchOpen: false,
  locationOpen: false,
  setSearchOpen: (v) => set({ searchOpen: v }),
  setLocationOpen: (v) => set({ locationOpen: v }),
  claim: null,
  openClaim: (shopId, offerId, source) => set({ claim: { shopId, offerId, source } }),
  closeClaim: () => set({ claim: null }),
}));

export const toast = (t: Omit<Toast, "id">) => useUiStore.getState().pushToast(t);
