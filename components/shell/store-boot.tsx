"use client";
import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useStoreBoot } from "@/store/sync";
import { useUiStore } from "@/store/ui";
import type { Role } from "@/lib/types";

/** Role is derived from the URL — never persisted, so each tab keeps its own role. */
export function roleForPath(path: string): Role {
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/merchant")) return "merchant";
  return "buyer";
}

/** Rehydrates the store, keeps tabs in sync, and remembers the last route per role (per tab). */
export function StoreBoot() {
  useStoreBoot();
  return (
    <Suspense fallback={null}>
      <RouteMemory />
    </Suspense>
  );
}

function RouteMemory() {
  const pathname = usePathname();
  const rememberRoute = useUiStore((s) => s.rememberRoute);
  useEffect(() => {
    if (!pathname || pathname.startsWith("/list-your-shop") || pathname.startsWith("/q/")) return;
    rememberRoute(roleForPath(pathname), pathname);
  }, [pathname, rememberRoute]);
  return null;
}
