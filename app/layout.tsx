import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "K-GRID · 산업 전력 배분 의사결정 플랫폼",
  description:
    "공공데이터를 바탕으로 신규 전력수요의 입지 적합도와 승인 조건을 계산해 정책 타당성과 입지 검토 근거를 제공하는 의사결정 플랫폼",
  icons: { icon: "/high-voltage.webp", apple: "/high-voltage.webp" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
