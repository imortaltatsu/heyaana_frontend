import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/lib/referral-auth";
import { getUserReferralStats } from "@/lib/referral-db";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getUserReferralStats(user.user_id, user.username);
    return NextResponse.json(stats);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[referral/stats]", msg, error);
    return NextResponse.json(
      { error: "Failed to get referral stats", detail: msg },
      { status: 500 }
    );
  }
}
