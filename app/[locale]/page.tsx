import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AtlasDashboard from "@/components/atlas/AtlasDashboard";
import { isLocale, LOCALES } from "@/lib/i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

const META: Record<string, { title: string; description: string }> = {
  ko: {
    title: "GridOS · 공공 인프라 아틀라스",
    description:
      "대한민국·일본·대만·중국·미국의 산업·에너지·디지털 기반시설을 공개 근거와 함께 탐색합니다.",
  },
  en: {
    title: "GridOS · Public Infrastructure Atlas",
    description:
      "Explore industrial, energy, and digital infrastructure across South Korea, Japan, Taiwan, China, and the United States with public evidence.",
  },
  "zh-CN": {
    title: "GridOS · 公共基础设施地图",
    description:
      "依据公开证据探索韩国、日本、台湾、中国和美国的产业、能源与数字基础设施。",
  },
  ja: {
    title: "GridOS · 公共インフラアトラス",
    description:
      "韓国・日本・台湾・中国・米国の産業、エネルギー、デジタル基盤施設を公開根拠とともに探索します。",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return META[locale] ?? META.ko;
}

export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <AtlasDashboard locale={locale} />;
}
