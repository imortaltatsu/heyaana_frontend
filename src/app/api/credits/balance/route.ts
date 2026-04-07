import { NextResponse, type NextRequest } from "next/server";
import { getSql } from "@/lib/db";
import { getUserId } from "../shared";

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = getSql();
    const rawRows = await sql`
      SELECT service, balance_usdc
      FROM agent_credits
      WHERE user_id = ${userId}
    `;
    const rows = (Array.isArray(rawRows) ? rawRows : []) as Record<string, unknown>[];

    const balances: Record<string, number> = { metengine: 0, elsa: 0 };
    for (const row of rows) {
      balances[row.service as string] = Number(row.balance_usdc as number);
    }

    return NextResponse.json(balances);
  } catch (err) {
    console.error("[credits/balance]", err);
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 });
  }
}
