"use client";

import { useCallback, useMemo, useState } from "react";
import type { DemandScenario, GridData } from "@/lib/types";
import { computeScores } from "@/lib/domain/scoring";
import RegionSelector from "./RegionSelector";
import DataStatusPanel from "./DataStatusPanel";
import ScenarioInput from "./ScenarioInput";
import RecommendationResults from "./RecommendationResults";

const DEFAULT_SCENARIO: DemandScenario = {
  sector: "data_center",
  demandMw: 300,
  flexibility: "medium",
  renewablePpaIntent: false,
  residentBenefitModel: false,
};

const NAV = [
  { id: "regions", label: "지역 선택" },
  { id: "data", label: "데이터 현황" },
  { id: "scenario", label: "시나리오" },
  { id: "results", label: "추천 결과" },
];

export type QuotaState = {
  remaining: number | null; // null = 무제한
  signedIn: boolean;
  email: string | null;
};

export default function GridDashboard({ data }: { data: GridData }) {
  const [selected, setSelected] = useState<string[]>(data.regions.map((r) => r.regionCode));
  // draft: 편집 중인 조건, applied: 결과에 반영된 조건 (실행 버튼으로만 반영)
  const [draft, setDraft] = useState<DemandScenario>(DEFAULT_SCENARIO);
  const [applied, setApplied] = useState<DemandScenario>(DEFAULT_SCENARIO);
  const [running, setRunning] = useState(false);
  const quota: QuotaState = { remaining: null, signedIn: false, email: null };

  const allScores = useMemo(() => computeScores(data, applied), [data, applied]);
  const scores = useMemo(
    () => allScores.filter((s) => selected.includes(s.regionCode)),
    [allScores, selected]
  );
  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(applied), [draft, applied]);

  const runScenario = useCallback(() => {
    setRunning(true);
    setApplied(draft);
    setRunning(false);
    document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
  }, [draft]);

  const totalRows = data.sources.reduce((s, x) => s + x.rowCount, 0);

  return (
    <div className="min-h-screen bg-canvas">
      {/* ── 상단 내비게이션 ── */}
      <header className="sticky top-0 z-30 border-b border-hairline-soft bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
          <a href="#" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/high-voltage.webp" alt="" className="h-8 w-8" />
            <span className="text-[17px] font-semibold tracking-tight text-ink">K-GRID</span>
          </a>
          <nav className="ml-4 hidden gap-1 md:flex">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className="rounded-full px-3.5 py-1.5 text-[14px] font-medium text-steel transition hover:bg-surface hover:text-ink"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <span className="ml-auto rounded-full bg-surface px-3 py-1 text-[12px] font-medium text-steel">
            로컬 연구 모듈
          </span>
        </div>
      </header>

      <main>
        {/* ── 히어로 ── */}
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-16 md:pt-24">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-yellow px-3 py-1 text-[13px] font-semibold text-ink">
            제14회 산업통상부 공공데이터 활용 아이디어 공모전 · 제품 및 서비스
          </span>
          <h1 className="mt-6 max-w-3xl text-[36px] font-medium leading-[1.1] tracking-[-1px] text-ink md:text-[52px]">
            신규 전력수요,
            <br />
            어느 지역에 어떤 조건으로 배분할까
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-[1.6] text-slate2">
            K-GRID는 산업단지 · 가스 · 석유 · 전력 · 재생에너지 공공데이터를 결합해 데이터센터,
            철강, 첨단제조 신규 수요를 어느 지역에 어떤 조건으로 배치해야 하는지 계산합니다.
            3대 메가프로젝트와 전력 인프라 논의를 지역 갈등이 아니라 정책 타당성과 전력 공백 대응
            관점에서 설명할 수 있도록 정부·지자체·기업 입지선정팀에 정량 근거를 제공합니다.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#scenario"
              className="rounded-full bg-ink px-6 py-3 text-[14px] font-medium text-white transition hover:bg-charcoal"
            >
              시나리오 실행해 보기
            </a>
            <a
              href="#data"
              className="rounded-full border border-hairline-strong px-6 py-3 text-[14px] font-medium text-ink transition hover:bg-surface"
            >
              활용 데이터 보기
            </a>
          </div>

          {/* 스탯 밴드 */}
          <div className="mt-14 grid grid-cols-2 gap-6 border-t border-hairline-soft pt-8 md:grid-cols-4">
            {[
              [String(data.sources.length) + "종", "공공데이터 원천"],
              ["17개", "비교 가능한 시도"],
              [totalRows.toLocaleString() + "행", "처리한 원천 데이터"],
              ["6개 축", "입지 적합도 평가"],
            ].map(([num, label]) => (
              <div key={label}>
                <p className="text-[32px] font-medium tracking-[-1px] text-ink md:text-[40px]">{num}</p>
                <p className="mt-1 text-[14px] text-steel">{label}</p>
              </div>
            ))}
          </div>
          {data.national.gasPeakSupplyLatest?.value != null && (
            <p className="mt-6 text-[13px] text-stone2">
              전국 컨텍스트: 시간당 최대 천연가스 공급량{" "}
              {data.national.gasPeakSupplyLatest.value.toLocaleString()} 천㎥ ·{" "}
              {data.national.gasPeakSupplyLatest.date} 기준 · 한국가스공사
            </p>
          )}
        </section>

        <div className="mx-auto max-w-6xl space-y-16 px-6 pb-24">
          <section id="regions" className="scroll-mt-24">
            <RegionSelector data={data} selected={selected} onChange={setSelected} />
          </section>

          <section id="data" className="scroll-mt-24">
            <DataStatusPanel data={data} />
          </section>

          <section id="scenario" className="scroll-mt-24">
            <ScenarioInput
              draft={draft}
              onChange={setDraft}
              onRun={runScenario}
              running={running}
              isDirty={isDirty}
              quota={quota}
              quotaLoaded
            />
          </section>

          <section id="results" className="scroll-mt-24">
            <RecommendationResults data={data} scenario={applied} scores={scores} />
          </section>
        </div>

        {/* ── 다크 CTA + 푸터 ── */}
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="rounded-[32px] bg-ink px-8 py-14 text-center md:px-16">
            <h2 className="text-[28px] font-medium leading-[1.25] text-white md:text-[36px]">
              전력 배분 의사결정, 데이터로 시작하세요
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[15px] leading-[1.6] text-white/60">
              모든 점수와 판정은 공공데이터에서만 계산되며 근거와 기준일이 함께 표시됩니다.
              정부 부처, 지자체, 산업단지 운영기관, 기업 입지선정팀이 사전 검토와 이해관계자 설득에
              바로 활용할 수 있습니다.
            </p>
            <a
              href="#scenario"
              className="mt-8 inline-block rounded-full bg-white px-6 py-3 text-[14px] font-medium text-ink transition hover:bg-white/90"
            >
              지금 시작하기
            </a>
          </div>
        </section>
      </main>

      <footer className="bg-ink">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/high-voltage.webp" alt="" className="h-7 w-7" />
              <span className="text-[15px] font-semibold text-white">K-GRID</span>
            </div>
            <p className="mt-4 text-[13px] leading-[1.6] text-white/50">
              산업 전력 배분 의사결정 플랫폼. 정책 타당성과 입지 조건을 공공데이터로 설명하는 사전
              검토 도구이며 실시간 전력계통 운영을 대체하지 않습니다. 원천에 없는 값은 추정하지
              않습니다.
            </p>
          </div>
          <div>
            <p className="text-[15px] font-medium text-white">활용 공공데이터</p>
            <ul className="mt-3 space-y-1.5 text-[13px] text-white/50">
              <li>한국산업단지공단 · 산업단지 현황 및 동향</li>
              <li>한국가스공사 · 천연가스 공급량</li>
              <li>한국석유공사 · 석유제품 소비 현황</li>
              <li>한국가스안전공사 · 도시가스 공급 정보</li>
              <li>한국전력거래소 · 태양광 및 풍력 발전량</li>
              <li>한국에너지공단 · 신재생에너지 보급 현황</li>
              <li>VWorld · 시도 행정경계</li>
            </ul>
          </div>
          <div>
            <p className="text-[15px] font-medium text-white">프로젝트</p>
            <ul className="mt-3 space-y-1.5 text-[13px] text-white/50">
              <li>제14회 산업통상부 공공데이터 활용 아이디어 공모전 출품작</li>
              <li>데이터 생성 {new Date(data.generatedAt).toLocaleDateString("ko-KR")}</li>
              <li>
                데이터 적재 상태:{" "}
                {data.dataOrigin === "supabase" ? "실시간 데이터베이스 연동" : "검증된 데이터 스냅샷"}
              </li>
            </ul>
          </div>
        </div>
      </footer>

    </div>
  );
}
