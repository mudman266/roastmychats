import type { Metadata } from "next";
import Link from "next/link";
import { decodeRoast } from "@/lib/encode";

type Props = { searchParams: Promise<{ d?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const d = sp.d;
  const roast = d ? decodeRoast(d) : null;
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  if (!roast) {
    return { title: "Roast My Chats" };
  }
  const title = `${roast.archetype} — ${roast.score}/100 cooked`;
  const desc = roast.verdict;
  const image = `${base}/api/card?d=${encodeURIComponent(d!)}`;
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, images: [image] },
    twitter: { card: "summary_large_image", title, description: desc, images: [image] },
  };
}

export default async function SharePage({ searchParams }: Props) {
  const sp = await searchParams;
  const d = sp.d;
  const roast = d ? decodeRoast(d) : null;
  if (!roast) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-3xl font-bold">link expired or invalid</h1>
        <Link href="/" className="mt-6 inline-block rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-black">
          get your own roast
        </Link>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24 space-y-8">
      <Link href="/" className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--accent)]">
        roast my chats
      </Link>
      <div className="overflow-hidden rounded-3xl border-2 border-[var(--accent)] bg-gradient-to-b from-[#1a0a0a] to-[#0a0a0a] p-10 shadow-2xl">
        <div className="font-mono text-sm uppercase tracking-widest text-[var(--accent)]">somebody is</div>
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
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-6 text-center">
        <div className="text-[var(--muted)]">curious what your own ChatGPT history would say?</div>
        <Link
          href="/"
          className="mt-4 inline-block rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-black hover:brightness-110"
        >
          roast me too →
        </Link>
      </div>
    </main>
  );
}
