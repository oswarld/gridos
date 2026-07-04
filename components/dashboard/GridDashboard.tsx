"use client";

import { useMemo, useState } from "react";
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
  { id: "regions", label: "① 지역 선택" },
  { id: "data", label: "② 실제 데이터 현황" },
  { id: "scenario", label: "③ 신규 전력수요 입력" },
  { id: "results", label: "④ 배분·입지 추천 결과" },
];

export default function GridDashboard({ data }: { data: GridData }) {
  const [selected, setSelected] = useState<string[]>(data.regions.map((r) => r.regionCode));
  const [scenario, setScenario] = useState<DemandScenario>(DEFAULT_SCENARIO);

  // 점수는 전체 지역 기준으로 정규화 후, 선택 지역만 표시한다
  const allScores = useMemo(() => computeScores(data, scenario), [data, scenario]);
  const scores = useMemo(
    () => allScores.filter((s) => selected.includes(s.regionCode)),
    [allScores, selected]
  );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-900">GridOS</span>
            <span className="hidden text-sm text-slate-500 sm:inline">산업 전력 배분 의사결정 서비스</span>
          </div>
          <nav className="flex flex-wrap gap-1 text-sm">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className="rounded-full px-3 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <span
            className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${
              data.dataOrigin === "supabase"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
            title="공공데이터 적재 경로"
          >
            {data.dataOrigin === "supabase" ? "Supabase 실데이터" : "실데이터 스냅샷(번들)"}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-8">
        <section className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-6 text-white shadow-sm">
          <h1 className="text-2xl font-bold leading-snug">
            데이터센터·철강·첨단제조 신규 전력수요,
            <br className="hidden sm:block" /> 어느 지역에 어떤 조건으로 배분할 것인가
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
            정부는 3대 메가프로젝트로 서남권 800조 원 반도체 팹과 총 18.4GW 규모 AI
            데이터센터를 추진하고 있습니다. GridOS는 산업단지, 천연가스, 석유, 전력 사용,
            재생에너지 공공데이터 {data.sources.length}종을 결합해 이 신규 전력수요의 지역별 입지
            적합도 6개 축을 계산하고, 승인·조건부 승인·보류 판정과 조건부 승인안을 제시합니다.
            모든 수치는 원천명·기준일·행 수와 함께 표시되며, 신규 수요 입력값은 공공데이터가 아닌{" "}
            <b className="text-white">사용자 입력 시나리오</b>로 분리 표기합니다.
          </p>
          {data.national.gasPeakSupplyLatest?.value != null && (
            <p className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs text-slate-200">
              <span className="font-semibold text-white">전국 컨텍스트</span>
              시간당 최대 천연가스 공급량 {data.national.gasPeakSupplyLatest.value.toLocaleString()}{" "}
              {data.national.gasPeakSupplyLatest.unit} ({data.national.gasPeakSupplyLatest.date} 기준,
              한국가스공사)
            </p>
          )}
        </section>

        <section id="regions" className="scroll-mt-20">
          <RegionSelector data={data} selected={selected} onChange={setSelected} />
        </section>

        <section id="data" className="scroll-mt-20">
          <DataStatusPanel data={data} />
        </section>

        <section id="scenario" className="scroll-mt-20">
          <ScenarioInput scenario={scenario} onChange={setScenario} />
        </section>

        <section id="results" className="scroll-mt-20">
          <RecommendationResults data={data} scenario={scenario} scores={scores} />
        </section>

        <footer className="border-t border-slate-200 py-6 text-xs leading-relaxed text-slate-500">
          <p>
            GridOS는 정책 의사결정과 사전 검토를 위한 시뮬레이션 도구이며, 실시간 전력계통 운영을
            대체하지 않습니다. 원천에 없는 값은 추정하지 않고 &lsquo;데이터 부족&rsquo;으로 표시합니다.
          </p>
          <p className="mt-1">
            데이터 생성 시각: {new Date(data.generatedAt).toLocaleString("ko-KR")} · 제14회 산업통상부
            공공데이터 활용 아이디어 공모전 출품작
          </p>
        </footer>
      </main>
    </div>
  );
}
