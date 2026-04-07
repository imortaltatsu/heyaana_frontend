import { NextResponse, type NextRequest } from "next/server";
import { getSql } from "@/lib/db";
import { getUserId, CREDIT_PACKS, isValidService } from "../shared";

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { service?: string; pack?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { service, pack: packId } = body;

  if (!service || !isValidService(service)) {
    return NextResponse.json({ error: "Invalid service. Must be 'metengine' or 'elsa'" }, { status: 400 });
  }

  const pack = CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) {
    return NextResponse.json(
      { error: `Invalid pack. Must be one of: ${CREDIT_PACKS.map((p) => p.id).join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const sql = getSql();

    // TODO: Integrate with API2 backend to transfer pack.price USDC
    // from user's Polygon EOA to PLATFORM_REVENUE_ADDRESS.
    // For now, credits are granted directly (backend payment integration TBD).

    // Upsert credit balance
    await sql`
      INSERT INTO agent_credits (user_id, service, balance_usdc, total_funded, updated_at)
      VALUES (${userId}, ${service}, ${pack.credits}, ${pack.credits}, NOW())
      ON CONFLICT (user_id, service)
      DO UPDATE SET
        balance_usdc = agent_credits.balance_usdc + ${pack.credits},
        total_funded = agent_credits.total_funded + ${pack.credits},
        updated_at = NOW()
    `;

    // Record transaction
    await sql`
      INSERT INTO credit_transactions (user_id, service, type, amount_usdc, pack_price, description)
      VALUES (
        ${userId}, ${service}, 'topup', ${pack.credits}, ${pack.price},
        ${`${pack.label} pack — $${pack.price} for $${pack.credits} credits`}
      )
    `;

    // Fetch updated balance
    const rawRows = await sql`
      SELECT balance_usdc FROM agent_credits
      WHERE user_id = ${userId} AND service = ${service}
    `;
    const rows = (Array.isArray(rawRows) ? rawRows : []) as Record<string, unknown>[];
    const newBalance = rows.length > 0 ? Number(rows[0].balance_usdc) : 0;

    return NextResponse.json({
      new_balance: newBalance,
      credits_added: pack.credits,
      amount_charged: pack.price,
      pack: pack.id,
    });
  } catch (err) {
    console.error("[credits/topup]", err);
    return NextResponse.json({ error: "Top-up failed" }, { status: 500 });
  }
}
