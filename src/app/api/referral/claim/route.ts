import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/lib/referral-auth";
import { claimReferralCode } from "@/lib/referral-db";

export async function POST(req: NextRequest) {
  try {
    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Referral code is required" },
        { status: 400 }
      );
    }

    const result = await claimReferralCode(user.user_id, code, user.username);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[referral/claim]", error);
    return NextResponse.json(
      { error: "Failed to claim referral code" },
      { status: 500 }
    );
  }
}
