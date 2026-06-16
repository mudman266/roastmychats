import { Uploader } from "@/components/uploader";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-12 px-6 py-16 sm:py-24">
      <header className="space-y-4">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--accent)]">roast my chats · v0.1</div>
        <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          let an AI read every ChatGPT conversation you&apos;ve ever had —
          <span className="text-[var(--accent)]"> and roast you for it.</span>
        </h1>
        <p className="text-lg text-[var(--muted)]">
          upload your ChatGPT data export. in ~30 seconds you get an archetype, a cooked score, three brutally specific bullets, and a verdict. shareable. unsettling. accurate.
        </p>
      </header>

      <Uploader />

      <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-6">
        <div className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">how to get your export</div>
        <ol className="ml-5 list-decimal space-y-2 text-[var(--muted)]">
          <li>
            open ChatGPT → <span className="font-mono text-[var(--fg)]">Settings</span> →{" "}
            <span className="font-mono text-[var(--fg)]">Data Controls</span> →{" "}
            <span className="font-mono text-[var(--fg)]">Export data</span>.
          </li>
          <li>check your email. OpenAI sends a download link within a minute.</li>
          <li>
            drop the <span className="font-mono text-[var(--fg)]">.zip</span> here. you can also drop just{" "}
            <span className="font-mono text-[var(--fg)]">conversations.json</span> from inside it.
          </li>
        </ol>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-6">
          <div className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">privacy</div>
          <div className="mt-2 text-[var(--muted)]">
            your zip is parsed in memory. only an anonymized digest goes to the LLM. nothing is stored on our servers.
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-6">
          <div className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">why is it free</div>
          <div className="mt-2 text-[var(--muted)]">
            it&apos;s the cold open. the deep roast is $3.99, optional, and a true follow-up — not a tease.
          </div>
        </div>
      </section>

      <footer className="mt-auto space-y-2 text-center text-xs text-[var(--muted)]">
        <div>
          <a href="/privacy" className="text-[var(--accent)] hover:underline">privacy</a>
          {" · "}
          <a
            href={process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/mudman266/roastmychats"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] hover:underline"
          >
            source on GitHub
          </a>
        </div>
        <div>made by a human and a model, both moderately judgmental. not affiliated with OpenAI.</div>
      </footer>
    </main>
  );
}
