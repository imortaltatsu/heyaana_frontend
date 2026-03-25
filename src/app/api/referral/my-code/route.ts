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
    console.error("[referral/my-code]", error);
    return NextResponse.json(
      { error: "Failed to get referral code" },
      { status: 500 }
    );
  }
}
