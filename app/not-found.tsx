import Link from "next/link";
import { Shell } from "../components/ui";
import { LINKS, hasWebsite } from "../lib/links";

export const metadata = { title: "找不到這一頁 · HEAD 選拍工具" };

export default function NotFound() {
  return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 22 }}>
        <div className="mono" style={{ fontWeight: 700, fontSize: 11, letterSpacing: ".24em", color: "var(--ink-faint)" }}>
          404 · PAGE NOT FOUND
        </div>
        <div>
          <h1 className="archivo" style={{ fontWeight: 900, fontSize: "clamp(34px,11vw,42px)", lineHeight: 1.06, letterSpacing: "-.02em", margin: "0 0 12px" }}>
            這一球出界了
          </h1>
          <p style={{ fontFamily: "var(--font-noto)", fontSize: 15, lineHeight: 1.6, color: "var(--ink-dim)", margin: 0, maxWidth: 320 }}>
            你找的頁面不存在,或已經換了位置。回到測驗，15 題就能知道哪支球拍是你的。
          </p>
        </div>

        {/* every dead end needs a way back */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link
            href="/"
            className="archivo btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              height: 56,
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: ".02em",
              color: "#141414",
            }}
          >
            回到選拍測驗 <span className="mono" style={{ fontWeight: 700 }}>→</span>
          </Link>
          {hasWebsite() && (
            <a
              href={LINKS.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mono link-quiet"
              style={{ textAlign: "center", fontSize: 11, letterSpacing: ".14em", padding: "12px 6px" }}
            >
              前往 HEAD 官網 →
            </a>
          )}
        </div>
      </div>
    </Shell>
  );
}
