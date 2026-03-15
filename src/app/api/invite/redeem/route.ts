import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

const API2_BASE_URL = "https://staging.heyanna.trade";

async function getAuthenticatedUser(authHeader: string | null): Promise<{ telegram_id: number } | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const res = await fetch(`${API2_BASE_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const telegramId = data.telegram_id;
  if (typeof telegramId !== "number") return null;
  return { telegram_id: telegramId };
}

export async function POST(req: NextRequest) {
  try {
    const sql = getSql();
    const user = await getAuthenticatedUser(req.headers.get("Authorization"));
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : null;
    if (!code || code.length < 4) {
      return NextResponse.json({ success: false, error: "Invalid invite code" }, { status: 400 });
    }

    const userId = String(user.telegram_id);

    // Atomically claim the code — only succeeds if unused
    const rows = (await sql`
      UPDATE invite_codes
      SET used_at = NOW(), used_by = ${userId}
      WHERE code = ${code} AND used_at IS NULL
      RETURNING id
    `) as unknown[];

    if (rows.length === 0) {
      const check = (await sql`
        SELECT used_by FROM invite_codes WHERE code = ${code} LIMIT 1
      `) as { used_by: string | null }[];

      if (check.length === 0) {
        return NextResponse.json({ success: false, error: "Invite code not found" }, { status: 404 });
      }
      // If already used by this same user, treat as success
      if (check[0].used_by === userId) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ success: false, error: "Invite code already used" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message.includes("DATABASE_URL")) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
    }
    console.error("[invite/redeem]", err);
    return NextResponse.json({ success: false, error: "Failed to redeem invite code" }, { status: 500 });
  }
}
