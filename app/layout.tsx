import type { Metadata } from "next";
import "./globals.css";

const basePath = process.env.PAGES_BASE_PATH?.replace(/\/$/, "") ?? "";
const siteUrl = "https://oswarld.github.io/gridos/";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "GridOS · Public Infrastructure Atlas",
  description:
    "대한민국·일본·대만·중국·미국의 산업, 에너지, 데이터센터와 네트워크 인프라를 공개 근거와 함께 탐색하는 공익 지도",
  icons: {
    icon: `${basePath}/high-voltage.webp`,
    apple: `${basePath}/high-voltage.webp`,
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "GridOS",
    title: "GridOS · Public Infrastructure Atlas",
    description:
      "Five-country public map of energy, industrial, and digital infrastructure.",
    images: [
      {
        url: `${siteUrl}og.png`,
        width: 1200,
        height: 630,
        alt: "GridOS Public Infrastructure Atlas — KR, JP, TW, CN, US",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GridOS · Public Infrastructure Atlas",
    description:
      "Five-country public map of energy, industrial, and digital infrastructure.",
    images: [`${siteUrl}og.png`],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
