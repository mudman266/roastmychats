# Roast My Chats

> Let an AI read every ChatGPT conversation you've ever had — and roast you for it.

Live: [roastmychats.com](https://roastmychats.com)

## What this does

You upload your ChatGPT data export. An LLM reads the patterns and writes you a single brutally specific roast card. Archetype, cooked-score, three evidence bullets, verdict.

Optional $3.99 deep roast: 8 bullets, longer verdict, the song stuck in your head when you ask the AI for help, and "the fix."

## Why this repo is public

So you can verify that we do what we say we do. Specifically:

- **Parsing is client-side.** Your zip / `conversations.json` is unzipped and parsed by JavaScript in your browser. The file never leaves your machine intact. See [`src/lib/parse-export.ts`](src/lib/parse-export.ts) and [`src/components/uploader.tsx`](src/components/uploader.tsx).
- **Only a small text digest is sent to our server.** ~10-20 KB of sampled message titles + excerpts. None of the assistant's replies. The server is a thin pass-through to OpenAI. See [`src/app/api/roast/route.ts`](src/app/api/roast/route.ts).
- **No database.** No `fs.writeFile`. No persistence. The whole site is stateless.
- **Results are stored in your browser's `sessionStorage`**, which clears the moment you close the tab.

Full privacy page on the live site: [roastmychats.com/privacy](https://roastmychats.com/privacy)

## Stack

- Next.js 16 (App Router) on Vercel
- OpenAI `gpt-4o-mini` for roast generation
- Stripe Checkout for the $3.99 deep-roast unlock
- `next/og` for shareable PNG cards
- PostHog for aggregate event analytics (event names + archetype labels — never message content)
- BeaconKit for page counts (path + referrer only — never the query string, where `/share` carries the roast)
- Tailwind v4
- No database

## Local dev

```bash
cp .env.example .env.local
# fill in: OPENAI_API_KEY, STRIPE_SECRET_KEY, NEXT_PUBLIC_POSTHOG_KEY (optional),
#          NEXT_PUBLIC_BEACONKIT_PROJECT_ID + NEXT_PUBLIC_BEACONKIT_API_KEY (optional)
npm install
npm run dev
```

## License

MIT
