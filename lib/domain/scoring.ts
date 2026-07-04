// GridOS 입지 적합도 점수 엔진
// docs/Technical_Architecture.md 9장 기준:
//  - 지역 간 min-max 정규화 (0-100)
//  - 값이 없는 지표는 대체하지 않고 missingData에 기록
//  - 총점은 값이 있는 축의 가중 평균
//  - 누락 축 2개 이상이면 insufficient_data / conditional 로 제한
import type {
  DemandScenario,
  GridData,
  MetricKey,
  RegionProfile,
  RegionScore,
  ScoreDimension,
  ScoreDimensionKey,
  Sector,
} from "../types";
import { DIMENSION_LABELS } from "../types";

// 기본 가중치 (합 1.0)
const BASE_WEIGHTS: Record<ScoreDimensionKey, number> = {
  industrialImportance: 0.22,
  existingLoadPressure: 0.22,
  fuelSupplyStability: 0.18,
  renewableAcceptability: 0.18,
  residentBurdenRisk: 0.12,
  safetyRisk: 0.08,
};

// 업종별 가중치 조정 (docs 9.3, 합 1.0 유지)
const SECTOR_WEIGHTS: Record<Sector, Record<ScoreDimensionKey, number>> = {
  data_center: {
    industrialImportance: 0.16,
    existingLoadPressure: 0.28,
    fuelSupplyStability: 0.12,
    renewableAcceptability: 0.24,
    residentBurdenRisk: 0.12,
    safetyRisk: 0.08,
  },
  steel: {
    industrialImportance: 0.26,
    existingLoadPressure: 0.18,
    fuelSupplyStability: 0.26,
    renewableAcceptability: 0.1,
    residentBurdenRisk: 0.12,
    safetyRisk: 0.08,
  },
  advanced_manufacturing: {
    industrialImportance: 0.28,
    existingLoadPressure: 0.2,
    fuelSupplyStability: 0.14,
    renewableAcceptability: 0.18,
    residentBurdenRisk: 0.1,
    safetyRisk: 0.1,
  },
  general_manufacturing: BASE_WEIGHTS,
};

const FLEX_FACTOR: Record<DemandScenario["flexibility"], number> = {
  low: 1.0,
  medium: 0.85,
  high: 0.7,
};

function metricValue(r: RegionProfile, key: MetricKey): number | null {
  const m = r.metrics[key];
  return m && m.value !== null && Number.isFinite(m.value) ? m.value : null;
}

function metricSource(r: RegionProfile, key: MetricKey): string[] {
  const m = r.metrics[key];
  return m ? [m.sourceId] : [];
}

/** 지역 간 min-max 정규화 (0-100). 값이 null이면 null 유지 */
function normalizeAcross(values: (number | null)[]): (number | null)[] {
  const present = values.filter((v): v is number => v !== null);
  if (present.length === 0) return values;
  const min = Math.min(...present);
  const max = Math.max(...present);
  return values.map((v) => {
    if (v === null) return null;
    if (max === min) return 50;
    return ((v - min) / (max - min)) * 100;
  });
}

/** 여러 정규화 배열의 지역별 평균 (있는 값만) */
function averagePresent(arrays: (number | null)[][], idx: number): number | null {
  const vals = arrays.map((a) => a[idx]).filter((v): v is number => v !== null);
  if (vals.length === 0) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

export function computeScores(data: GridData, scenario: DemandScenario): RegionScore[] {
  const regions = data.regions;
  const weights = SECTOR_WEIGHTS[scenario.sector];

  // ── 축별 원시 지표 준비 ──
  // 1. 산업 중요도 (higher better): 입주업체 + 국가산단 생산 + 국가산단 수출
  const nTenants = normalizeAcross(regions.map((r) => metricValue(r, "industrial_tenants")));
  const nProd = normalizeAcross(regions.map((r) => metricValue(r, "natl_complex_production")));
  const nExport = normalizeAcross(regions.map((r) => metricValue(r, "natl_complex_export")));

  // 2. 기존 부하 압박: 신규 수요(유연성 반영)가 기존 수전 전력 대비 차지하는 부담률.
  //    min-max 정규화는 MW 배율에 불변이므로, 부담률 0%→100점, 50% 이상→0점의
  //    절대 스케일을 사용해 수요 규모가 점수에 직접 반영되게 한다.
  const BURDEN_CAP = 0.5;
  const demandMwh = scenario.demandMw * 8760 * FLEX_FACTOR[scenario.flexibility];
  const burdens = regions.map((r) => {
    const elec = metricValue(r, "electricity_use_mwh");
    if (elec === null || elec <= 0) return null;
    return demandMwh / elec;
  });
  const burdenScores = burdens.map((b) =>
    b === null ? null : 100 * Math.max(0, 1 - b / BURDEN_CAP)
  );

  // 3. 가스/석유 공급 안정성 (higher better)
  const nGas = normalizeAcross(regions.map((r) => metricValue(r, "gas_supply_annual")));
  const nPetro = normalizeAcross(regions.map((r) => metricValue(r, "petroleum_consumption")));

  // 4. 재생에너지 수용성 (higher better)
  const nRenGen = normalizeAcross(regions.map((r) => metricValue(r, "renewable_generation_mwh")));
  const nRenCap = normalizeAcross(regions.map((r) => metricValue(r, "renewable_capacity_kw")));
  const nSolar = normalizeAcross(regions.map((r) => metricValue(r, "solar_generation_mwh")));
  const nSolarCf = normalizeAcross(regions.map((r) => metricValue(r, "solar_capacity_factor")));
  const nWindCf = normalizeAcross(regions.map((r) => metricValue(r, "wind_capacity_factor")));

  // 5. 주민 부담 리스크 (lower risk better): 에너지 사용 밀집도 + 신규 수요 부담률
  const nToe = normalizeAcross(regions.map((r) => metricValue(r, "energy_use_toe")));

  // 6. 안전 리스크 (lower exposure better): 도시가스 배관 규모를 노출 프록시로 사용
  const nPipe = normalizeAcross(regions.map((r) => metricValue(r, "citygas_pipeline_m")));

  return regions
    .map((r, i): RegionScore => {
      const dims = {} as Record<ScoreDimensionKey, ScoreDimension>;
      const missing: string[] = [];

      // 산업 중요도
      const industrial = averagePresent([nTenants, nProd, nExport], i);
      dims.industrialImportance = {
        score: industrial,
        weight: weights.industrialImportance,
        direction: "higher_is_better",
        evidence:
          industrial === null
            ? "산업단지 입주업체/국가산단 생산·수출 데이터 부족"
            : "산업단지 입주업체 수 + 국가산단 분기 생산·수출 실적의 정규화 평균",
        sourceIds: [...metricSource(r, "industrial_tenants"), ...metricSource(r, "natl_complex_production")],
      };

      // 기존 부하 압박: 부담률 낮을수록 고득점
      const burdenScore = burdenScores[i];
      dims.existingLoadPressure = {
        score: burdenScore,
        weight: weights.existingLoadPressure,
        direction: "lower_is_better",
        evidence:
          burdenScore === null
            ? "지역 수전 전력 데이터 부족"
            : `신규 ${scenario.demandMw}MW(유연성 ${scenario.flexibility} 보정 ${Math.round(
                FLEX_FACTOR[scenario.flexibility] * 100
              )}%) 연간 환산 수요가 에너지다소비사업자 수전 전력(2024) 대비 ${(
                (burdens[i] ?? 0) * 100
              ).toFixed(1)}% 수준입니다. 부담률 0%는 100점, ${BURDEN_CAP * 100}% 이상은 0점인 절대 스케일로 환산`,
        sourceIds: metricSource(r, "electricity_use_mwh"),
      };

      // 가스/석유 공급 안정성
      const fuel = averagePresent([nGas, nPetro], i);
      dims.fuelSupplyStability = {
        score: fuel,
        weight: weights.fuelSupplyStability,
        direction: "higher_is_better",
        evidence:
          fuel === null
            ? "가스공사 지역본부/석유 소비 데이터 부족"
            : "천연가스 최근 12개월 공급량 + 석유제품 연간 소비의 정규화 평균 (인프라 여력 프록시)",
        sourceIds: [...metricSource(r, "gas_supply_annual"), ...metricSource(r, "petroleum_consumption")],
      };

      // 재생에너지 수용성
      const renew = averagePresent([nRenGen, nRenCap, nSolar, nSolarCf, nWindCf], i);
      dims.renewableAcceptability = {
        score: renew,
        weight: weights.renewableAcceptability,
        direction: "higher_is_better",
        evidence:
          renew === null
            ? "신재생 보급/발전량 데이터 부족"
            : "신재생 보급용량·발전량 + KPX 태양광 거래량 + 태양광/풍력 이용률의 정규화 평균",
        sourceIds: [
          ...metricSource(r, "renewable_generation_mwh"),
          ...metricSource(r, "solar_generation_mwh"),
          ...metricSource(r, "solar_capacity_factor"),
        ],
      };

      // 주민 부담 리스크: 에너지 밀집도(정규화) + 신규 수요 부담(절대 스케일 역산)
      const toeNorm = nToe[i];
      const burdenRisk = burdenScore === null ? null : 100 - burdenScore;
      let residentRisk: number | null = null;
      {
        const parts = [toeNorm, burdenRisk].filter((v): v is number => v !== null);
        if (parts.length > 0) residentRisk = parts.reduce((s, v) => s + v, 0) / parts.length;
      }
      let residentScore = residentRisk === null ? null : 100 - residentRisk;
      const residentBonuses: string[] = [];
      if (residentScore !== null && scenario.residentBenefitModel) {
        residentScore = Math.min(100, residentScore + 15);
        residentBonuses.push("주민 수익 공유 모델 +15");
      }
      if (residentScore !== null && scenario.renewablePpaIntent) {
        residentScore = Math.min(100, residentScore + 5);
        residentBonuses.push("재생에너지 PPA 의향 +5");
      }
      dims.residentBurdenRisk = {
        score: residentScore,
        weight: weights.residentBurdenRisk,
        direction: "lower_is_better",
        evidence:
          residentScore === null
            ? "에너지 사용 밀집도 데이터 부족"
            : `기존 에너지 사용 밀집도(toe)와 신규 수요 부담률 기반 리스크의 역산${
                residentBonuses.length ? ` (시나리오 보정: ${residentBonuses.join(", ")})` : ""
              }`,
        sourceIds: metricSource(r, "energy_use_toe"),
      };

      // 안전 리스크
      const pipeNorm = nPipe[i];
      dims.safetyRisk = {
        score: pipeNorm === null ? null : 100 - pipeNorm,
        weight: weights.safetyRisk,
        direction: "lower_is_better",
        evidence:
          pipeNorm === null
            ? "도시가스 공급 정보 데이터 부족"
            : "도시가스 배관 총연장을 가스 공급망 노출 프록시로 사용 (배관 규모가 클수록 관리 대상 리스크 증가)",
        sourceIds: metricSource(r, "citygas_pipeline_m"),
      };

      // ── 총점: 값이 있는 축의 가중 평균 (가중치 재정규화) ──
      const keys = Object.keys(dims) as ScoreDimensionKey[];
      for (const k of keys) {
        if (dims[k].score === null) missing.push(DIMENSION_LABELS[k]);
      }
      const presentKeys = keys.filter((k) => dims[k].score !== null);
      let total: number | null = null;
      if (presentKeys.length > 0) {
        const weightSum = presentKeys.reduce((s, k) => s + dims[k].weight, 0);
        total =
          presentKeys.reduce((s, k) => s + (dims[k].score as number) * dims[k].weight, 0) / weightSum;
      }

      // ── 판정 ──
      let decision: RegionScore["decision"];
      if (total === null || missing.length >= 3) {
        decision = "insufficient_data";
      } else if (total >= 70) {
        decision = missing.length >= 1 ? "conditional" : "approve";
      } else if (total >= 50) {
        decision = "conditional";
      } else {
        decision = "hold";
      }

      // ── 조건부 승인 조건 ──
      const conditions: string[] = [];
      if (decision === "conditional" || decision === "approve") {
        if (!scenario.renewablePpaIntent && (dims.renewableAcceptability.score ?? 0) < 60) {
          conditions.push("지역 재생에너지 PPA 체결 또는 지역 내 재생에너지 신규 투자 약정");
        }
        if (scenario.flexibility === "low") {
          conditions.push("피크시간대 부하 저감(DR) 참여 또는 ESS 병설을 통한 피크 완화 약정");
        }
        if (!scenario.residentBenefitModel) {
          conditions.push("햇빛소득마을형 주민 수익 공유 모델 등 지역 환원 방안 마련");
        }
        if ((burdens[i] ?? 0) > 0.2) {
          conditions.push("계통 여건을 고려한 단계적 증설 (1단계 부분 용량 → 검증 후 확대)");
        }
        if ((dims.safetyRisk.score ?? 100) < 40) {
          conditions.push("가스 공급망 연계 구간 안전 점검 및 비상 대응 계획 수립");
        }
        if (missing.length >= 1) {
          conditions.push(`데이터 부족 축(${missing.join(", ")})에 대한 실측 자료 보완 후 재평가`);
        }
      }

      return {
        regionCode: r.regionCode,
        regionName: r.regionName,
        totalScore: total,
        rank: null,
        decision,
        dimensions: dims,
        conditions,
        missingData: missing,
      };
    })
    .sort((a, b) => (b.totalScore ?? -1) - (a.totalScore ?? -1))
    .map((s, i) => ({ ...s, rank: s.totalScore === null ? null : i + 1 }));
}
