"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { beaconkitEnabled, hitFor, sendHit } from "@/lib/beaconkit";

// NEXT_PUBLIC_* values are inlined at build time. The key is public by design (it
// ships to every browser) and can only record page counts. Unset or malformed → off,
// the same way PostHog is off without NEXT_PUBLIC_POSTHOG_KEY.
const config = {
  endpoint: process.env.NEXT_PUBLIC_BEACONKIT_ENDPOINT ?? "https://api.beaconkit.dev",
  projectId: process.env.NEXT_PUBLIC_BEACONKIT_PROJECT_ID ?? "",
  apiKey: process.env.NEXT_PUBLIC_BEACONKIT_API_KEY ?? "",
};
const enabled = beaconkitEnabled(config);

/**
 * BeaconKit page counts (app.beaconkit.dev), alongside PostHog. One hit per
 * route, including client-side navigations. Sends the path only — never the
 * query string, which is where /share carries the roast — plus the referrer.
 */
export function BeaconKit() {
  const pathname = usePathname();
  // A ref so React re-running the effect (Strict Mode in dev) can't double-count.
  const previous = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !pathname) return;
    const hit = hitFor(pathname, previous.current, document.referrer, window.location.origin);
    previous.current = pathname;
    if (hit) sendHit(config, hit);
  }, [pathname]);

  return null;
}
