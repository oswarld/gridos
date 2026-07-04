// 시나리오 타당성 분석 (규칙 기반)
// 점수 엔진 결과와 원천 지표만으로 계산하며, 반사실(counterfactual) 비교는
// 동일 엔진을 조건만 바꿔 재실행해 산출한다. LLM은 관여하지 않는다.
import { computeScores } from "./scoring";
import type { DemandScenario, GridData, RegionScore, ScoreDimensionKey } from "../types";
import { DECISION_LABELS, DIMENSION_LABELS, SECTOR_LABELS } from "../types";

export type CounterfactualItem = {
  label: string;
  detail: string;
  deltaText: string;
  positive: boolean | null;
};

export type ScenarioAnalysis = {
  demandContext: string[];
  decisionSummary: string;
  topDrivers: string[] | null;
  counterfactuals: CounterfactualItem[];
  dataCaveats: string[];
};

const FLEX_FACTOR: Record<DemandScenario["flexibility"], number> = {
  low: 1.0,
  medium: 0.85,
  high: 0.7,
};

const FLEX_KO: Record<DemandScenario["flexibility"], string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
};

function top1(scores: RegionScore[]): RegionScore | null {
  return scores.find((s) => s.totalScore !== null) ?? null;
}

/** 반사실 시나리오 재계산 후 1위 지역 총점 변화를 요약 */
function counterfactual(
  data: GridData,
  base: DemandScenario,
  baseScores: RegionScore[],
  label: string,
  detail: string,
  patch: Partial<DemandScenario>
): CounterfactualItem | null {
  const baseTop = top1(baseScores);
  if (!baseTop) return null;
  const altScores = computeScores(data, { ...base, ...patch });
  const altTop = top1(altScores);
  if (!altTop) return null;

  const sameRegionAlt = altScores.find((s) => s.regionCode === baseTop.regionCode);
  const delta = (sameRegionAlt?.totalScore ?? 0) - (baseTop.totalScore ?? 0);

  let deltaText: string;
  if (altTop.regionCode !== baseTop.regionCode) {
    deltaText = `1위가 ${baseTop.regionName} → ${altTop.regionName}로 바뀜 (${altTop.totalScore!.toFixed(1)}점)`;
  } else if (Math.abs(delta) < 0.05) {
    deltaText = `1위 ${baseTop.regionName} 총점 변화 없음`;
  } else {
    deltaText = `1위 ${baseTop.regionName} 총점 ${delta > 0 ? "+" : ""}${delta.toFixed(1)}점 (${(
      sameRegionAlt!.totalScore!
    ).toFixed(1)}점)`;
    const altDecision = sameRegionAlt!.decision;
    if (altDecision !== baseTop.decision) {
      deltaText += `, 판정 ${DECISION_LABELS[baseTop.decision]} → ${DECISION_LABELS[altDecision]}`;
    }
  }
  return { label, detail, deltaText, positive: Math.abs(delta) < 0.05 ? null : delta > 0 };
}

export function computeScenarioAnalysis(
  data: GridData,
  scenario: DemandScenario,
  scores: RegionScore[]
): ScenarioAnalysis {
  // ── 수요 규모 컨텍스트 ──
  const demandMwh = scenario.demandMw * 8760 * FLEX_FACTOR[scenario.flexibility];
  let nationalElec = 0;
  for (const r of data.regions) {
    const v = r.metrics.electricity_use_mwh?.value;
    if (v != null && Number.isFinite(v)) nationalElec += v;
  }
  const demandContext: string[] = [];
  demandContext.push(
    `${SECTOR_LABELS[scenario.sector]} ${scenario.demandMw}MW는 연간 약 ${(demandMwh / 1_000_000).toFixed(2)}TWh` +
      ` 수요입니다 (부하 유연성 '${FLEX_KO[scenario.flexibility]}' 보정 ${Math.round(FLEX_FACTOR[scenario.flexibility] * 100)}% 반영).`
  );
  if (nationalElec > 0) {
    const pct = (demandMwh / nationalElec) * 100;
    demandContext.push(
      `이는 전국 에너지다소비사업자 수전 전력(2024, ${(nationalElec / 1_000_000).toFixed(1)}TWh)의 ` +
        `${pct.toFixed(2)}% 규모입니다${pct > 3 ? " — 단일 사업으로는 매우 큰 수요로, 단계적 증설 검토가 필요합니다" : ""}.`
    );
  }
  const t1 = top1(scores);
  if (t1) {
    const burdenEv = t1.dimensions.existingLoadPressure.evidence;
    const m = burdenEv.match(/대비 ([\d.]+)%/);
    if (m) {
      demandContext.push(`1위 ${t1.regionName} 기준 기존 수전 전력 대비 부담률은 ${m[1]}%입니다.`);
    }
  }

  // ── 판정 분포 ──
  const dist = { approve: 0, conditional: 0, hold: 0, insufficient_data: 0 };
  for (const s of scores) dist[s.decision]++;
  const decisionSummary =
    `비교 대상 ${scores.length}개 시도 중 승인 권고 ${dist.approve}곳, 조건부 승인 ${dist.conditional}곳, ` +
    `보류 ${dist.hold}곳, 데이터 부족 ${dist.insufficient_data}곳입니다.`;

  // ── 1위 결정 요인 (가중 기여도) ──
  let topDrivers: string[] | null = null;
  if (t1 && t1.totalScore !== null) {
    const keys = Object.keys(t1.dimensions) as ScoreDimensionKey[];
    const present = keys.filter((k) => t1.dimensions[k].score !== null);
    const weightSum = present.reduce((s, k) => s + t1.dimensions[k].weight, 0);
    const contributions = present
      .map((k) => ({
        key: k,
        score: t1.dimensions[k].score as number,
        contrib: ((t1.dimensions[k].score as number) * t1.dimensions[k].weight) / weightSum,
      }))
      .sort((a, b) => b.contrib - a.contrib);
    const top2 = contributions.slice(0, 2);
    const weakest = [...contributions].sort((a, b) => a.score - b.score)[0];
    topDrivers = [
      `${t1.regionName} 1위(${t1.totalScore.toFixed(1)}점)의 상위 기여 축: ` +
        top2.map((c) => `${DIMENSION_LABELS[c.key]} ${c.score.toFixed(0)}점(기여 ${c.contrib.toFixed(1)})`).join(", "),
      `최약 축은 ${DIMENSION_LABELS[weakest.key]}(${weakest.score.toFixed(0)}점)로, 조건부 승인안의 핵심 보완 대상입니다.`,
    ];
  }

  // ── 반사실 비교 ──
  const cfs: (CounterfactualItem | null)[] = [];
  if (scenario.flexibility !== "high") {
    cfs.push(
      counterfactual(data, scenario, scores, "부하 유연성을 '높음'으로", "DR·ESS 연계로 피크 부담 30% 완화 가정", {
        flexibility: "high",
      })
    );
  }
  if (!scenario.renewablePpaIntent) {
    cfs.push(
      counterfactual(data, scenario, scores, "재생에너지 PPA 체결 시", "주민 부담 리스크 완화 반영", {
        renewablePpaIntent: true,
      })
    );
  }
  if (!scenario.residentBenefitModel) {
    cfs.push(
      counterfactual(data, scenario, scores, "주민 수익 공유 모델 포함 시", "햇빛소득마을형 지역 환원 반영", {
        residentBenefitModel: true,
      })
    );
  }
  if (scenario.demandMw >= 100) {
    cfs.push(
      counterfactual(data, scenario, scores, "1단계 절반 용량으로 착수 시", `단계적 증설: ${Math.round(scenario.demandMw / 2)}MW 우선 승인`, {
        demandMw: Math.round(scenario.demandMw / 2),
      })
    );
  }
  const counterfactuals = cfs.filter((c): c is CounterfactualItem => c !== null);

  // ── 데이터 한계 ──
  const gapCount = new Map<string, number>();
  for (const s of scores) {
    for (const g of s.missingData) gapCount.set(g, (gapCount.get(g) ?? 0) + 1);
  }
  const dataCaveats: string[] = [...gapCount.entries()].map(
    ([axis, n]) => `${axis} 축은 ${n}개 시도에서 데이터 부족으로 총점에서 제외(가중치 재정규화)되었습니다.`
  );
  dataCaveats.push(
    "송전망 여유용량·계통 접속 대기 정보는 공공데이터로 제공되지 않아 반영되지 않았습니다. 본 결과는 사전 검토용이며 실계통 검토를 대체하지 않습니다."
  );

  return { demandContext, decisionSummary, topDrivers, counterfactuals, dataCaveats };
}
