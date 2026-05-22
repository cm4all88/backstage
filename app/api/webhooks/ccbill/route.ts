import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// CCBill posts webhook events to this endpoint.
// Configure in your CCBill merchant portal:
//   Approval URL: https://backstagely.app/api/webhooks/ccbill?event=NewSaleSuccess
//   Denial URL:   https://backstagely.app/api/webhooks/ccbill?event=NewSaleDenied
//   Cancel URL:   https://backstagely.app/api/webhooks/ccbill?event=Cancellation

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const event = searchParams.get("event");

  let body: Record<string, string> = {};
  try {
    const text = await req.text();
    text.split("&").forEach((pair) => {
      const [k, v] = pair.split("=");
      if (k) body[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
    });
  } catch {
    return NextResponse.json({ error: "Bad body" }, { status: 400 });
  }

  const supabase = await createClient();

  if (event === "NewSaleSuccess") {
    const fanUserId = body.passthrough1;
    const creatorProfileId = body.passthrough2;
    const subscriptionId = body.subscriptionId;
    const price = parseFloat(body.initialPrice ?? body.recurringPrice ?? "0");

    if (!fanUserId || !creatorProfileId || !subscriptionId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Upsert subscription
    await (supabase as any).from("subscriptions").upsert({
      fan_user_id: fanUserId,
      creator_profile_id: creatorProfileId,
      status: "active",
      tier: "premium",
      ccbill_subscription_id: subscriptionId,
      amount: price,
      updated_at: new Date().toISOString(),
    }, { onConflict: "fan_user_id,creator_profile_id" });

    return NextResponse.json({ ok: true });
  }

  if (event === "Cancellation") {
    const subscriptionId = body.subscriptionId;
    if (subscriptionId) {
      await (supabase as any)
        .from("subscriptions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("ccbill_subscription_id", subscriptionId);
    }
    return NextResponse.json({ ok: true });
  }

  if (event === "NewSaleDenied") {
    // Log failed attempt — no action needed on subscription table
    console.log("CCBill sale denied:", body);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

// CCBill also sends GET pings for approval/denial redirects
export async function GET(req: NextRequest) {
  return POST(req);
}
