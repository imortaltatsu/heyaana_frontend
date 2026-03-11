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

    // Atomically burn the code on validate — one use only, no second chances
    const burned = (await sql`
      UPDATE invite_codes
      SET used_at = NOW(), used_by = 'PENDING'
      WHERE code = ${code} AND used_at IS NULL
      RETURNING id
    `) as { id: string }[];

    if (burned.length > 0) {
      return NextResponse.json({ valid: true });
    }

    const check = (await sql`
      SELECT used_at FROM invite_codes WHERE code = ${code} LIMIT 1
    `) as { used_at: string | null }[];

    if (check.length === 0) {
      return NextResponse.json({ valid: false, error: "Invite code not found" }, { status: 404 });
    }

    return NextResponse.json({ valid: false, error: "Invite code already used" }, { status: 400 });
  } catch (err) {
    if (err instanceof Error && err.message.includes("DATABASE_URL")) {
      return NextResponse.json({ valid: false, error: "Database not configured" }, { status: 503 });
    }
    console.error("[invite/validate]", err);
    return NextResponse.json({ valid: false, error: "Failed to validate invite code" }, { status: 500 });
  }
}
