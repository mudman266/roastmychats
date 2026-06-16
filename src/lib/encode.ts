import type { FreeRoast } from "./anthropic";

// URL-safe base64 of compact roast JSON, so /share?d=... is fully stateless.
export function encodeRoast(r: FreeRoast): string {
  const compact = { a: r.archetype, s: r.score, v: r.verdict, e: r.evidence };
  const json = JSON.stringify(compact);
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeRoast(d: string): FreeRoast | null {
  try {
    const json = Buffer.from(d, "base64url").toString("utf8");
    const o = JSON.parse(json) as { a: string; s: number; v: string; e: string[] };
    if (!o.a || !Array.isArray(o.e)) return null;
    return { archetype: o.a, score: o.s, verdict: o.v, evidence: o.e };
  } catch {
    return null;
  }
}
