import { NextResponse, type NextRequest } from "next/server";
import { getSql } from "@/lib/db";
import { getUserId } from "../shared";

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const service = searchParams.get("service");

  try {
    const sql = getSql();

    const rows = service
      ? await sql`
          SELECT * FROM credit_transactions
          WHERE user_id = ${userId} AND service = ${service}
          ORDER BY created_at DESC LIMIT 50
        `
      : await sql`
          SELECT * FROM credit_transactions
          WHERE user_id = ${userId}
          ORDER BY created_at DESC LIMIT 50
        `;

    return NextResponse.json({ transactions: rows });
  } catch (err) {
    console.error("[credits/history]", err);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
