import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// CCBill subscription initiation for Backstagely creators.
// CCBill merchant account required — apply at ccbill.com.
// When CCBill is active, replace this stub with live CCBill FlexForms URL construction.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const creatorProfileId = searchParams.get("creator_profile_id");
  const handle = searchParams.get("handle");

  if (!creatorProfileId || !handle) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // CCBill requires the subscriber to have an account for record-keeping.
  if (!user) {
    const returnUrl = `/api/subscribe?creator_profile_id=${creatorProfileId}&handle=${handle}`;
    return NextResponse.redirect(
      new URL(`https://spotlightly.app/login?return=${encodeURIComponent(returnUrl)}`, req.url)
    );
  }

  // TODO: Replace with live CCBill FlexForms URL when merchant account is approved.
  // CCBill FlexForms URL pattern:
  // https://api.ccbill.com/wap-frontflex/flexforms/{FORM_ID}
  //   ?clientSubacc=0000
  //   &currencyCode=840
  //   &initialPrice={price}
  //   &initialPeriod=30
  //   &recurringPrice={price}
  //   &recurringPeriod=30
  //   &rebills=99
  //   &formName=cc_form
  //   &customer_fname=...
  //   &customer_email=...
  //   &passthrough1={user.id}
  //   &passthrough2={creatorProfileId}

  const CCBILL_FORM_ID = process.env.CCBILL_FLEXFORM_ID;

  if (!CCBILL_FORM_ID) {
    // CCBill not yet configured — show holding page
    return NextResponse.redirect(
      new URL(`/${handle}?ccbill_pending=1`, req.url)
    );
  }

  const { data: profile } = await (supabase as any)
    .from("creator_profiles")
    .select("subscription_price")
    .eq("id", creatorProfileId)
    .maybeSingle();

  const price = Number(profile?.subscription_price ?? 9.99).toFixed(2);

  const ccbillUrl = new URL(`https://api.ccbill.com/wap-frontflex/flexforms/${CCBILL_FORM_ID}`);
  ccbillUrl.searchParams.set("clientSubacc", "0000");
  ccbillUrl.searchParams.set("currencyCode", "840");
  ccbillUrl.searchParams.set("initialPrice", price);
  ccbillUrl.searchParams.set("initialPeriod", "30");
  ccbillUrl.searchParams.set("recurringPrice", price);
  ccbillUrl.searchParams.set("recurringPeriod", "30");
  ccbillUrl.searchParams.set("rebills", "99");
  ccbillUrl.searchParams.set("passthrough1", user.id);
  ccbillUrl.searchParams.set("passthrough2", creatorProfileId);
  ccbillUrl.searchParams.set("passthrough3", handle);

  return NextResponse.redirect(ccbillUrl.toString());
}
