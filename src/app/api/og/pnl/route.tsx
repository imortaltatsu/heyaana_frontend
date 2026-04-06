import { existsSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";

/** Node: read disk + pre-scale so Satori never bilinear-filters the 1024² pixel art. */
export const runtime = "nodejs";

/** Display size in OG layout (px). Intrinsic image matches this → crisp pixels. */
const BRAND_LOGO_PX = 48;

const W = 1200;
const H = 630;

let cachedHeyAnnaLogoDataUri: string | null | undefined;

async function getHeyAnnaLogoDataUri(): Promise<string | null> {
  if (cachedHeyAnnaLogoDataUri !== undefined) return cachedHeyAnnaLogoDataUri;
  const filePath = join(process.cwd(), "public", "heyannalogo.png");
  if (!existsSync(filePath)) {
    cachedHeyAnnaLogoDataUri = null;
    return null;
  }
  try {
    const sharp = (await import("sharp")).default;
    const buf = await sharp(filePath)
      .resize(BRAND_LOGO_PX, BRAND_LOGO_PX, {
        fit: "cover",
        kernel: sharp.kernel.nearest,
      })
      .png({ compressionLevel: 9 })
      .toBuffer();
    cachedHeyAnnaLogoDataUri = `data:image/png;base64,${buf.toString("base64")}`;
    return cachedHeyAnnaLogoDataUri;
  } catch {
    cachedHeyAnnaLogoDataUri = null;
    return null;
  }
}

/** Sticker overlays: stick1 = profit, stick2 = loss. Cached per-process. */
const STICKER_H = 620;

let cachedStick1DataUri: string | null | undefined;
let cachedStick2DataUri: string | null | undefined;

async function getStickerDataUri(
  variant: "stick1" | "stick2",
): Promise<string | null> {
  const cached = variant === "stick1" ? cachedStick1DataUri : cachedStick2DataUri;
  if (cached !== undefined) return cached;
  const filePath = join(process.cwd(), "public", `${variant}.png`);
  if (!existsSync(filePath)) {
    if (variant === "stick1") cachedStick1DataUri = null;
    else cachedStick2DataUri = null;
    return null;
  }
  try {
    const sharp = (await import("sharp")).default;
    const buf = await sharp(filePath)
      .resize({ height: STICKER_H, fit: "inside", kernel: sharp.kernel.nearest })
      .png({ compressionLevel: 9 })
      .toBuffer();
    const uri = `data:image/png;base64,${buf.toString("base64")}`;
    if (variant === "stick1") cachedStick1DataUri = uri;
    else cachedStick2DataUri = uri;
    return uri;
  } catch {
    if (variant === "stick1") cachedStick1DataUri = null;
    else cachedStick2DataUri = null;
    return null;
  }
}

let cachedHeyBannerDataUri: string | null | undefined;

/** Full-bleed backdrop from `public/heybanner.png` (scaled to OG size). */
async function getHeyBannerDataUri(): Promise<string | null> {
  if (cachedHeyBannerDataUri !== undefined) return cachedHeyBannerDataUri;
  const filePath = join(process.cwd(), "public", "heybanner.png");
  if (!existsSync(filePath)) {
    cachedHeyBannerDataUri = null;
    return null;
  }
  try {
    const sharp = (await import("sharp")).default;
    const buf = await sharp(filePath)
      .resize(W, H, { fit: "cover", position: "centre" })
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer();
    cachedHeyBannerDataUri = `data:image/jpeg;base64,${buf.toString("base64")}`;
    return cachedHeyBannerDataUri;
  } catch {
    cachedHeyBannerDataUri = null;
    return null;
  }
}

/** Fallback when `heybanner.png` is missing. */
const BG = "linear-gradient(135deg, #000000 0%, #001f3f 100%)";
const MUTED = "#9CA3AF";
const WHITE = "#FFFFFF";
const PROFIT = "#22C55E";
const LOSS = "#f87171";
const ORANGE = "#f97316";
const PILL = "rgba(34, 197, 94, 0.45)";

const MAX_MARKET_LEN = 1800;

/**
 * Hiragino Kaku Gothic Pro is macOS-only and not redistributable for Linux/serverless OG renders.
 * Noto Sans (TTF from Google Fonts) is a similar clean Gothic UI sans and works with Satori (TTF/OTF only — never WOFF2).
 * @see https://fonts.google.com/noto/specimen/Noto+Sans
 */
const NOTO_SANS_TTF: Record<400 | 500 | 600 | 700 | 800, string> = {
  400: "https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A99d.ttf",
  500: "https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyDPA99d.ttf",
  600: "https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyAjBN9d.ttf",
  700: "https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyAaBN9d.ttf",
  800: "https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyB9BN9d.ttf",
};

type OgFontWeight = 400 | 500 | 600 | 700 | 800;

type OgFont = {
  name: "Noto Sans";
  data: ArrayBuffer;
  style: "normal";
  weight: OgFontWeight;
};

let cachedOgFonts: OgFont[] | undefined;

async function getOgFonts(): Promise<OgFont[]> {
  if (cachedOgFonts !== undefined) return cachedOgFonts;
  const weights: OgFontWeight[] = [400, 500, 600, 700, 800];
  const out: OgFont[] = [];
  try {
    for (const w of weights) {
      const res = await fetch(NOTO_SANS_TTF[w]);
      if (!res.ok) {
        cachedOgFonts = [];
        return [];
      }
      out.push({
        name: "Noto Sans",
        data: await res.arrayBuffer(),
        style: "normal",
        weight: w,
      });
    }
    cachedOgFonts = out;
    return out;
  } catch {
    cachedOgFonts = [];
    return [];
  }
}

function clampStr(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function parsePnl(raw: string | null): number {
  if (raw == null || raw === "") return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function parsePnlPct(raw: string | null): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const assetOrigin = `${requestUrl.protocol}//${requestUrl.host}`;
  const [logoDataUri, bannerSrc, stick1Src, stick2Src] = await Promise.all([
    getHeyAnnaLogoDataUri(),
    getHeyBannerDataUri(),
    getStickerDataUri("stick1"),
    getStickerDataUri("stick2"),
  ]);
  const brandLogoSrc = logoDataUri ?? `${assetOrigin}/heyannalogo.png`;

  const { searchParams } = requestUrl;

  const market = clampStr(searchParams.get("market") ?? "Market", MAX_MARKET_LEN);
  const pnl = parsePnl(searchParams.get("pnl"));
  const pnlCashFromClient = clampStr(searchParams.get("pnlCash") ?? "", 36).trim();
  const pnlPct = parsePnlPct(searchParams.get("pnlPct"));
  const entry = clampStr(searchParams.get("entry") ?? "—", 28);
  const exit = clampStr(searchParams.get("exit") ?? "—", 28);
  const date = clampStr(searchParams.get("date") ?? "", 40);
  const status = clampStr(searchParams.get("status") ?? "Open", 28);
  const iconUrl = searchParams.get("icon");
  const handle =
    clampStr(
      process.env.NEXT_PUBLIC_PNL_SHARE_HANDLE ?? "x.com/tryheyanna",
      48,
    ) || "x.com/tryheyanna";

  const displayDate =
    date ||
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date());

  const isProfit = pnl >= 0;
  const pnlColor = isProfit ? PROFIT : LOSS;
  const abs = Math.abs(pnl);
  const pnlBody =
    abs >= 1_000_000
      ? `${(abs / 1_000_000).toFixed(2)}M`
      : abs >= 10_000
        ? `${(abs / 1_000).toFixed(2)}K`
        : abs.toLocaleString("en-US", {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0,
          });
  const pnlCashText =
    pnlCashFromClient ||
    `${isProfit ? "+" : "−"}$${pnlBody}`;
  const pctKnown = pnlPct !== null;
  const pctText = pctKnown
    ? `${pnlPct! >= 0 ? "+" : "−"}${Math.abs(pnlPct!).toFixed(2)}%`
    : "";
  const pctColor =
    pctKnown && pnlPct! >= 0 ? PROFIT : pctKnown ? LOSS : MUTED;

  const fonts = await getOgFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {bannerSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- OG ImageResponse runtime
          <img
            src={bannerSrc}
            alt=""
            width={W}
            height={H}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: W,
              height: H,
              objectFit: "cover",
            }}
          />
        ) : null}
        {/* Sticker overlay: stick1 for profit, stick2 for loss */}
        {(() => {
          const stickerSrc = isProfit ? stick1Src : stick2Src;
          if (!stickerSrc) return null;
          return (
            // eslint-disable-next-line @next/next/no-img-element -- OG ImageResponse runtime
            <img
              src={stickerSrc}
              alt=""
              height={STICKER_H}
              style={{
                position: "absolute",
                right: 20,
                bottom: 0,
                height: STICKER_H,
                opacity: 0.37,
                objectFit: "contain",
                imageRendering: "pixelated",
              }}
            />
          );
        })()}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            height: "100%",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "44px 52px 40px",
            background: bannerSrc ? "transparent" : BG,
            fontFamily:
              fonts.length > 0
                ? '"Noto Sans", "Hiragino Kaku Gothic Pro", "Hiragino Sans", ui-sans-serif, sans-serif'
                : 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic Pro", "Hiragino Sans", "Segoe UI", sans-serif',
          }}
        >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            width: "100%",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 18,
              alignItems: "flex-start",
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: ORANGE,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- OG ImageResponse runtime
                <img
                  src={iconUrl}
                  alt=""
                  width={56}
                  height={56}
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <span style={{ color: WHITE, fontSize: 30, fontWeight: 800 }}>
                  ₿
                </span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                flex: 1,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  color: WHITE,
                  fontSize: 26,
                  fontWeight: 600,
                  lineHeight: 1.3,
                  maxWidth: 780,
                }}
              >
                {market}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 140,
                    height: 9,
                    borderRadius: 999,
                    background: PILL,
                  }}
                />
                <span
                  style={{
                    color: MUTED,
                    fontSize: 15,
                    fontWeight: 500,
                  }}
                >
                  {status}
                </span>
              </div>
            </div>
          </div>

          {/* HeyAnna — compact top-right, matches share-card reference (mascot + wordmark) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 6,
              flexShrink: 0,
              paddingTop: 2,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- OG ImageResponse runtime */}
            <img
              src={brandLogoSrc}
              alt=""
              width={BRAND_LOGO_PX}
              height={BRAND_LOGO_PX}
              style={{
                width: BRAND_LOGO_PX,
                height: BRAND_LOGO_PX,
                objectFit: "fill",
                imageRendering: "pixelated",
              }}
            />
            <div
              style={{
                color: WHITE,
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: -0.2,
              }}
            >
              HeyAnna
            </div>
          </div>
        </div>

        {/* Center: cash PnL + % (matches dashboard) */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            marginTop: -8,
          }}
        >
          <div
            style={{
              color: "rgba(255,255,255,0.72)",
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            PnL
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                color: pnlColor,
                fontSize: 92,
                fontWeight: 800,
                letterSpacing: -3,
                lineHeight: 1,
              }}
            >
              {pnlCashText}
            </div>
            {pctKnown ? (
              <div
                style={{
                  color: pctColor,
                  fontSize: 36,
                  fontWeight: 700,
                  letterSpacing: -0.5,
                  lineHeight: 1,
                }}
              >
                {pctText}
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            width: "100%",
            paddingTop: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", gap: 44 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ color: MUTED, fontSize: 15, fontWeight: 500 }}>
                Avg Entry Price
              </div>
              <div style={{ color: WHITE, fontSize: 30, fontWeight: 700 }}>
                {entry}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ color: MUTED, fontSize: 15, fontWeight: 500 }}>
                Exit Price
              </div>
              <div style={{ color: WHITE, fontSize: 30, fontWeight: 700 }}>
                {exit}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                paddingLeft: 44,
                borderLeft: "2px solid rgba(255,255,255,0.28)",
              }}
            >
              <div style={{ color: MUTED, fontSize: 15, fontWeight: 500 }}>
                Date
              </div>
              <div style={{ color: WHITE, fontSize: 30, fontWeight: 700 }}>
                {displayDate}
              </div>
            </div>
          </div>
          <div
            style={{
              color: WHITE,
              fontSize: 17,
              fontWeight: 500,
              opacity: 0.92,
            }}
          >
            {handle}
          </div>
        </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      ...(fonts.length > 0 ? { fonts } : {}),
    },
  );
}
