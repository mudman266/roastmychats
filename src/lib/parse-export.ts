export type UserMessage = { time: number; title: string; text: string };

const MAX_MESSAGES = 200;
const MAX_TEXT_LEN = 1500;

export async function parseExportZip(buf: ArrayBuffer): Promise<UserMessage[]> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buf);
  // Look for any of the known export file names — different platforms vary.
  const candidates = [
    "conversations.json",
    "conversations/conversations.json",
    "chat_data.json",
    "ChatGPT export/conversations.json",
  ];
  let file = null;
  for (const name of candidates) {
    file = zip.file(name);
    if (file) break;
  }
  if (!file) {
    // Last resort: any *.json file in root that looks like conversations
    const all = zip.file(/^[^/]*\.json$/);
    for (const f of all) {
      const sample = await f.async("string");
      if (sample.length > 100 && (sample.includes('"mapping"') || sample.includes('"chat_messages"') || sample.includes('"messages"'))) {
        file = f;
        break;
      }
    }
  }
  if (!file) throw new Error("couldn't find conversations.json in the zip — try uploading just the .json file directly");
  const raw = await file.async("string");
  return parseConversationsJson(raw);
}

export function parseConversationsJson(raw: string): UserMessage[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("file isn't valid JSON — make sure you're uploading conversations.json, not an HTML page or zip");
  }

  // Dispatch by shape detection. Try each parser; first that returns messages wins.
  const parsers: Array<(p: unknown) => UserMessage[]> = [
    parseOpenAIChatGPT,
    parseAnthropicClaude,
    parseGenericMessagesArray,
    parseGenericConversationsArray,
  ];

  for (const fn of parsers) {
    try {
      const out = fn(parsed);
      if (out.length > 0) {
        return finalize(out);
      }
    } catch {
      // try next parser
    }
  }

  throw new Error(
    "couldn't find any user messages — file format isn't one we recognize. supported: ChatGPT export, Claude export, or any JSON with messages",
  );
}

// ---- OpenAI ChatGPT format ----
// Array of { title, mapping: { [id]: { message: { author: { role: "user" }, content: { parts: [string] }, create_time } } } }
function parseOpenAIChatGPT(parsed: unknown): UserMessage[] {
  if (!Array.isArray(parsed)) return [];
  const out: UserMessage[] = [];
  for (const c of parsed as Array<Record<string, unknown>>) {
    const title = stringOr(c.title, "untitled").slice(0, 100);
    const mapping = c.mapping as Record<string, { message?: ChatGPTMessage | null }> | undefined;
    if (!mapping || typeof mapping !== "object") continue;
    for (const node of Object.values(mapping)) {
      const msg = node?.message;
      if (!msg) continue;
      if (msg.author?.role !== "user") continue;
      const parts = msg.content?.parts;
      if (!Array.isArray(parts)) continue;
      const text = parts
        .filter((p): p is string => typeof p === "string")
        .join("\n")
        .trim();
      if (!text || text.length < 4) continue;
      out.push({
        time: typeof msg.create_time === "number" ? msg.create_time : typeof c.create_time === "number" ? c.create_time : 0,
        title,
        text: text.slice(0, MAX_TEXT_LEN),
      });
    }
  }
  return out;
}
type ChatGPTMessage = {
  author?: { role?: string };
  content?: { content_type?: string; parts?: unknown[] };
  create_time?: number;
};

// ---- Anthropic Claude format ----
// Array of { name, chat_messages: [{ sender: "human", text, created_at }] }
function parseAnthropicClaude(parsed: unknown): UserMessage[] {
  if (!Array.isArray(parsed)) return [];
  const out: UserMessage[] = [];
  for (const c of parsed as Array<Record<string, unknown>>) {
    const title = stringOr(c.name ?? c.title, "untitled").slice(0, 100);
    const messages = c.chat_messages as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(messages)) continue;
    for (const m of messages) {
      const sender = m.sender ?? m.role;
      if (sender !== "human" && sender !== "user") continue;
      const text = extractText(m).trim();
      if (!text || text.length < 4) continue;
      const time = parseTime(m.created_at ?? m.create_time ?? c.created_at);
      out.push({ time, title, text: text.slice(0, MAX_TEXT_LEN) });
    }
  }
  return out;
}

// ---- Generic "array of conversations with .messages[]" format (Gemini, some 3rd party tools) ----
function parseGenericConversationsArray(parsed: unknown): UserMessage[] {
  if (!Array.isArray(parsed)) return [];
  const out: UserMessage[] = [];
  for (const c of parsed as Array<Record<string, unknown>>) {
    const title = stringOr(c.title ?? c.name ?? c.subject, "untitled").slice(0, 100);
    const messages = (c.messages ?? c.turns ?? c.history) as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(messages)) continue;
    for (const m of messages) {
      const role = m.role ?? m.sender ?? m.author ?? m.from;
      if (!isUserRole(role)) continue;
      const text = extractText(m).trim();
      if (!text || text.length < 4) continue;
      const time = parseTime(m.created_at ?? m.timestamp ?? m.time ?? c.created_at);
      out.push({ time, title, text: text.slice(0, MAX_TEXT_LEN) });
    }
  }
  return out;
}

// ---- Generic "top-level messages array" format ----
function parseGenericMessagesArray(parsed: unknown): UserMessage[] {
  const root = parsed as Record<string, unknown>;
  const messages = (root.messages ?? root.turns ?? root.history ?? root.conversations) as
    | Array<Record<string, unknown>>
    | undefined;
  if (!Array.isArray(messages)) return [];
  const out: UserMessage[] = [];
  for (const m of messages) {
    const role = m.role ?? m.sender ?? m.author ?? m.from;
    if (!isUserRole(role)) continue;
    const text = extractText(m).trim();
    if (!text || text.length < 4) continue;
    const time = parseTime(m.created_at ?? m.timestamp ?? m.time);
    out.push({ time, title: "chat", text: text.slice(0, MAX_TEXT_LEN) });
  }
  return out;
}

// ---- Helpers ----
function isUserRole(role: unknown): boolean {
  if (typeof role !== "string") {
    if (typeof role === "object" && role !== null && "role" in role) {
      return isUserRole((role as Record<string, unknown>).role);
    }
    return false;
  }
  const r = role.toLowerCase();
  return r === "user" || r === "human" || r === "you" || r === "me";
}

function extractText(m: Record<string, unknown>): string {
  // Try common keys for the message text in priority order
  if (typeof m.text === "string") return m.text;
  if (typeof m.content === "string") return m.content;
  if (typeof m.message === "string") return m.message;
  // OpenAI-style content.parts[]
  const content = m.content as Record<string, unknown> | undefined;
  if (content && Array.isArray(content.parts)) {
    return (content.parts as unknown[]).filter((p): p is string => typeof p === "string").join("\n");
  }
  // Array of content blocks (Claude API format)
  if (Array.isArray(m.content)) {
    return (m.content as Array<Record<string, unknown>>)
      .map((b) => (typeof b.text === "string" ? b.text : ""))
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function stringOr(v: unknown, dflt: string): string {
  return typeof v === "string" && v.length > 0 ? v : dflt;
}

function parseTime(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const t = Date.parse(v);
    return Number.isNaN(t) ? 0 : t / 1000;
  }
  return 0;
}

function finalize(out: UserMessage[]): UserMessage[] {
  out.sort((a, b) => b.time - a.time);
  return out;
}

// Build a digest that fits well under model context AND under any reasonable transport limit.
export function buildDigest(messages: UserMessage[]): string {
  if (messages.length === 0) return "(no user messages found)";
  const titleCounts = new Map<string, number>();
  for (const m of messages) {
    titleCounts.set(m.title, (titleCounts.get(m.title) ?? 0) + 1);
  }
  const topTitles = [...titleCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([t, n]) => `- ${t} (${n})`)
    .join("\n");

  const sampled = sampleSpread(messages, Math.min(MAX_MESSAGES, messages.length));
  const excerpts = sampled
    .map((m, i) => `[${i + 1}] (${m.title.slice(0, 50)}) ${m.text.slice(0, 500)}`)
    .join("\n");

  return `TOTAL_USER_MESSAGES: ${messages.length}\n\nTOP_TITLES:\n${topTitles}\n\nSAMPLED_USER_MESSAGES (newest first):\n${excerpts}`;
}

function sampleSpread<T>(arr: T[], k: number): T[] {
  if (arr.length <= k) return arr;
  const step = arr.length / k;
  const out: T[] = [];
  for (let i = 0; i < k; i++) out.push(arr[Math.floor(i * step)]);
  return out;
}
