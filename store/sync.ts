"use client";
import { useEffect } from "react";
import { isPlaceholderSeed, STORAGE_KEY, useStore } from "./index";
import { useUiStore } from "./ui";

/**
 * Boots the persisted store on the client and keeps tabs in sync.
 * - rehydrates from localStorage (skipHydration avoids SSR mismatch)
 * - first visit on a device → fresh seed anchored to Date.now()
 * - `storage` events from other tabs → rehydrate + live-sync flash
 */
export function useStoreBoot() {
  useEffect(() => {
    let cancelled = false;
    const api = useStore.persist;

    Promise.resolve(api.rehydrate()).then(() => {
      if (cancelled) return;
      const st = useStore.getState();
      if (isPlaceholderSeed(st.seededAt)) st.resetDemo({ silent: true });
      useUiStore.getState().setHydrated(true);
    });

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.storageArea !== localStorage) return;
      if (e.newValue === null) {
        // Storage cleared in another tab → reseed here too.
        useStore.getState().resetDemo({ silent: true });
        return;
      }
      // Rehydrate first (no local set() before it), then mark the sync for the flash.
      Promise.resolve(api.rehydrate()).then(() => useUiStore.getState().noteRemoteSync());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, []);
}

export function useHydrated() {
  return useUiStore((s) => s.hydrated);
}
