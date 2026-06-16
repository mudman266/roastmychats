import OpenAI from "openai";
import { FREE_ROAST_SYSTEM, DEEP_ROAST_SYSTEM, buildUserPrompt } from "./prompts";

export type FreeRoast = {
  archetype: string;
  score: number;
  verdict: string;
  evidence: string[];
};

export type DeepRoast = FreeRoast & {
  playlist_pick: string;
  the_fix: string;
};

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

function client(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");
  return new OpenAI({ apiKey: key });
}

async function callRoast(system: string, digest: string): Promise<string> {
  const c = client();
  const resp = await c.chat.completions.create({
    model: MODEL,
    max_tokens: 1500,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: buildUserPrompt(digest) },
    ],
  });
  const text = resp.choices[0]?.message?.content;
  if (!text) throw new Error("no content in model response");
  return text;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON object in model output");
  return JSON.parse(trimmed.slice(start, end + 1));
}

export async function freeRoast(digest: string): Promise<FreeRoast> {
  const raw = await callRoast(FREE_ROAST_SYSTEM, digest);
  const obj = extractJson(raw) as FreeRoast;
  if (!obj.archetype || !Array.isArray(obj.evidence) || obj.evidence.length === 0) {
    throw new Error("invalid roast shape from model");
  }
  obj.score = clamp(Number(obj.score) || 75, 1, 100);
  obj.evidence = obj.evidence.slice(0, 3);
  return obj;
}

export async function deepRoast(digest: string): Promise<DeepRoast> {
  const raw = await callRoast(DEEP_ROAST_SYSTEM, digest);
  const obj = extractJson(raw) as DeepRoast;
  if (!obj.archetype || !Array.isArray(obj.evidence)) {
    throw new Error("invalid deep roast shape from model");
  }
  obj.score = clamp(Number(obj.score) || 78, 1, 100);
  obj.evidence = obj.evidence.slice(0, 8);
  return obj;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
