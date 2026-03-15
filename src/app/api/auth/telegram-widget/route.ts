import { NextRequest, NextResponse } from "next/server";

const API2_BASE_URL = "https://staging.heyanna.trade";

/**
 * Proxy the Telegram Login Widget auth call to api2.
 * Avoids CORS: browser calls /api/auth/telegram-widget (same origin),
 * server calls api2 server-to-server (no CORS).
 *
 * api2's /auth/telegram-widget returns text/html containing the JWT.
 * We parse the token out and return it as JSON to the client.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams.toString();
  const url = `${API2_BASE_URL}/auth/telegram-widget${params ? `?${params}` : ""}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json, text/html",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Auth server error ${res.status}`, detail: body.slice(0, 200) },
        { status: res.status },
      );
    }

    const ct = res.headers.get("content-type") ?? "";

    // Happy path: api2 returned JSON
    if (ct.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    // api2 returns an HTML page with the JWT embedded — extract it
    const html = await res.text();

    // 1. Try to find a JSON object containing access_token
    const jsonMatch = html.match(/\{[^<>]*"access_token"[^<>]*\}/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0]);
        return NextResponse.json(data);
      } catch { /* fall through */ }
    }

    // 2. Extract a bare JWT (three base64url segments)
    const jwtMatch = html.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
    if (jwtMatch) {
      return NextResponse.json({ access_token: jwtMatch[0] });
    }

    return NextResponse.json(
      { error: "Could not extract token from auth server response" },
      { status: 502 },
    );
  } catch {
    return NextResponse.json(
      { error: "Auth server unreachable" },
      { status: 503 },
    );
  }
}
