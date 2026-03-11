import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

const API2_BASE_URL = "https://api2.heyanna.trade";

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

export async function GET(req: NextRequest) {
  try {
    const sql = getSql();
    const user = await getAuthenticatedUser(req.headers.get("Authorization"));
    if (!user) {
      return NextResponse.json({ hasAccess: false }, { status: 401 });
    }

    const userId = String(user.telegram_id);
    const rows = (await sql`
      SELECT 1 FROM invite_codes
      WHERE used_by = ${userId}
      LIMIT 1
    `) as unknown[];

    return NextResponse.json({ hasAccess: rows.length > 0 });
  } catch (err) {
    if (err instanceof Error && err.message.includes("DATABASE_URL")) {
      return NextResponse.json({ hasAccess: false }, { status: 503 });
    }
    console.error("[invite/has-access]", err);
    return NextResponse.json({ hasAccess: false }, { status: 500 });
  }
}
