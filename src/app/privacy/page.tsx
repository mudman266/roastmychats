import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "what we do (and don't do) with your ChatGPT export — Roast My Chats",
  description: "A specific, verifiable explanation of how your ChatGPT export is handled. No marketing language.",
};

const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/mudman266/roastmychats";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-16 sm:py-24 space-y-12">
      <header className="space-y-3">
        <Link href="/" className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--accent)]">
          ← roast my chats
        </Link>
        <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">what we do (and don&apos;t do) with your ChatGPT export</h1>
        <p className="text-lg text-[var(--muted)]">
          no marketing language. every claim is something you can verify with the dev tools panel in your browser, or by reading the source code (it&apos;s public — link at the bottom).
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">the actual flow, step by step</h2>
        <ol className="space-y-4 text-[var(--muted)]">
          <li>
            <strong className="text-[var(--fg)]">1. You pick a file.</strong> Either a <span className="font-mono text-[var(--accent)]">.zip</span> straight from your OpenAI export email, or a raw <span className="font-mono text-[var(--accent)]">conversations.json</span>. The file stays on your machine.
          </li>
          <li>
            <strong className="text-[var(--fg)]">2. Your browser parses it.</strong> The zip is unzipped and the JSON is parsed by JavaScript running in your browser. No part of your file is uploaded yet. You can prove this: open DevTools → Network tab, then upload. The only network request that fires is to <span className="font-mono text-[var(--accent)]">/api/roast</span>, and you can inspect the request body — it&apos;s a small text digest, not your file.
          </li>
          <li>
            <strong className="text-[var(--fg)]">3. We build a digest.</strong> Up to 200 sampled user messages get clipped to 500 characters each, plus a list of conversation titles. ~10-20 KB of anonymized excerpts. <strong>None of the assistant&apos;s replies are included.</strong>
          </li>
          <li>
            <strong className="text-[var(--fg)]">4. We forward the digest to OpenAI.</strong> Our server is a thin pass-through: it receives the digest, calls OpenAI&apos;s API with the digest + roast prompt, returns the result to your browser. The digest is in memory for a few seconds, then discarded with the request.
          </li>
          <li>
            <strong className="text-[var(--fg)]">5. The result is shown to you.</strong> The roast card and digest are stored in your browser&apos;s <span className="font-mono text-[var(--accent)]">sessionStorage</span> so the &quot;deep roast&quot; option can work without re-uploading. <strong>sessionStorage clears the moment you close the tab.</strong>
          </li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">what we do NOT do</h2>
        <ul className="space-y-3 text-[var(--muted)]">
          <li>❌ We do not have a database. There is no place for us to store your data, even if we wanted to.</li>
          <li>❌ We do not write your file, your digest, or your roast to disk.</li>
          <li>❌ We do not log the body of your upload. Vercel logs request metadata (size, latency, status code) but not body content.</li>
          <li>❌ We do not share your digest with anyone other than OpenAI&apos;s API.</li>
          <li>❌ We do not run analytics on the content of your chats. PostHog only captures aggregate events (e.g. <span className="font-mono text-sm">upload_started</span>, <span className="font-mono text-sm">roast_received</span>) and the archetype + score we returned. It never sees your messages.</li>
          <li>❌ We do not track you with page counts. BeaconKit, a service run by this site&apos;s developer, records only which page was viewed (the path — never the query string, which is where a shared roast lives), the page you came from, and the time. No cookies, no IP address, nothing that identifies you.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">about OpenAI</h2>
        <p className="text-[var(--muted)]">
          We use OpenAI&apos;s API (the developer API, not ChatGPT). Per <a className="text-[var(--accent)] underline" href="https://openai.com/policies/api-data-usage-policies" target="_blank" rel="noopener noreferrer">OpenAI&apos;s API data usage policy</a>, API submissions are <strong>not used to train OpenAI&apos;s models</strong>. OpenAI retains API data for up to 30 days for abuse monitoring, after which it is deleted. We do not have zero-retention enabled because that requires a separate agreement, so the data does pass through their 30-day window.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">how to verify all of this yourself</h2>
        <ol className="space-y-3 text-[var(--muted)]">
          <li>
            <strong className="text-[var(--fg)]">Read the source.</strong> The entire app is open source: <a className="text-[var(--accent)] underline" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">{GITHUB_URL}</a>. The parts that matter:
            <ul className="ml-4 mt-2 space-y-1 font-mono text-xs">
              <li>• <span className="text-[var(--accent)]">src/lib/parse-export.ts</span> — parses and digests the file (runs in your browser)</li>
              <li>• <span className="text-[var(--accent)]">src/components/uploader.tsx</span> — the upload UI; you can see only <code>{`{ digest }`}</code> is POSTed</li>
              <li>• <span className="text-[var(--accent)]">src/app/api/roast/route.ts</span> — server route; in-memory only</li>
            </ul>
          </li>
          <li>
            <strong className="text-[var(--fg)]">Inspect the network.</strong> Open DevTools → Network, click <em>Preserve log</em>, then upload your file. You&apos;ll see exactly two relevant requests: a <span className="font-mono text-sm">POST /api/roast</span> with a JSON body containing just <span className="font-mono text-sm">{`{ digest }`}</span>, and the response with your roast. No file upload to our server.
          </li>
          <li>
            <strong className="text-[var(--fg)]">Try with JavaScript off.</strong> Disable JS in your browser, then try to upload. The site won&apos;t parse anything — proof that the parsing is happening locally, not on our server.
          </li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">contact</h2>
        <p className="text-[var(--muted)]">
          See something in the code that contradicts a claim on this page? Open an issue on the repo or email the address in the GitHub README. We&apos;ll fix it.
        </p>
      </section>

      <footer className="text-center text-xs text-[var(--muted)]">
        last updated 2026-10-11 · <Link href="/" className="text-[var(--accent)]">back to roast my chats</Link>
      </footer>
    </main>
  );
}
