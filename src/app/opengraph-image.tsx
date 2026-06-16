import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Roast My Chats — let an AI read your ChatGPT exports and roast you";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 60%, #2a0a0a 100%)",
          padding: 64,
          fontFamily: '"Inter", system-ui, sans-serif',
          color: "#fff",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 32, color: "#ff5b3a", letterSpacing: 6, fontWeight: 700 }}>
          ROAST MY CHATS
        </div>
        <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
          let an AI read every ChatGPT conversation you&apos;ve ever had —{" "}
          <span style={{ color: "#ff5b3a" }}>and roast you for it.</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 32, color: "#aaa", maxWidth: 700 }}>
            upload your export · get the archetype · share the receipt
          </div>
          <div style={{ fontSize: 28, color: "#ff5b3a", fontWeight: 600 }}>roastmychats.com</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
