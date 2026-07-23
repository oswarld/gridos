"use client";

import { useState } from "react";
import type {
  DemandScenario,
  GridData,
  RegionScore,
  ScoreDimensionKey,
} from "@/lib/types";
import { DECISION_LABELS, DIMENSION_LABELS } from "@/lib/types";
import { humanizeTitle } from "@/lib/format";
import RegionMap from "./RegionMap";
import ScenarioAnalysis from "./ScenarioAnalysis";

const DECISION_CLS: Record<RegionScore["decision"], string> = {
  approve: "bg-teal-light text-moss",
  conditional: "bg-surface-yellow text-yellow-dark",
  hold: "bg-coral-light text-coral-dark",
  insufficient_data: "bg-surface text-steel",
};

const DIMENSION_ORDER: ScoreDimensionKey[] = [
  "industrialImportance",
  "existingLoadPressure",
  "fuelSupplyStability",
  "renewableAcceptability",
  "residentBurdenRisk",
  "safetyRisk",
];

function sourceLabel(data: GridData, id: string): string {
  const s = data.sources.find((x) => x.id === id);
  return s ? `${humanizeTitle(s.title)} (${s.baseDate ?? "기준일 미상"})` : id;
}

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) {
    return <div className="h-2 w-full rounded-full bg-hairline-soft" aria-label="데이터 부족" />;
  }
  const hue = score >= 70 ? "bg-success" : score >= 40 ? "bg-brand-yellow" : "bg-coral-light";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-hairline-soft">
      <div className={`h-full rounded-full ${hue}`} style={{ width: `${Math.max(2, score)}%` }} />
    </div>
  );
}

function RegionCard({
  s,
  data,
  expanded,
  onToggle,
}: {
  s: RegionScore;
  data: GridData;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`rounded-2xl border bg-canvas transition ${expanded ? "border-hairline-strong" : "border-hairline-soft"}`}>
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-5 py-3.5 text-left">
        <span className="w-7 text-center text-[17px] font-medium tabular-nums text-stone2">
          {s.rank ?? "·"}
        </span>
        <span className="w-14 text-[16px] font-medium text-ink">{s.regionName}</span>
        <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold ${DECISION_CLS[s.decision]}`}>
          {DECISION_LABELS[s.decision]}
        </span>
        <div className="mx-3 hidden flex-1 sm:block">
          <ScoreBar score={s.totalScore} />
        </div>
        <span className="ml-auto w-14 text-right text-[17px] font-medium tabular-nums text-ink">
          {s.totalScore === null ? "·" : s.totalScore.toFixed(1)}
        </span>
        <svg
          className={`h-4 w-4 text-stone2 transition-transform ${expanded ? "rotate-180" : ""}`}
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-hairline-soft px-5 py-5">
          <div className="grid gap-3 md:grid-cols-2">
            {DIMENSION_ORDER.map((k) => {
              const d = s.dimensions[k];
              return (
                <div key={k} className="rounded-xl bg-surface p-4">
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="font-medium text-ink">
                      {DIMENSION_LABELS[k]}
                      <span className="ml-1.5 text-[12px] font-normal text-stone2">
                        가중치 {(d.weight * 100).toFixed(0)}%
                      </span>
                    </span>
                    <span className="tabular-nums font-medium text-ink">
                      {d.score === null ? "데이터 부족" : d.score.toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <ScoreBar score={d.score} />
                  </div>
                  <p className="mt-2.5 text-[12px] leading-[1.5] text-slate2">{d.evidence}</p>
                  {d.sourceIds.length > 0 && (
                    <p className="mt-1.5 text-[11px] leading-[1.5] text-stone2">
                      출처: {[...new Set(d.sourceIds)].map((id) => sourceLabel(data, id)).join(" · ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {s.conditions.length > 0 && (
            <div className="mt-4 rounded-xl bg-surface-yellow p-4">
              <p className="text-[13px] font-semibold text-yellow-dark">조건부 승인안</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[14px] leading-[1.5] text-ink">
                {s.conditions.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          {s.missingData.length > 0 && (
            <p className="mt-3 text-[12px] text-stone2">
              데이터 부족 축: {s.missingData.join(", ")} · 총점에서 제외하고 가중치를 재정규화했습니다
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function RecommendationResults({
  data,
  scenario,
  scores,
}: {
  data: GridData;
  scenario: DemandScenario;
  scores: RegionScore[];
}) {
  const [expanded, setExpanded] = useState<string | null>(scores[0]?.regionCode ?? null);

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-stone2">Step 4</p>
      <div className="mt-2">
        <div>
          <h2 className="text-[28px] font-medium leading-[1.25] text-ink">배분과 입지 추천 결과</h2>
          <p className="mt-1.5 max-w-xl text-[15px] leading-[1.5] text-slate2">
            전국 기준으로 정규화한 공공데이터 지표와 시나리오 조건을 결합한 시뮬레이션
            결과입니다. 지역 카드를 열면 축별 근거와 출처, 기준일을 볼 수 있습니다.
          </p>
        </div>
      </div>

      {scores.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-surface p-8 text-center text-[14px] text-steel">
          선택된 지역이 없습니다. 지역 선택에서 비교할 시도를 골라 주세요.
        </p>
      ) : (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,400px)_1fr]">
            <div className="rounded-2xl border border-hairline-soft bg-canvas p-5">
              <p className="mb-3 text-[14px] font-medium text-ink">시도별 적합도 지도</p>
              <RegionMap
                scores={scores}
                selectedCode={expanded}
                onSelect={(code) => setExpanded(expanded === code ? null : code)}
              />
            </div>
            <div className="space-y-2">
              {scores.map((s) => (
                <RegionCard
                  key={s.regionCode}
                  s={s}
                  data={data}
                  expanded={expanded === s.regionCode}
                  onToggle={() => setExpanded(expanded === s.regionCode ? null : s.regionCode)}
                />
              ))}
            </div>
          </div>
          <ScenarioAnalysis data={data} scenario={scenario} scores={scores} />
        </>
      )}

    </div>
  );
}
