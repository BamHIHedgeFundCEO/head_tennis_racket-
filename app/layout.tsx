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

export const metadata: Metadata = {
  title: "找到你的本命球拍 · HEAD 官方選拍工具",
  description: "回答 15 題,演算法為你比對 HEAD 全系列規格,精準命中真正適合你的那一支。",
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
        {children}
      </body>
    </html>
  );
}
