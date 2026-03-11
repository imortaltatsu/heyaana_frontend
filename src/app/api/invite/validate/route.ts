import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const sql = getSql();
    const body = await req.json();
    const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : null;
    if (!code || code.length < 4) {
      return NextResponse.json({ valid: false, error: "Invalid invite code" }, { status: 400 });
    }

    const rows = (await sql`
      SELECT id, used_at FROM invite_codes
      WHERE code = ${code}
      LIMIT 1
    `) as { id: string; used_at: string | null }[];

    if (rows.length === 0) {
      return NextResponse.json({ valid: false, error: "Invite code not found" }, { status: 404 });
    }

    const row = rows[0];
    if (row.used_at) {
      return NextResponse.json({ valid: false, error: "Invite code already used" }, { status: 400 });
    }

    return NextResponse.json({ valid: true });
  } catch (err) {
    if (err instanceof Error && err.message.includes("DATABASE_URL")) {
      return NextResponse.json({ valid: false, error: "Database not configured" }, { status: 503 });
    }
    console.error("[invite/validate]", err);
    return NextResponse.json({ valid: false, error: "Failed to validate invite code" }, { status: 500 });
  }
}
