"use client";

import { useMemo } from "react";
import { computeScenarioAnalysis } from "@/lib/domain/analysis";
import type { DemandScenario, GridData, RegionScore } from "@/lib/types";

export default function ScenarioAnalysis({
  data,
  scenario,
  scores,
}: {
  data: GridData;
  scenario: DemandScenario;
  scores: RegionScore[];
}) {
  const analysis = useMemo(
    () => computeScenarioAnalysis(data, scenario, scores),
    [data, scenario, scores]
  );

  if (scores.length === 0) return null;

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <h3 className="text-base font-bold text-slate-900">시나리오 타당성 분석</h3>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
          규칙 기반 · 입력 변경 시 즉시 갱신
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">수요 규모 평가</p>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-600">
            {analysis.demandContext.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
            <li className="font-medium text-slate-700">{analysis.decisionSummary}</li>
          </ul>
        </div>

        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">추천 근거 (기여도 분해)</p>
          {analysis.topDrivers ? (
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-600">
              {analysis.topDrivers.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">유효한 총점을 가진 지역이 없습니다.</p>
          )}
        </div>
      </div>

      {analysis.counterfactuals.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-700">
            조건을 바꾸면? <span className="font-normal text-slate-400">(동일 엔진 재계산 비교)</span>
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {analysis.counterfactuals.map((c) => (
              <div key={c.label} className="flex items-start gap-2 rounded-lg border border-slate-200 p-3">
                <span
                  className={`mt-0.5 text-sm ${
                    c.positive === null ? "text-slate-400" : c.positive ? "text-emerald-600" : "text-rose-600"
                  }`}
                  aria-hidden
                >
                  {c.positive === null ? "＝" : c.positive ? "▲" : "▼"}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{c.label}</p>
                  <p className="text-xs text-slate-500">{c.detail}</p>
                  <p className="mt-1 text-sm text-slate-700">{c.deltaText}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">분석의 한계</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs leading-relaxed text-slate-500">
          {analysis.dataCaveats.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
