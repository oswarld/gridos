import type { Metadata } from "next";
import "./globals.css";

const basePath = process.env.PAGES_BASE_PATH?.replace(/\/$/, "") ?? "";

export const metadata: Metadata = {
  title: "GridOS · Public Infrastructure Atlas",
  description:
    "대한민국·일본·대만·미국의 산업, 에너지, 데이터센터와 네트워크 인프라를 공개 근거와 함께 탐색하는 공익 지도",
  icons: {
    icon: `${basePath}/high-voltage.webp`,
    apple: `${basePath}/high-voltage.webp`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
