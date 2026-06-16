import { ImageResponse } from "next/og";
import { decodeRoast } from "@/lib/encode";

export const runtime = "edge";

const WIDTH = 1200;
const HEIGHT = 1500;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const d = searchParams.get("d");
  const roast = d ? decodeRoast(d) : null;
  if (!roast) {
    return new Response("not found", { status: 404 });
  }
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(160deg, #0a0a0a 0%, #1a0a0a 100%)",
          padding: 80,
          fontFamily: '"Inter", system-ui, sans-serif',
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 28, color: "#ff5b3a", letterSpacing: 4, fontWeight: 700 }}>ROAST MY CHATS</div>
          <div style={{ fontSize: 28, color: "#888" }}>roastmychats.com</div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            border: "2px solid #ff5b3a",
            borderRadius: 24,
            padding: 56,
            flex: 1,
            background: "rgba(20,10,10,0.6)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 36, color: "#ff5b3a", letterSpacing: 2 }}>YOU ARE</div>
            <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05 }}>{roast.archetype}</div>
            <div style={{ fontSize: 36, color: "#aaa", marginTop: 8 }}>Cooked Score: {roast.score}/100</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 28, marginTop: 56 }}>
            {roast.evidence.slice(0, 3).map((line, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "row", gap: 24, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    minWidth: 56,
                    minHeight: 56,
                    borderRadius: 999,
                    background: "#ff5b3a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 36,
                    fontWeight: 800,
                    color: "#0a0a0a",
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ fontSize: 36, lineHeight: 1.3, color: "#f5f5f5", flex: 1 }}>{line}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12, paddingTop: 32 }}>
            <div style={{ fontSize: 28, color: "#ff5b3a", letterSpacing: 2 }}>THE VERDICT</div>
            <div style={{ fontSize: 38, fontWeight: 600, color: "#fff", lineHeight: 1.25 }}>{roast.verdict}</div>
          </div>
        </div>
        <div style={{ marginTop: 24, fontSize: 24, color: "#888", display: "flex", justifyContent: "space-between" }}>
          <span>roast your own ChatGPT exports at roastmychats.com</span>
          <span>made with AI, regret optional</span>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
}
