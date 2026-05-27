/**
 * MetEngine x402 Proxy Route
 *
 * Flow:
 * 1. Validate auth + get user_id
 * 2. Make initial request to MetEngine → get 402 with price
 * 3. Check user's MetEngine credit balance >= price
 * 4. Sign x402 payment with server Solana wallet
 * 5. Re-send with payment → get data
 * 6. Debit user's credits
 * 7. Return data
 */

import { NextResponse, type NextRequest } from "next/server";
import { getSql } from "@/lib/db";

const METENGINE_BASE = "https://agent.metengine.xyz";

/** Allowlisted MetEngine API path prefixes */
const ALLOWED_PREFIXES = [
  "/api/v1/markets/",
  "/api/v1/trades/",
  "/api/v1/wallets/",
  "/api/v1/platform/",
  "/api/v1/hl/",
  "/api/v1/meteora/",
];

interface ProxyBody {
  endpoint: string;
  method?: "GET" | "POST";
  params?: Record<string, unknown>;
}

interface WwwAuthChallenge {
  id: string;
  method: string;
  request: string;
  opaque: string;
  description: string;
  expires: string;
}

function parseWwwAuthenticateSolana(header: string): WwwAuthChallenge | null {
  const challenges = header.split(/,\s*(?=Payment\s)/);
  for (const challenge of challenges) {
    const methodMatch = challenge.match(/method="([^"]+)"/);
    if (methodMatch?.[1] !== "solana") continue;
    const id = challenge.match(/id="([^"]+)"/)?.[1] ?? "";
    const request = challenge.match(/request="([^"]+)"/)?.[1] ?? "";
    const opaque = challenge.match(/opaque="([^"]+)"/)?.[1] ?? "";
    const description = challenge.match(/description="([^"]+)"/)?.[1] ?? "";
    const expires = challenge.match(/expires="([^"]+)"/)?.[1] ?? "";
    if (!request) return null;
    return { id, method: "solana", request, opaque, description, expires };
  }
  return null;
}

/** Validate auth and return user_id */
async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;

  try {
    const res = await fetch(`${apiUrl}/me`, {
      headers: { Authorization: authHeader },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user_id?: number; telegram_id?: number };
    const id = data.user_id ?? data.telegram_id;
    return id != null ? String(id) : null;
  } catch {
    return null;
  }
}

function isValidEndpoint(endpoint: string): boolean {
  if (endpoint.includes("..") || endpoint.includes("//")) return false;
  return ALLOWED_PREFIXES.some((p) => endpoint.startsWith(p));
}

/** Check user's MetEngine credit balance */
async function getBalance(userId: string): Promise<number> {
  const sql = getSql();
  const rawRows = await sql`
    SELECT balance_usdc FROM agent_credits
    WHERE user_id = ${userId} AND service = 'metengine'
  `;
  const rows = (Array.isArray(rawRows) ? rawRows : []) as Record<string, unknown>[];
  return rows.length > 0 ? Number(rows[0].balance_usdc) : 0;
}

/** Debit credits after successful query */
async function debitCredits(userId: string, amount: number, description: string): Promise<number> {
  const sql = getSql();
  const rawResult = await sql`
    UPDATE agent_credits
    SET balance_usdc = balance_usdc - ${amount},
        total_spent = total_spent + ${amount},
        updated_at = NOW()
    WHERE user_id = ${userId} AND service = 'metengine' AND balance_usdc >= ${amount}
    RETURNING balance_usdc
  `;
  const result = (Array.isArray(rawResult) ? rawResult : []) as Record<string, unknown>[];
  if (result.length === 0) return -1; // insufficient
  await sql`
    INSERT INTO credit_transactions (user_id, service, type, amount_usdc, description)
    VALUES (${userId}, 'metengine', 'usage', ${-amount}, ${description})
  `;
  return Number(result[0].balance_usdc);
}

export async function POST(request: NextRequest) {
  try {
    // Auth
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = (await request.json()) as ProxyBody;
    const { endpoint, method = "GET", params } = body;

    if (!endpoint || !isValidEndpoint(endpoint)) {
      return NextResponse.json({ error: "Invalid or disallowed endpoint." }, { status: 400 });
    }

    // Build URL
    let url = `${METENGINE_BASE}${endpoint}`;
    const fetchOpts: RequestInit = { method };

    if (method === "GET" && params) {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
      }
      const qsStr = qs.toString();
      if (qsStr) url += `?${qsStr}`;
    } else if (method === "POST" && params) {
      fetchOpts.headers = { "Content-Type": "application/json" };
      fetchOpts.body = JSON.stringify(params);
    }

    // Step 1: Initial request → expect 402
    const initial = await fetch(url, fetchOpts);

    if (initial.ok) {
      const data = await initial.json();
      return NextResponse.json({ data: data.data ?? data, cost_usdc: 0 });
    }

    if (initial.status !== 402) {
      const errBody = await initial.json().catch(() => ({}));
      return NextResponse.json(
        { error: (errBody as Record<string, string>).error ?? `MetEngine returned ${initial.status}` },
        { status: initial.status },
      );
    }

    // Step 2: Parse payment requirements from WWW-Authenticate header
    const privateKey = process.env.METENGINE_SOLANA_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        { error: "Solana wallet not configured." },
        { status: 503 },
      );
    }

    const wwwAuth = initial.headers.get("www-authenticate");
    const initialBody = await initial.json();

    const { x402Client, x402HTTPClient } = await import("@x402/core/client");
    const { registerExactSvmScheme } = await import("@x402/svm/exact/client");
    const { toClientSvmSigner } = await import("@x402/svm");
    const { getBase58Encoder, createKeyPairSignerFromBytes } = await import("@solana/kit");

    const bytes = getBase58Encoder().encode(privateKey);
    const signer = await createKeyPairSignerFromBytes(bytes);
    const client = new x402Client();
    registerExactSvmScheme(client, { signer: toClientSvmSigner(signer) });
    const httpClient = new x402HTTPClient(client);

    let paymentRequired: Record<string, unknown>;

    // Try standard x402 PAYMENT-REQUIRED header first, fall back to WWW-Authenticate
    try {
      paymentRequired = httpClient.getPaymentRequiredResponse(
        (name: string) => initial.headers.get(name),
        initialBody,
      );
    } catch {
      if (!wwwAuth) {
        return NextResponse.json({ error: "No payment information in 402 response." }, { status: 502 });
      }

      const challenge = parseWwwAuthenticateSolana(wwwAuth);
      if (!challenge) {
        return NextResponse.json({ error: "No Solana payment option available." }, { status: 502 });
      }

      const requestData = JSON.parse(
        Buffer.from(challenge.request, "base64").toString("utf-8"),
      ) as {
        amount: string;
        currency: string;
        recipient: string;
        methodDetails?: { decimals?: number; network?: string; tokenProgram?: string };
      };

      paymentRequired = {
        x402Version: 2,
        resource: { url, method },
        accepts: [
          {
            scheme: "exact",
            network: requestData.methodDetails?.network === "devnet"
              ? "solana-devnet"
              : requestData.methodDetails?.network === "testnet"
                ? "solana-testnet"
                : "solana",
            asset: requestData.currency,
            amount: requestData.amount,
            payTo: requestData.recipient,
            maxTimeoutSeconds: 120,
            extra: {
              tokenProgram: requestData.methodDetails?.tokenProgram,
              description: challenge.description,
              challengeId: challenge.id,
              opaque: challenge.opaque,
            },
          },
        ],
        extensions: {},
      };
    }

    const accepts = (paymentRequired as { accepts?: { amount: string }[] }).accepts;
    if (!accepts?.length) {
      return NextResponse.json({ error: "No payment options available." }, { status: 502 });
    }

    // Amount is in USDC base units (6 decimals), convert to dollars
    const rawAmount = Number(accepts[0]!.amount);
    const price = rawAmount >= 1000 ? rawAmount / 1_000_000 : rawAmount;

    // Step 3: Check user credits BEFORE paying
    const balance = await getBalance(userId);
    if (balance < price) {
      return NextResponse.json(
        { error: "insufficient_credits", balance, required: price },
        { status: 402 },
      );
    }

    // Step 4: Sign and pay
    console.log("[metengine] x402 price:", price, "USD for", endpoint);
    const paymentPayload = await httpClient.createPaymentPayload(
      paymentRequired as Parameters<typeof httpClient.createPaymentPayload>[0],
    );
    const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);

    const paid = await fetch(url, {
      ...fetchOpts,
      headers: {
        ...(fetchOpts.headers as Record<string, string> | undefined),
        ...paymentHeaders,
      },
    });

    if (!paid.ok) {
      const errBody = await paid.json().catch(() => ({}));
      console.error("[metengine] x402 payment failed:", paid.status, JSON.stringify(errBody));
      return NextResponse.json(
        { error: (errBody as Record<string, string>).error ?? `Payment failed (${paid.status})` },
        { status: paid.status },
      );
    }

    const paidBody = (await paid.json()) as { data: unknown };

    // Step 5: Debit credits (only after successful payment)
    const endpointName = endpoint.split("/").slice(-1)[0] ?? "query";
    const newBalance = await debitCredits(userId, price, `${endpointName} query`);

    // Step 6: Settlement proof
    let settlementTx: string | undefined;
    try {
      const settlement = httpClient.getPaymentSettleResponse(
        (name: string) => paid.headers.get(name),
      );
      settlementTx = (settlement as Record<string, unknown>)?.txHash as string | undefined;
    } catch {
      // optional
    }

    return NextResponse.json({
      data: paidBody.data,
      cost_usdc: price,
      new_balance: newBalance,
      settlement_tx: settlementTx,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
