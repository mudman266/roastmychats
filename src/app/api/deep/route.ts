import { stripeClient } from "@/lib/stripe";
import { deepRoast } from "@/lib/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { session_id?: string; digest?: string };
    if (!body.session_id || !body.digest) {
      return Response.json({ error: "session_id and digest required" }, { status: 400 });
    }
    const stripe = stripeClient();
    const session = await stripe.checkout.sessions.retrieve(body.session_id);
    if (session.payment_status !== "paid") {
      return Response.json({ error: "payment not completed" }, { status: 402 });
    }
    const roast = await deepRoast(body.digest);
    return Response.json({ roast });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "deep roast error";
    return Response.json({ error: message }, { status: 500 });
  }
}
