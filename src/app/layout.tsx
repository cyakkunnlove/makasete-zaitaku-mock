import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AppRecoveryBanner } from '@/components/recovery/app-recovery-banner'
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "任せて在宅 | 在宅薬局の立ち上げ・教育・運用支援",
  description: "マカセテ在宅株式会社が提供する、在宅薬局の立ち上げ、教育、営業、薬局運用DX、夜間連携までを支えるサービス",
  icons: { icon: "/homepage-assets/from-reference/logo-mark.jpg" },
};

export const viewport: Viewport = {
  themeColor: "#1e40af",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0e1a]`}
      >
        {children}
        <AppRecoveryBanner />
      </body>
    </html>
  );
}
