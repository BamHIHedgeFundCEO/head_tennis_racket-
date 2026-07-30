import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono, Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});
const noto = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-noto",
  display: "swap",
});

const TITLE = "找到你的本命球拍 · HEAD 官方選拍工具";
const DESCRIPTION =
  "回答 15 題,演算法為你比對 HEAD 全系列規格,精準命中真正適合你的那一支。";

// Absolute URLs for crawlers. Vercel sets VERCEL_URL per deployment; override
// with NEXT_PUBLIC_SITE_URL once the production domain is attached.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "HEAD 選拍工具",
  openGraph: {
    type: "website",
    locale: "zh_TW",
    title: TITLE,
    description: DESCRIPTION,
    siteName: "HEAD 選拍工具",
    images: [{ url: "/api/og?fmt=card", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/api/og?fmt=card"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className={`${archivo.variable} ${mono.variable} ${noto.variable}`}>
        <a href="#main" className="skip-link">跳到主要內容</a>
        {children}
      </body>
    </html>
  );
}
