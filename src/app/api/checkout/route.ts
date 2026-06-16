import { stripeClient, DEEP_ROAST_PRICE_CENTS } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const stripe = stripeClient();
    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: DEEP_ROAST_PRICE_CENTS,
            product_data: {
              name: "Deep Roast",
              description: "Your full 8-bullet roast, playlist pick, and the fix.",
            },
          },
        },
      ],
      success_url: `${origin}/deep?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?canceled=1`,
      allow_promotion_codes: false,
      submit_type: "pay",
    });
    return Response.json({ url: session.url, id: session.id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "stripe error";
    return Response.json({ error: message }, { status: 500 });
  }
}
