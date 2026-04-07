import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

const ADMIN_KEY = process.env.CREDITS_ADMIN_KEY;

export async function POST(req: NextRequest) {
  const apiKey =
    req.headers.get("X-Api-Key") ??
    req.headers.get("Authorization")?.replace("Bearer ", "");

  if (!ADMIN_KEY || apiKey !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = getSql();

    await sql`
      CREATE TABLE IF NOT EXISTS agent_credits (
        id            SERIAL PRIMARY KEY,
        user_id       TEXT NOT NULL,
        service       TEXT NOT NULL CHECK (service IN ('metengine', 'elsa')),
        balance_usdc  NUMERIC(12,6) NOT NULL DEFAULT 0,
        total_funded  NUMERIC(12,6) NOT NULL DEFAULT 0,
        total_spent   NUMERIC(12,6) NOT NULL DEFAULT 0,
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, service)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS credit_transactions (
        id            SERIAL PRIMARY KEY,
        user_id       TEXT NOT NULL,
        service       TEXT NOT NULL CHECK (service IN ('metengine', 'elsa')),
        type          TEXT NOT NULL CHECK (type IN ('topup', 'usage')),
        amount_usdc   NUMERIC(12,6) NOT NULL,
        pack_price    NUMERIC(12,6),
        description   TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    return NextResponse.json({ ok: true, message: "Tables created" });
  } catch (err) {
    console.error("[credits/migrate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Migration failed" },
      { status: 500 },
    );
  }
}
