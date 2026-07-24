import { ImageResponse } from "next/og";

export const runtime = "edge";

// IG Story 直式尺寸
const W = 1080;
const H = 1920;
const ACCENT = "#FF4D00";

// 目前用 Latin-forward 版（satori 內建字型只涵蓋拉丁字，中文字形需另嵌 TTF 子集，列為後續）。
export async function GET(req: Request) {
  const reqUrl = new URL(req.url);
  const origin = reqUrl.origin;
  const { searchParams } = reqUrl;
  const series = (searchParams.get("series") || "HEAD").toUpperCase();
  const racquetSrc = `${origin}/racquets/${series.toLowerCase()}.png`;
  const model = searchParams.get("model") || "";
  const pct = searchParams.get("pct") || "";
  const tags = (searchParams.get("t") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

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
        }}
      >
        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 30, letterSpacing: 8, color: ACCENT, fontWeight: 700 }}>
            HEAD · RACQUET FINDER
          </div>
          <div style={{ fontSize: 24, letterSpacing: 4, color: "rgba(255,255,255,0.4)" }}>v1</div>
        </div>

        {/* body */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <div style={{ fontSize: 34, letterSpacing: 6, color: "rgba(255,255,255,0.5)", marginBottom: 18 }}>
            YOUR RACQUET
          </div>

          {/* racquet + name/score row */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={racquetSrc} alt="" width={300} height={720} style={{ objectFit: "contain", marginLeft: -30 }} />
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", fontSize: 88, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>
                {series}
              </div>
              <div style={{ display: "flex", fontSize: 64, fontWeight: 700, color: "rgba(255,255,255,0.82)", marginTop: 6 }}>
                {model}
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", marginTop: 30 }}>
                <div style={{ fontSize: 300, fontWeight: 900, color: ACCENT, lineHeight: 0.82, letterSpacing: -10 }}>
                  {pct}
                </div>
                <div style={{ fontSize: 100, fontWeight: 800, color: ACCENT, marginBottom: 34 }}>%</div>
              </div>
              <div style={{ fontSize: 28, letterSpacing: 8, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>
                MATCH SCORE
              </div>
            </div>
          </div>

          {/* progress bar */}
          <div style={{ display: "flex", width: "100%", height: 12, background: "rgba(255,255,255,0.1)", borderRadius: 6, marginTop: 40, overflow: "hidden" }}>
            <div style={{ width: `${Number(pct) || 0}%`, height: "100%", background: ACCENT }} />
          </div>

          {/* tag chips */}
          <div style={{ display: "flex", gap: 20, marginTop: 56 }}>
            {tags.map((t, i) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  padding: "18px 32px",
                  borderRadius: 14,
                  fontSize: 30,
                  fontWeight: 700,
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 28, color: "rgba(255,255,255,0.4)", letterSpacing: 3 }}>
          <div>FIND YOUR RACQUET</div>
          <div style={{ color: ACCENT }}>→ HEAD</div>
        </div>
      </div>
    ),
    { width: W, height: H }
  );
}
