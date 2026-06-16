import { parseExportZip, parseConversationsJson, buildDigest } from "@/lib/parse-export";
import { freeRoast } from "@/lib/anthropic";
import { encodeRoast } from "@/lib/encode";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const ct = request.headers.get("content-type") ?? "";
    let digest: string;
    if (ct.includes("application/zip") || ct.includes("application/octet-stream")) {
      const buf = await request.arrayBuffer();
      if (buf.byteLength > MAX_UPLOAD_BYTES) {
        return Response.json({ error: "file too large (max 25MB)" }, { status: 413 });
      }
      const messages = await parseExportZip(buf);
      digest = buildDigest(messages);
    } else if (ct.includes("application/json")) {
      const body = (await request.json()) as { conversations?: string; digest?: string };
      if (body.digest) {
        digest = body.digest;
      } else if (body.conversations) {
        const messages = parseConversationsJson(body.conversations);
        digest = buildDigest(messages);
      } else {
        return Response.json({ error: "expected { conversations } or { digest }" }, { status: 400 });
      }
    } else {
      return Response.json({ error: "send zip body or JSON {conversations|digest}" }, { status: 400 });
    }

    if (digest.length < 100) {
      return Response.json({ error: "not enough conversation content to roast" }, { status: 422 });
    }

    const roast = await freeRoast(digest);
    const d = encodeRoast(roast);
    return Response.json({ roast, d, digest });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
