import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GridOS — 산업 전력 배분 의사결정 서비스",
  description:
    "산업단지·가스·석유·전력·재생에너지 공공데이터를 결합해 신규 전력수요의 입지 적합도와 조건부 승인안을 계산하는 정책 의사결정 서비스",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
