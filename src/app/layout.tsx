import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI League AIueo · Grassroots AI Alliance",
  description: "AI同盟 / 草AIチーム — 週末に集まり、AIを触り、プロトタイプで遊ぶ同盟。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} scroll-smooth antialiased bg-[#080808] text-[#f0ede8]`}
    >
      <body className="min-h-full flex flex-col bg-[#080808]">{children}</body>
    </html>
  );
}
