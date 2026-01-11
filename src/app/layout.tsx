import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { ToastContainer } from "@/components/common";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "組織図エディタ - OrgChart Editor",
  description: "チームの構造をマインドマップで見える化。複数拠点・複数部署の組織図を簡単に作成・共有できます。",
  keywords: ["組織図", "マインドマップ", "チーム構造", "人事", "組織管理"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${notoSansJP.variable} antialiased min-h-screen`}
        style={{ fontFamily: 'var(--font-noto-sans-jp), sans-serif' }}
      >
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
