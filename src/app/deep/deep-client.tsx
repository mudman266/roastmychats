"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DeepRoast } from "@/lib/anthropic";
import { track } from "@/components/posthog-provider";

type State =
  | { kind: "loading"; progress: string }
  | { kind: "result"; roast: DeepRoast }
  | { kind: "error"; message: string };

export function DeepClient({ sessionId }: { sessionId: string | null }) {
  const [state, setState] = useState<State>({ kind: "loading", progress: "verifying payment" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!sessionId) {
        setState({ kind: "error", message: "missing session_id — start from the home page" });
        return;
      }
      const digest = sessionStorage.getItem("rmc_digest");
      if (!digest) {
        setState({
          kind: "error",
          message:
            "your original upload session is gone (cleared browser? different tab?). re-upload from the home page to get a fresh deep roast — your payment is logged.",
        });
        return;
      }
      setState({ kind: "loading", progress: "writing the deep roast — ~30 seconds" });
      try {
        const res = await fetch("/api/deep", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, digest }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
        if (cancelled) return;
        track("deep_roast_received", { archetype: data.roast.archetype });
        setState({ kind: "result", roast: data.roast as DeepRoast });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "unknown error";
        track("deep_roast_error", { message });
        setState({ kind: "error", message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (state.kind === "loading") {
    return (
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-elev)] p-12 text-center">
        <div className="font-mono text-sm uppercase tracking-widest text-[var(--accent)]">working</div>
        <div className="mt-4 text-2xl font-medium">{state.progress}</div>
      </div>
    );
  }
  if (state.kind === "error") {
    return (
      <div className="rounded-3xl border border-red-900 bg-red-950/30 p-8 text-center">
        <div className="text-xl text-red-300">{state.message}</div>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-black"
        >
          back to upload
        </Link>
      </div>
    );
  }
  const r = state.roast;
  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-3xl border-2 border-[var(--accent)] bg-gradient-to-b from-[#1a0a0a] to-[#0a0a0a] p-10 shadow-2xl">
        <div className="font-mono text-sm uppercase tracking-widest text-[var(--accent)]">you are</div>
        <h2 className="mt-2 text-5xl font-extrabold leading-tight">{r.archetype}</h2>
        <div className="mt-4 inline-flex items-center gap-3 rounded-full bg-[var(--bg-elev)] px-4 py-1 text-sm text-[var(--muted)]">
          <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          cooked score: <span className="font-mono text-[var(--accent)]">{r.score}/100</span>
        </div>
        <ol className="mt-10 space-y-6">
          {r.evidence.map((line, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] font-bold text-black">
                {i + 1}
              </span>
              <span className="text-xl leading-relaxed">{line}</span>
            </li>
          ))}
        </ol>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 border-t border-[var(--border)] pt-6">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">your inner-monologue song</div>
            <div className="mt-2 text-lg">{r.playlist_pick}</div>
          </div>
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">the fix</div>
            <div className="mt-2 text-lg">{r.the_fix}</div>
          </div>
        </div>
        <div className="mt-10 border-t border-[var(--border)] pt-6">
          <div className="font-mono text-sm uppercase tracking-widest text-[var(--accent)]">the verdict</div>
          <div className="mt-2 text-2xl font-medium leading-snug whitespace-pre-line">{r.verdict}</div>
        </div>
      </div>
      <Link href="/" className="block text-center text-[var(--muted)] hover:text-[var(--accent)]">
        ← roast another export
      </Link>
    </div>
  );
}
