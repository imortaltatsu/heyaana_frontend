import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

const ADMIN_API_KEY = process.env.INVITE_ADMIN_KEY;

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("X-Api-Key") ?? req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!ADMIN_API_KEY || apiKey !== ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = getSql();
    const body = await req.json().catch(() => ({}));
    const count = Math.min(Math.max(1, Number(body?.count) || 1), 50);

    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      let code = generateCode();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await sql`SELECT 1 FROM invite_codes WHERE code = ${code} LIMIT 1`;
        const arr = Array.isArray(existing) ? existing : [];
        if (arr.length === 0) break;
        code = generateCode();
        attempts++;
      }
      await sql`INSERT INTO invite_codes (code) VALUES (${code})`;
      codes.push(code);
    }

    return NextResponse.json({ codes });
  } catch (err) {
    if (err instanceof Error && err.message.includes("DATABASE_URL")) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }
    console.error("[invite/generate]", err);
    return NextResponse.json({ error: "Failed to generate invite codes" }, { status: 500 });
  }
}
