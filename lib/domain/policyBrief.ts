// 규칙 기반 정책 브리프 생성기
// LLM은 숫자·순위·점수를 생성하지 않는다. 이 모듈이 만드는 문장은 전부
// 점수 엔진의 계산 결과와 원천 메타데이터에서만 나온다 (docs/PRD.md 비목표 3).
import type { DemandScenario, GridData, RegionScore } from "../types";
import { DECISION_LABELS, DIMENSION_LABELS, SECTOR_LABELS } from "../types";

export function buildRuleBasedBrief(
  scenario: DemandScenario,
  scores: RegionScore[],
  data: GridData
): string {
  const top = scores.filter((s) => s.totalScore !== null).slice(0, 3);
  const lines: string[] = [];

  lines.push(
    `[사용자 입력 시나리오] ${SECTOR_LABELS[scenario.sector]} 신규 전력수요 ${scenario.demandMw}MW, ` +
      `부하 유연성 ${scenario.flexibility === "low" ? "낮음" : scenario.flexibility === "medium" ? "보통" : "높음"}, ` +
      `재생에너지 PPA 의향 ${scenario.renewablePpaIntent ? "있음" : "없음"}, ` +
      `주민 수익 공유 모델 ${scenario.residentBenefitModel ? "포함" : "미포함"}.`
  );
  lines.push("");

  if (top.length === 0) {
    lines.push("유효한 점수를 계산할 수 있는 지역이 없습니다. 데이터 부족 항목을 확인하세요.");
    return lines.join("\n");
  }

  lines.push("■ 입지 적합도 시뮬레이션 결과 (상위 3개 지역)");
  for (const s of top) {
    const strong = Object.entries(s.dimensions)
      .filter(([, d]) => d.score !== null && d.score >= 70)
      .map(([k]) => DIMENSION_LABELS[k as keyof typeof DIMENSION_LABELS]);
    const weak = Object.entries(s.dimensions)
      .filter(([, d]) => d.score !== null && d.score < 40)
      .map(([k]) => DIMENSION_LABELS[k as keyof typeof DIMENSION_LABELS]);

    lines.push(
      `${s.rank}위 ${s.regionName} · 종합 ${s.totalScore!.toFixed(1)}점, 판정: ${DECISION_LABELS[s.decision]}`
    );
    if (strong.length) lines.push(`   강점: ${strong.join(", ")}`);
    if (weak.length) lines.push(`   약점: ${weak.join(", ")}`);
    if (s.missingData.length) lines.push(`   데이터 부족: ${s.missingData.join(", ")}`);
    if (s.conditions.length) {
      lines.push(`   조건부 승인안:`);
      for (const c of s.conditions) lines.push(`   - ${c}`);
    }
  }

  lines.push("");
  lines.push("■ 정책 시사점");
  const first = top[0];
  if (first.decision === "approve" && first.conditions.length === 0) {
    lines.push(`${first.regionName} 우선 검토를 권고합니다. 6개 축 모두 데이터 기반 판정이 가능했습니다.`);
  } else {
    lines.push(
      `${first.regionName} 우선 검토를 권고하되(판정: ${DECISION_LABELS[first.decision]}), ` +
        `제시된 조건 이행을 전제로 승인 절차를 진행하는 것이 적절합니다.`
    );
  }
  if (scenario.sector === "data_center") {
    lines.push(
      "데이터센터 수요는 기존 제조업 부하와의 충돌 가능성이 있으므로, 산업 중요도가 높은 지역에서는 피크 분산과 재생에너지 연계를 승인 조건으로 부과하는 것을 권고합니다."
    );
  }
  if (scenario.sector === "steel") {
    lines.push(
      "철강 수요는 가스/석유 공급 안정성 축의 비중이 높으므로, 연료 인프라 여력이 확인되지 않은 지역은 보류를 권고합니다."
    );
  }

  lines.push("");
  lines.push("■ 근거 데이터");
  const usedSourceIds = new Set<string>();
  for (const s of top) {
    for (const d of Object.values(s.dimensions)) d.sourceIds.forEach((id) => usedSourceIds.add(id));
  }
  for (const src of data.sources.filter((s) => usedSourceIds.has(s.id))) {
    lines.push(`- ${src.title} (${src.provider}, 기준일 ${src.baseDate ?? "미상"}, ${src.rowCount.toLocaleString()}행)`);
  }
  lines.push("");
  lines.push(
    "※ 본 브리프는 공공데이터 기반 사전 검토용 시뮬레이션이며, 실시간 전력계통 운영 판단을 대체하지 않습니다."
  );

  return lines.join("\n");
}
