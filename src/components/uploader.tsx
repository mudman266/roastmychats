"use client";

import { useCallback, useRef, useState } from "react";
import { parseExportZip, parseConversationsJson, buildDigest, type UserMessage } from "@/lib/parse-export";
import type { FreeRoast } from "@/lib/anthropic";

type State =
  | { kind: "idle" }
  | { kind: "uploading"; progress: string }
  | { kind: "result"; roast: FreeRoast; d: string; digest: string }
  | { kind: "error"; message: string };

export function Uploader() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const lower = file.name.toLowerCase();
    const isZip = lower.endsWith(".zip") || file.type === "application/zip";
    const isJson = lower.endsWith(".json") || file.type === "application/json";
    if (!isZip && !isJson) {
      setState({
        kind: "error",
        message: "send a .zip from your ChatGPT/Claude export, or any conversations.json directly",
      });
      return;
    }

    try {
      setState({ kind: "uploading", progress: "reading file" });
      let messages: UserMessage[] = [];
      if (isZip) {
        setState({ kind: "uploading", progress: "unzipping export" });
        const buf = await file.arrayBuffer();
        messages = await parseExportZip(buf);
      } else {
        setState({ kind: "uploading", progress: "parsing conversations" });
        const text = await file.text();
        messages = parseConversationsJson(text);
      }

      if (messages.length < 3) {
        throw new Error(
          `only found ${messages.length} user messages — need at least 3 to roast. is this the right file?`,
        );
      }

      setState({ kind: "uploading", progress: `digesting ${messages.length} messages` });
      const digest = buildDigest(messages);

      setState({ kind: "uploading", progress: "writing your roast" });
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ digest }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.error ?? `roast service returned HTTP ${res.status}`);

      const { roast, d } = data as { roast: FreeRoast; d: string };
      try {
        sessionStorage.setItem("rmc_digest", digest);
        sessionStorage.setItem("rmc_roast", JSON.stringify(roast));
        sessionStorage.setItem("rmc_d", d);
      } catch {
        // sessionStorage quota exceeded — deep roast will require re-upload after payment.
      }
      setState({ kind: "result", roast, d, digest });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "something broke during the upload";
      setState({ kind: "error", message });
    }
  }, []);

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) await handleFile(file);
    },
    [handleFile],
  );

  const onPickFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) await handleFile(file);
    },
    [handleFile],
  );

  const onPay = useCallback(async () => {
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await safeJson(res);
      if (!res.ok || !data.url) throw new Error(data?.error ?? "checkout failed");
      window.location.href = data.url as string;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "unknown error";
      alert(`checkout error: ${message}`);
    }
  }, []);

  if (state.kind === "uploading") {
    return (
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-elev)] p-12 text-center">
        <div className="font-mono text-sm uppercase tracking-widest text-[var(--accent)]">working</div>
        <div className="mt-4 text-2xl font-medium">{state.progress}</div>
        <div className="mt-6 text-sm text-[var(--muted)]">heavy exports may take ~30 seconds</div>
        <div className="mx-auto mt-8 h-1 w-48 overflow-hidden rounded-full bg-[var(--border)]">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-[var(--accent)]" />
        </div>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="rounded-3xl border border-red-900 bg-red-950/30 p-8 text-center">
        <div className="text-xl text-red-300">{state.message}</div>
        <button
          onClick={() => setState({ kind: "idle" })}
          className="mt-6 rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-black hover:brightness-110"
        >
          try again
        </button>
      </div>
    );
  }

  if (state.kind === "result") {
    return <ResultCard roast={state.roast} d={state.d} onPay={onPay} />;
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`rounded-3xl border-2 border-dashed p-12 text-center transition-all ${
        dragOver ? "border-[var(--accent)] bg-[var(--bg-elev)]" : "border-[var(--border)] bg-transparent"
      }`}
    >
      <div className="mb-4 text-6xl">📂</div>
      <div className="text-2xl font-semibold">drop your ChatGPT export here</div>
      <div className="mt-3 text-[var(--muted)]">
        the <span className="font-mono text-[var(--accent)]">.zip</span> you get by email when you click
        <span className="mx-1 rounded bg-[var(--bg-elev)] px-2 py-0.5 font-mono text-sm text-[var(--accent)]">
          Settings → Data Controls → Export
        </span>
      </div>
      <div className="mt-2 text-xs text-[var(--muted)]">
        also accepts: a raw <span className="font-mono">conversations.json</span> · Claude exports · most JSON chat formats
      </div>
      <input
        ref={fileInput}
        type="file"
        accept=".zip,.json,application/zip,application/json"
        onChange={onPickFile}
        className="hidden"
      />
      <button
        onClick={() => fileInput.current?.click()}
        className="mt-8 rounded-full bg-[var(--accent)] px-8 py-3 font-semibold text-black hover:brightness-110"
      >
        or click to pick a file
      </button>
      <div className="mt-8 text-xs text-[var(--muted)]">
        parsing happens in your browser — open DevTools → Network and watch.
        <br />
        only an anonymized text digest is POSTed to our server. no database, no disk writes.{" "}
        <a href="/privacy" className="text-[var(--accent)] underline">how to verify ↗</a>
      </div>
    </div>
  );
}

async function safeJson(res: Response): Promise<{ error?: string; url?: string; [k: string]: unknown }> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text.slice(0, 200) || `non-JSON response (HTTP ${res.status})` };
  }
}

function ResultCard({ roast, d, onPay }: { roast: FreeRoast; d: string; onPay: () => void }) {
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/share?d=${encodeURIComponent(d)}` : "";
  const tweet = `i let an AI read all my chatgpt conversations and roast me. it called me "${roast.archetype}" and i am not okay. ${shareUrl}`;
  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-3xl border-2 border-[var(--accent)] bg-gradient-to-b from-[#1a0a0a] to-[#0a0a0a] p-10 shadow-2xl">
        <div className="font-mono text-sm uppercase tracking-widest text-[var(--accent)]">you are</div>
        <h2 className="mt-2 text-5xl font-extrabold leading-tight">{roast.archetype}</h2>
        <div className="mt-4 inline-flex items-center gap-3 rounded-full bg-[var(--bg-elev)] px-4 py-1 text-sm text-[var(--muted)]">
          <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          cooked score: <span className="font-mono text-[var(--accent)]">{roast.score}/100</span>
        </div>
        <ol className="mt-10 space-y-6">
          {roast.evidence.map((line, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] font-bold text-black">
                {i + 1}
              </span>
              <span className="text-xl leading-relaxed">{line}</span>
            </li>
          ))}
        </ol>
        <div className="mt-10 border-t border-[var(--border)] pt-6">
          <div className="font-mono text-sm uppercase tracking-widest text-[var(--accent)]">the verdict</div>
          <div className="mt-2 text-2xl font-medium leading-snug">{roast.verdict}</div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-5 text-center font-medium hover:border-[var(--accent)]"
        >
          post to X
        </a>
        <button
          onClick={() => {
            navigator.clipboard.writeText(shareUrl);
          }}
          className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-5 text-center font-medium hover:border-[var(--accent)]"
        >
          copy share link
        </button>
        <a
          href={`/api/card?d=${encodeURIComponent(d)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-5 text-center font-medium hover:border-[var(--accent)]"
        >
          download image
        </a>
      </div>

      <div className="rounded-3xl border border-[var(--accent)] bg-gradient-to-r from-[#1a0a0a] to-[#0a0a0a] p-8">
        <div className="font-mono text-sm uppercase tracking-widest text-[var(--accent)]">unlock the deep roast — $3.99</div>
        <h3 className="mt-2 text-3xl font-bold">8 evidence bullets. Longer verdict. Your inner-monologue playlist. The fix.</h3>
        <p className="mt-3 text-[var(--muted)]">
          the free roast is the SNL cold-open. the deep roast is the full sketch — built on the same upload, no re-upload needed.
        </p>
        <button
          onClick={onPay}
          className="mt-6 rounded-full bg-[var(--accent)] px-8 py-4 text-lg font-semibold text-black hover:brightness-110"
        >
          deep roast me for $3.99 →
        </button>
      </div>

      <a
        href="https://hasofferstracking.betterhelp.com/aff_c?offer_id=2&aff_id=PLACEHOLDER"
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-6 text-center hover:border-[var(--accent)]"
      >
        <div className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">sponsored</div>
        <div className="mt-1 text-lg">
          your AI knows you better than your therapist does. <span className="text-[var(--accent)]">fix that →</span>
        </div>
      </a>
    </div>
  );
}
