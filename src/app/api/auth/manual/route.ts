import { NextRequest, NextResponse } from "next/server";

const API2_BASE_URL = "https://staging.heyanna.trade";

/**
 * Proxy for dev/manual login — calls api2 server-to-server so
 * the optional DEV_API_KEY secret never reaches the browser.
 */
export async function POST(req: NextRequest) {
  const params = req.nextUrl.searchParams.toString();
  const url = `${API2_BASE_URL}/auth/manual${params ? `?${params}` : ""}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  };

  if (process.env.DEV_API_KEY) {
    headers["X-Api-Key"] = process.env.DEV_API_KEY;
  }

  try {
    const res = await fetch(url, { method: "POST", headers });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Auth server error ${res.status}`, detail: body.slice(0, 200) },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Auth server unreachable" }, { status: 503 });
  }
}
