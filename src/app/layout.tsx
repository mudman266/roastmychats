import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/posthog-provider";
import { BeaconKit } from "@/components/beaconkit";

const sans = Inter({ variable: "--font-sans", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"),
  title: "Roast My Chats — let an AI read your ChatGPT exports and roast you",
  description:
    "Upload your ChatGPT conversations export. Get a brutally specific roast based on what you actually ask the AI when no one is watching.",
  openGraph: {
    title: "Roast My Chats",
    description:
      "Upload your ChatGPT export. Get an AI archetype + 3 brutally specific bullets. The roast will know you better than your therapist.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Roast My Chats",
    description: "Let an AI read your ChatGPT exports and write the roast.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <BeaconKit />
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
