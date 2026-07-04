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
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-2.5">
        <h3 className="text-[22px] font-medium text-ink">시나리오 타당성 분석</h3>
        <span className="rounded-full bg-surface px-2.5 py-1 text-[12px] font-semibold text-steel">
          규칙 기반 · 실행할 때마다 갱신
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[28px] bg-rose-light p-6">
          <p className="text-[14px] font-semibold text-ink">수요 규모 평가</p>
          <ul className="mt-3 space-y-2 text-[14px] leading-[1.6] text-charcoal">
            {analysis.demandContext.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
            <li className="font-medium">{analysis.decisionSummary}</li>
          </ul>
        </div>

        <div className="rounded-[28px] bg-teal-light p-6">
          <p className="text-[14px] font-semibold text-ink">추천 근거 · 기여도 분해</p>
          {analysis.topDrivers ? (
            <ul className="mt-3 space-y-2 text-[14px] leading-[1.6] text-charcoal">
              {analysis.topDrivers.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[14px] text-charcoal">유효한 총점을 가진 지역이 없습니다.</p>
          )}
        </div>
      </div>

      {analysis.counterfactuals.length > 0 && (
        <div className="mt-4">
          <p className="text-[14px] font-medium text-ink">
            조건을 바꾸면 어떻게 될까요?{" "}
            <span className="font-normal text-stone2">같은 엔진으로 조건만 바꿔 재계산한 비교입니다</span>
          </p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {analysis.counterfactuals.map((c) => (
              <div key={c.label} className="flex items-start gap-3 rounded-2xl border border-hairline-soft bg-canvas p-4">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
                    c.positive === null
                      ? "bg-surface text-steel"
                      : c.positive
                        ? "bg-teal-light text-moss"
                        : "bg-coral-light text-coral-dark"
                  }`}
                  aria-hidden
                >
                  {c.positive === null ? "=" : c.positive ? "↑" : "↓"}
                </span>
                <div>
                  <p className="text-[14px] font-medium text-ink">{c.label}</p>
                  <p className="mt-0.5 text-[12px] text-steel">{c.detail}</p>
                  <p className="mt-1.5 text-[14px] leading-[1.5] text-charcoal">{c.deltaText}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-surface p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-steel">분석의 한계</p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] leading-[1.6] text-slate2">
          {analysis.dataCaveats.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
