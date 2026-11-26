"use client";
import type { ReactNode } from "react";
import { useHydrated } from "@/store/sync";

/**
 * Hydration gate (IMPLEMENTATION_PLAN §3.2): store-driven UI renders only after the
 * persisted store is rehydrated on the client. Prerendered HTML shows `fallback`
 * (geometry-matched skeletons), so there's no SSR mismatch and no flash of stale seed.
 */
export function Hydrated({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return useHydrated() ? <>{children}</> : <>{fallback}</>;
}
