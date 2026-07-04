"use client";

import type { DemandScenario, Sector } from "@/lib/types";
import { SECTOR_LABELS } from "@/lib/types";

const FLEX_LABELS: Record<DemandScenario["flexibility"], string> = {
  low: "낮음 (24시간 정부하)",
  medium: "보통 (일부 시간대 조정 가능)",
  high: "높음 (DR·ESS 연계 가능)",
};

// 3대 메가프로젝트(반도체·피지컬 AI·AI 데이터센터, 산업통상부 2026-06 발표) 맥락의
// 예시 시나리오. MW 값은 정책 발표 총량(AI DC 1단계 8.4GW 등)을 단일 사이트 관점으로
// 가정한 사용자 입력 예시이며 공공데이터가 아니다.
const PRESETS: { label: string; note: string; scenario: DemandScenario }[] = [
  {
    label: "AI 데이터센터 캠퍼스 300MW",
    note: "AI DC 1단계 8.4GW 구축 계획의 단일 캠퍼스 가정",
    scenario: { sector: "data_center", demandMw: 300, flexibility: "medium", renewablePpaIntent: true, residentBenefitModel: false },
  },
  {
    label: "하이퍼스케일 AI DC 1GW",
    note: "총 18.4GW 장기 계획의 거점급 사이트 가정, 정부하",
    scenario: { sector: "data_center", demandMw: 1000, flexibility: "low", renewablePpaIntent: false, residentBenefitModel: false },
  },
  {
    label: "첨단 반도체 팹 클러스터 600MW",
    note: "서남권 800조 반도체 팹 투자 맥락의 신규 팹 가정",
    scenario: { sector: "advanced_manufacturing", demandMw: 600, flexibility: "low", renewablePpaIntent: true, residentBenefitModel: true },
  },
  {
    label: "철강 전기로 전환 400MW",
    note: "탄소중립 전기로 전환 수요 가정",
    scenario: { sector: "steel", demandMw: 400, flexibility: "medium", renewablePpaIntent: false, residentBenefitModel: false },
  },
];

export default function ScenarioInput({
  scenario,
  onChange,
}: {
  scenario: DemandScenario;
  onChange: (s: DemandScenario) => void;
}) {
  const set = <K extends keyof DemandScenario>(key: K, value: DemandScenario[K]) =>
    onChange({ ...scenario, [key]: value });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold text-slate-900">③ 신규 전력수요 입력</h2>
        <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-800">
          사용자 입력 시나리오 — 공공데이터 아님
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        입력값을 바꾸면 아래 추천 순위와 조건부 승인안이 즉시 재계산됩니다.
      </p>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          3대 메가프로젝트 예시 시나리오 (정책 발표 맥락의 가정값)
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => onChange(p.scenario)}
              title={p.note}
              className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-500 hover:text-slate-900"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-slate-700">업종</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(Object.keys(SECTOR_LABELS) as Sector[]).map((s) => (
              <button
                key={s}
                onClick={() => set("sector", s)}
                aria-pressed={scenario.sector === s}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  scenario.sector === s
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                }`}
              >
                {SECTOR_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="mw" className="text-sm font-semibold text-slate-700">
            신규 수요 (MW) — <span className="tabular-nums">{scenario.demandMw}MW</span>
          </label>
          <input
            id="mw"
            type="range"
            min={10}
            max={2000}
            step={10}
            value={scenario.demandMw}
            onChange={(e) => set("demandMw", Number(e.target.value))}
            className="mt-3 w-full accent-slate-900"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>10MW</span>
            <span>AI 데이터센터 1단계급 2,000MW</span>
          </div>
          <input
            type="number"
            min={0}
            value={scenario.demandMw}
            onChange={(e) => set("demandMw", Math.max(0, Number(e.target.value)))}
            className="mt-2 w-32 rounded-lg border border-slate-300 px-3 py-1.5 text-sm tabular-nums"
            aria-label="신규 수요 MW 직접 입력"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700">부하 유연성</label>
          <div className="mt-2 flex flex-col gap-2">
            {(Object.keys(FLEX_LABELS) as DemandScenario["flexibility"][]).map((f) => (
              <label key={f} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="flexibility"
                  checked={scenario.flexibility === f}
                  onChange={() => set("flexibility", f)}
                  className="accent-slate-900"
                />
                <span className="text-slate-700">{FLEX_LABELS[f]}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={scenario.renewablePpaIntent}
              onChange={(e) => set("renewablePpaIntent", e.target.checked)}
              className="mt-0.5 accent-slate-900"
            />
            <span>
              <span className="font-semibold text-slate-700">재생에너지 PPA 체결 의향</span>
              <br />
              <span className="text-xs text-slate-500">지역 태양광·풍력 발전과 직접 전력구매계약</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={scenario.residentBenefitModel}
              onChange={(e) => set("residentBenefitModel", e.target.checked)}
              className="mt-0.5 accent-slate-900"
            />
            <span>
              <span className="font-semibold text-slate-700">주민 수익 공유 모델 포함</span>
              <br />
              <span className="text-xs text-slate-500">햇빛소득마을형 지역 환원 계획 반영</span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
