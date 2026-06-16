"use client";

import { useEffect, type ReactNode } from "react";
import posthog from "posthog-js";

let initialized = false;

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (initialized) return;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
    if (!key) return;
    posthog.init(key, { api_host: host, capture_pageview: "history_change", capture_pageleave: true });
    initialized = true;
  }, []);
  return <>{children}</>;
}

export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    posthog.capture(event, props);
  } catch {}
}
