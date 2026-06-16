import { DeepClient } from "./deep-client";

type Props = { searchParams: Promise<{ session_id?: string }> };

export default async function DeepPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-16 sm:py-24 space-y-8">
      <header className="space-y-2">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--accent)]">deep roast</div>
        <h1 className="text-4xl font-extrabold">the full sketch.</h1>
      </header>
      <DeepClient sessionId={sp.session_id ?? null} />
    </main>
  );
}
