/**
 * Internal credit debit route. Called server-side by MetEngine/ELSA routes.
 * Not intended for direct client calls.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getSql } from "@/lib/db";
import { isValidService } from "../shared";

export async function POST(request: NextRequest) {
  let body: { user_id?: string; service?: string; amount?: number; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { user_id, service, amount, description } = body;

  if (!user_id || !service || !isValidService(service) || !amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  try {
    const sql = getSql();

    // Atomic debit — only succeeds if balance >= amount
    const rawResult = await sql`
      UPDATE agent_credits
      SET
        balance_usdc = balance_usdc - ${amount},
        total_spent = total_spent + ${amount},
        updated_at = NOW()
      WHERE user_id = ${user_id}
        AND service = ${service}
        AND balance_usdc >= ${amount}
      RETURNING balance_usdc
    `;
    const result = (Array.isArray(rawResult) ? rawResult : []) as Record<string, unknown>[];

    if (result.length === 0) {
      const rawBal = await sql`
        SELECT balance_usdc FROM agent_credits
        WHERE user_id = ${user_id} AND service = ${service}
      `;
      const balRows = (Array.isArray(rawBal) ? rawBal : []) as Record<string, unknown>[];
      const currentBalance = balRows.length > 0 ? Number(balRows[0].balance_usdc) : 0;

      return NextResponse.json(
        { error: "insufficient_credits", balance: currentBalance, required: amount },
        { status: 402 },
      );
    }

    // Record usage transaction
    await sql`
      INSERT INTO credit_transactions (user_id, service, type, amount_usdc, description)
      VALUES (${user_id}, ${service}, 'usage', ${-amount}, ${description ?? "API query"})
    `;

    return NextResponse.json({ new_balance: Number(result[0].balance_usdc) });
  } catch (err) {
    console.error("[credits/debit]", err);
    return NextResponse.json({ error: "Debit failed" }, { status: 500 });
  }
}
