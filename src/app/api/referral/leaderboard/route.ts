import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/referral-db";

export async function GET(_req: NextRequest) {
  try {
    const leaderboard = await getLeaderboard(20);
    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("[referral/leaderboard]", error);
    return NextResponse.json(
      { error: "Failed to get leaderboard" },
      { status: 500 }
    );
  }
}
