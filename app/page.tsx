import type { Metadata } from "next";
import AtlasDashboard from "@/components/atlas/AtlasDashboard";

export const metadata: Metadata = {
  title: "GridOS · 공공 인프라 아틀라스",
  description:
    "대한민국·일본·대만·중국·미국의 산업·에너지·디지털 기반시설을 공개 근거와 함께 탐색합니다.",
};

export default function Home() {
  return <AtlasDashboard locale="ko" />;
}
