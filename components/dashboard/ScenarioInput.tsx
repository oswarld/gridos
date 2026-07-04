"use client";

import type { DemandScenario, Sector } from "@/lib/types";
import { SECTOR_LABELS } from "@/lib/types";
import type { QuotaState } from "./GridDashboard";

const FLEX_LABELS: Record<DemandScenario["flexibility"], string> = {
  low: "낮음 · 24시간 정부하",
  medium: "보통 · 일부 시간대 조정 가능",
  high: "높음 · DR와 ESS 연계 가능",
};

// 3대 메가프로젝트(반도체, 피지컬 AI, AI 데이터센터) 정책 발표 맥락의 예시 조건.
// MW 값은 발표 총량을 단일 사이트 관점으로 가정한 값이며 공공데이터가 아니다.
const PRESETS: { label: string; note: string; scenario: DemandScenario }[] = [
  {
    label: "AI 데이터센터 캠퍼스 300MW",
    note: "AI 데이터센터 1단계 8.4GW 계획의 단일 캠퍼스 가정",
    scenario: { sector: "data_center", demandMw: 300, flexibility: "medium", renewablePpaIntent: true, residentBenefitModel: false },
  },
  {
    label: "하이퍼스케일 AI DC 1GW",
    note: "총 18.4GW 장기 계획의 거점급 사이트 가정",
    scenario: { sector: "data_center", demandMw: 1000, flexibility: "low", renewablePpaIntent: false, residentBenefitModel: false },
  },
  {
    label: "첨단 반도체 팹 클러스터 600MW",
    note: "서남권 800조 원 반도체 팹 투자 맥락의 신규 팹 가정",
    scenario: { sector: "advanced_manufacturing", demandMw: 600, flexibility: "low", renewablePpaIntent: true, residentBenefitModel: true },
  },
  {
    label: "철강 전기로 전환 400MW",
    note: "탄소중립 전기로 전환 수요 가정",
    scenario: { sector: "steel", demandMw: 400, flexibility: "medium", renewablePpaIntent: false, residentBenefitModel: false },
  },
];

export default function ScenarioInput({
  draft,
  onChange,
  onRun,
  running,
  isDirty,
  quota,
  quotaLoaded,
}: {
  draft: DemandScenario;
  onChange: (s: DemandScenario) => void;
  onRun: () => void;
  running: boolean;
  isDirty: boolean;
  quota: QuotaState;
  quotaLoaded: boolean;
}) {
  const set = <K extends keyof DemandScenario>(key: K, value: DemandScenario[K]) =>
    onChange({ ...draft, [key]: value });

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-stone2">Step 3</p>
      <div className="mt-2 flex flex-wrap items-center gap-2.5">
        <h2 className="text-[28px] font-medium leading-[1.25] text-ink">신규 전력수요 시나리오</h2>
        <span className="rounded-full bg-surface-yellow px-2.5 py-1 text-[13px] font-semibold text-yellow-dark">
          직접 설정하는 가정값
        </span>
      </div>
      <p className="mt-1.5 max-w-xl text-[15px] leading-[1.5] text-slate2">
        아래 값은 공공데이터가 아니라 분석 조건입니다. 조건을 설정하고{" "}
        <span className="font-medium text-ink">시나리오 실행</span>을 누르면 추천 결과가
        갱신됩니다.
      </p>

      <div className="mt-6 rounded-[28px] border border-hairline-soft bg-surface-soft p-6 md:p-8">
        {/* 프리셋 */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-stone2">
          3대 메가프로젝트 예시 조건
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => onChange(p.scenario)}
              title={p.note}
              className="rounded-full border border-hairline bg-canvas px-3.5 py-1.5 text-[13px] font-medium text-steel transition hover:border-hairline-strong hover:text-ink"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-7 grid gap-8 md:grid-cols-2">
          <div>
            <label className="text-[14px] font-medium text-ink">업종</label>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {(Object.keys(SECTOR_LABELS) as Sector[]).map((s) => (
                <button
                  key={s}
                  onClick={() => set("sector", s)}
                  aria-pressed={draft.sector === s}
                  className={`rounded-full px-3 py-2.5 text-[13px] font-medium transition ${
                    draft.sector === s
                      ? "bg-ink text-white"
                      : "border border-hairline bg-canvas text-steel hover:border-hairline-strong hover:text-ink"
                  }`}
                >
                  {SECTOR_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="mw" className="flex items-baseline justify-between text-[14px] font-medium text-ink">
              신규 수요
              <span className="text-[22px] font-medium tracking-[-0.5px] tabular-nums">
                {draft.demandMw.toLocaleString()}
                <span className="ml-0.5 text-[14px] text-steel">MW</span>
              </span>
            </label>
            <input
              id="mw"
              type="range"
              min={10}
              max={2000}
              step={10}
              value={draft.demandMw}
              onChange={(e) => set("demandMw", Number(e.target.value))}
              className="mt-3 w-full accent-ink"
            />
            <div className="mt-1 flex justify-between text-[12px] text-stone2">
              <span>10MW</span>
              <span>2,000MW</span>
            </div>
            <input
              type="number"
              min={0}
              value={draft.demandMw}
              onChange={(e) => set("demandMw", Math.max(0, Number(e.target.value)))}
              className="mt-3 h-11 w-36 rounded-lg border border-hairline-strong bg-canvas px-4 text-[15px] tabular-nums text-ink outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
              aria-label="신규 수요 MW 직접 입력"
            />
          </div>

          <div>
            <label className="text-[14px] font-medium text-ink">부하 유연성</label>
            <div className="mt-2.5 flex flex-col gap-2">
              {(Object.keys(FLEX_LABELS) as DemandScenario["flexibility"][]).map((f) => (
                <label
                  key={f}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-2.5 text-[14px] transition ${
                    draft.flexibility === f
                      ? "border-ink bg-canvas text-ink"
                      : "border-hairline bg-canvas text-steel hover:border-hairline-strong"
                  }`}
                >
                  <input
                    type="radio"
                    name="flexibility"
                    checked={draft.flexibility === f}
                    onChange={() => set("flexibility", f)}
                    className="accent-ink"
                  />
                  {FLEX_LABELS[f]}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="text-[14px] font-medium text-ink">추가 조건</label>
            <label
              className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-4 py-3 transition ${
                draft.renewablePpaIntent ? "border-ink bg-canvas" : "border-hairline bg-canvas hover:border-hairline-strong"
              }`}
            >
              <input
                type="checkbox"
                checked={draft.renewablePpaIntent}
                onChange={(e) => set("renewablePpaIntent", e.target.checked)}
                className="mt-1 accent-ink"
              />
              <span>
                <span className="text-[14px] font-medium text-ink">재생에너지 PPA 체결 의향</span>
                <span className="mt-0.5 block text-[12px] text-steel">
                  지역 태양광, 풍력 발전과의 직접 전력구매계약
                </span>
              </span>
            </label>
            <label
              className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-4 py-3 transition ${
                draft.residentBenefitModel ? "border-ink bg-canvas" : "border-hairline bg-canvas hover:border-hairline-strong"
              }`}
            >
              <input
                type="checkbox"
                checked={draft.residentBenefitModel}
                onChange={(e) => set("residentBenefitModel", e.target.checked)}
                className="mt-1 accent-ink"
              />
              <span>
                <span className="text-[14px] font-medium text-ink">주민 수익 공유 모델 포함</span>
                <span className="mt-0.5 block text-[12px] text-steel">
                  햇빛소득마을형 지역 환원 계획 반영
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* 실행 */}
        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-hairline-soft pt-6">
          <button
            onClick={onRun}
            disabled={running}
            className="rounded-full bg-ink px-8 py-3 text-[14px] font-medium text-white transition hover:bg-charcoal disabled:bg-hairline disabled:text-muted2"
          >
            {running ? "계산 중..." : "시나리오 실행"}
          </button>
          {isDirty && (
            <span className="rounded-full bg-surface-yellow px-3 py-1 text-[13px] font-semibold text-yellow-dark">
              변경된 조건이 있어요. 실행하면 결과에 반영됩니다
            </span>
          )}
          {quotaLoaded && !quota.signedIn && quota.remaining !== null && (
            <span className="text-[13px] text-steel">
              {quota.remaining > 0
                ? `무료 실행 ${quota.remaining}회 남음 · 로그인하면 제한 없이 사용할 수 있어요`
                : "오늘의 무료 실행을 모두 사용했어요. 로그인하면 계속할 수 있습니다"}
            </span>
          )}
          {quota.signedIn && <span className="text-[13px] text-steel">로그인됨 · 실행 제한 없음</span>}
        </div>
      </div>
    </div>
  );
}
