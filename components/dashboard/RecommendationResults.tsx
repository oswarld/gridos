"use client";

import { useState } from "react";
import type {
  DemandScenario,
  GridData,
  PolicyBriefResponse,
  RegionScore,
  ScoreDimensionKey,
} from "@/lib/types";
import { DECISION_LABELS, DIMENSION_LABELS } from "@/lib/types";
import RegionMap from "./RegionMap";
import ScenarioAnalysis from "./ScenarioAnalysis";

const DECISION_CLS: Record<RegionScore["decision"], string> = {
  approve: "bg-emerald-100 text-emerald-800",
  conditional: "bg-amber-100 text-amber-800",
  hold: "bg-rose-100 text-rose-800",
  insufficient_data: "bg-slate-200 text-slate-600",
};

const DIMENSION_ORDER: ScoreDimensionKey[] = [
  "industrialImportance",
  "existingLoadPressure",
  "fuelSupplyStability",
  "renewableAcceptability",
  "residentBurdenRisk",
  "safetyRisk",
];

function sourceTitle(data: GridData, id: string): string {
  return data.sources.find((s) => s.id === id)?.title ?? id;
}

function baseDateOf(data: GridData, id: string): string {
  return data.sources.find((s) => s.id === id)?.baseDate ?? "기준일 미상";
}

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <div className="flex h-2.5 w-full items-center rounded-full bg-slate-100">
        <span className="w-full text-center text-[10px] leading-none text-slate-400">데이터 부족</span>
      </div>
    );
  }
  const hue = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${hue}`} style={{ width: `${Math.max(2, score)}%` }} />
    </div>
  );
}

function RegionCard({ s, data, expanded, onToggle }: {
  s: RegionScore;
  data: GridData;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span className="w-8 text-center text-lg font-bold tabular-nums text-slate-400">
          {s.rank ?? "—"}
        </span>
        <span className="w-14 text-base font-bold text-slate-900">{s.regionName}</span>
        <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${DECISION_CLS[s.decision]}`}>
          {DECISION_LABELS[s.decision]}
        </span>
        <div className="mx-3 hidden flex-1 sm:block">
          <ScoreBar score={s.totalScore} />
        </div>
        <span className="ml-auto w-16 text-right text-lg font-bold tabular-nums text-slate-900">
          {s.totalScore === null ? "—" : s.totalScore.toFixed(1)}
        </span>
        <span className="text-slate-400">{expanded ? "▴" : "▾"}</span>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4">
          <div className="grid gap-3 md:grid-cols-2">
            {DIMENSION_ORDER.map((k) => {
              const d = s.dimensions[k];
              return (
                <div key={k} className="rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">
                      {DIMENSION_LABELS[k]}
                      <span className="ml-1 text-xs font-normal text-slate-400">
                        가중치 {(d.weight * 100).toFixed(0)}%
                      </span>
                    </span>
                    <span className="tabular-nums font-bold text-slate-900">
                      {d.score === null ? "데이터 부족" : d.score.toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <ScoreBar score={d.score} />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{d.evidence}</p>
                  {d.sourceIds.length > 0 && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      출처:{" "}
                      {[...new Set(d.sourceIds)]
                        .map((id) => `${sourceTitle(data, id)} (${baseDateOf(data, id)})`)
                        .join(" · ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {s.conditions.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-900">조건부 승인안</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-amber-900/90">
                {s.conditions.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          {s.missingData.length > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              데이터 부족 축(총점 계산에서 제외, 가중치 재정규화 방식): {s.missingData.join(", ")}
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
  const [brief, setBrief] = useState<PolicyBriefResponse | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  const generateBrief = async () => {
    setBriefLoading(true);
    setBriefError(null);
    try {
      const res = await fetch("/api/policy-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario,
          topRegions: scores.slice(0, 3),
          sourceIds: data.sources.map((s) => s.id),
        }),
      });
      if (!res.ok) throw new Error(`요청 실패 (${res.status})`);
      setBrief((await res.json()) as PolicyBriefResponse);
    } catch (e) {
      setBriefError(e instanceof Error ? e.message : "브리프 생성 실패");
    } finally {
      setBriefLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">④ 배분·입지 추천 결과</h2>
          <p className="mt-1 text-sm text-slate-500">
            공공데이터 지표(전국 정규화)와 사용자 입력 시나리오를 결합한{" "}
            <b>시뮬레이션 결과</b>입니다. 지역 카드를 열면 축별 근거와 출처·기준일을 확인할 수
            있습니다.
          </p>
        </div>
        <button
          onClick={generateBrief}
          disabled={briefLoading || scores.length === 0}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {briefLoading ? "정책 브리프 생성 중…" : "정책 브리프 생성"}
        </button>
      </div>

      {scores.length === 0 ? (
        <p className="mt-6 rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
          선택된 지역이 없습니다. ① 지역 선택에서 비교할 지역을 선택하세요.
        </p>
      ) : (
        <>
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,400px)_1fr]">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-2 text-sm font-semibold text-slate-700">시도별 적합도 지도</p>
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

      {briefError && (
        <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{briefError}</p>
      )}
      {brief && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">정책 브리프</h3>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
              {brief.generator === "llm" ? "LLM 문장 생성 (수치는 계산 결과)" : "규칙 기반 생성"}
            </span>
          </div>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
            {brief.content}
          </pre>
        </div>
      )}
    </div>
  );
}
