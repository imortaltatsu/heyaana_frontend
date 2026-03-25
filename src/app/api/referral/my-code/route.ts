import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/lib/referral-auth";
import { getOrCreateReferralCode } from "@/lib/referral-db";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const code = await getOrCreateReferralCode(user.user_id, user.username);
    return NextResponse.json({ code });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[referral/my-code]", msg, error);
    return NextResponse.json(
      { error: "Failed to get referral code", detail: msg },
      { status: 500 }
    );
  }
}
