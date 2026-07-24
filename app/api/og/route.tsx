import { ImageResponse } from "next/og";

export const runtime = "edge";

// IG Story 直式尺寸
const W = 1080;
const H = 1920;
const ACCENT = "#FF4D00";

let fontCache: ArrayBuffer | null = null;
async function loadFont(origin: string): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;
  // Subsetted Noto Sans TC (700) served from /public — fetched at runtime so it
  // never bloats the edge bundle. satori needs ttf/otf/woff (not woff2).
  const res = await fetch(new URL("/fonts/NotoSansTC-700.ttf", origin));
  fontCache = await res.arrayBuffer();
  return fontCache;
}

export async function GET(req: Request) {
  const reqUrl = new URL(req.url);
  const origin = reqUrl.origin;
  const sp = reqUrl.searchParams;
  const series = (sp.get("series") || "HEAD").toUpperCase();
  const model = sp.get("model") || "";
  const pct = sp.get("pct") || "";
  const nickname = (sp.get("nn") || "").slice(0, 20);
  const tags = (sp.get("t") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  const racquetSrc = `${origin}/racquets/${series.toLowerCase()}.png`;
  const font = await loadFont(origin);

  const heading = nickname ? `${nickname} 的本命球拍` : "你的本命球拍";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0A0A0A",
          backgroundImage: "radial-gradient(circle at 50% 12%, rgba(255,77,0,0.20), transparent 55%)",
          padding: "96px 88px",
          color: "#fff",
          fontFamily: '"Noto TC"',
        }}
      >
        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 32, letterSpacing: 6, color: ACCENT }}>HEAD · 官方選拍測驗</div>
          <div style={{ fontSize: 24, letterSpacing: 4, color: "rgba(255,255,255,0.4)" }}>v1</div>
        </div>

        {/* body */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <div style={{ fontSize: 40, color: "rgba(255,255,255,0.6)", marginBottom: 20 }}>{heading}</div>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={racquetSrc} alt="" width={300} height={720} style={{ objectFit: "contain", marginLeft: -30 }} />
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", fontSize: 88, fontWeight: 700, letterSpacing: -2, lineHeight: 1 }}>{series}</div>
              <div style={{ display: "flex", fontSize: 64, color: "rgba(255,255,255,0.82)", marginTop: 6 }}>{model}</div>
              <div style={{ display: "flex", alignItems: "flex-end", marginTop: 30 }}>
                <div style={{ fontSize: 300, fontWeight: 700, color: ACCENT, lineHeight: 0.82, letterSpacing: -10 }}>{pct}</div>
                <div style={{ fontSize: 100, color: ACCENT, marginBottom: 34 }}>%</div>
              </div>
              <div style={{ fontSize: 30, letterSpacing: 6, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>匹配度 MATCH</div>
            </div>
          </div>

          {/* progress bar */}
          <div style={{ display: "flex", width: "100%", height: 12, background: "rgba(255,255,255,0.1)", borderRadius: 6, marginTop: 40, overflow: "hidden" }}>
            <div style={{ width: `${Number(pct) || 0}%`, height: "100%", background: ACCENT }} />
          </div>

          {/* tag chips (Chinese) */}
          <div style={{ display: "flex", gap: 20, marginTop: 56 }}>
            {tags.map((t, i) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  padding: "18px 32px",
                  borderRadius: 14,
                  fontSize: 30,
                  background: i === 0 ? ACCENT : "transparent",
                  color: i === 0 ? "#141414" : "rgba(255,255,255,0.8)",
                  border: i === 0 ? "none" : "2px solid rgba(255,255,255,0.22)",
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 30, color: "rgba(255,255,255,0.45)", letterSpacing: 2 }}>
          <div>找到你的本命球拍</div>
          <div style={{ color: ACCENT }}>→ HEAD</div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: [{ name: "Noto TC", data: font, weight: 700, style: "normal" }] }
  );
}
