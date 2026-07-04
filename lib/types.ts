// GridOS 공유 타입 정의
// docs/Technical_Architecture.md 6.2 정규화 타입 기준

export type SourceAccessMethod =
  | "data_go_kr_file"
  | "data_go_kr_openapi"
  | "institution_openapi"
  | "manual_web_download";

export type SourceMeta = {
  id: string;
  provider: string;
  title: string;
  url: string;
  collectedAt: string;
  baseDate: string | null;
  rowCount: number;
  updateCycle?: string;
  accessMethod: SourceAccessMethod;
  licenseNote?: string;
};

export type MetricQuality = "ok" | "missing" | "partial";

export type RegionMetricValue = {
  value: number | null;
  unit: string;
  sourceId: string;
  baseDate: string | null;
  quality: MetricQuality;
  evidence?: string;
};

// metric_key 목록 (Supabase region_metrics.metric_key 와 동일)
export const METRIC_KEYS = [
  "industrial_complex_count",
  "industrial_tenants",
  "industrial_operating",
  "natl_complex_production",
  "natl_complex_export",
  "natl_complex_employment",
  "natl_complex_utilization",
  "electricity_use_mwh",
  "energy_use_toe",
  "gas_supply_annual",
  "petroleum_consumption",
  "renewable_generation_mwh",
  "renewable_capacity_kw",
  "solar_generation_mwh",
  "wind_generation_mwh",
  "solar_capacity_factor",
  "wind_capacity_factor",
  "citygas_customers",
  "citygas_pipeline_m",
] as const;

export type MetricKey = (typeof METRIC_KEYS)[number];

export type RegionProfile = {
  regionCode: string;
  regionName: string;
  metrics: Partial<Record<MetricKey, RegionMetricValue>>;
};

export type NationalContext = {
  gasPeakSupplyLatest: {
    value: number | null;
    unit: string;
    date: string | null;
    sourceId: string;
  } | null;
};

export type GridData = {
  generatedAt: string;
  dataOrigin: "supabase" | "bundled_snapshot";
  sources: SourceMeta[];
  regions: RegionProfile[];
  national: NationalContext;
};

// ─── 사용자 입력 시나리오 (공공데이터가 아님을 항상 분리 표기) ───

export type Sector =
  | "data_center"
  | "steel"
  | "advanced_manufacturing"
  | "general_manufacturing";

export type DemandScenario = {
  sector: Sector;
  demandMw: number;
  flexibility: "low" | "medium" | "high";
  renewablePpaIntent: boolean;
  residentBenefitModel: boolean;
};

export const SECTOR_LABELS: Record<Sector, string> = {
  data_center: "데이터센터",
  steel: "철강",
  advanced_manufacturing: "첨단제조(반도체·배터리)",
  general_manufacturing: "일반 제조",
};

// ─── 점수 엔진 출력 ───

export type ScoreDimensionKey =
  | "industrialImportance"
  | "existingLoadPressure"
  | "fuelSupplyStability"
  | "renewableAcceptability"
  | "residentBurdenRisk"
  | "safetyRisk";

export const DIMENSION_LABELS: Record<ScoreDimensionKey, string> = {
  industrialImportance: "산업 중요도",
  existingLoadPressure: "기존 부하 압박",
  fuelSupplyStability: "가스/석유 공급 안정성",
  renewableAcceptability: "재생에너지 수용성",
  residentBurdenRisk: "주민 부담 리스크",
  safetyRisk: "안전 리스크",
};

export type ScoreDimension = {
  score: number | null;
  weight: number;
  direction: "higher_is_better" | "lower_is_better";
  evidence: string;
  sourceIds: string[];
};

export type Decision = "approve" | "conditional" | "hold" | "insufficient_data";

export const DECISION_LABELS: Record<Decision, string> = {
  approve: "승인 권고",
  conditional: "조건부 승인",
  hold: "보류",
  insufficient_data: "데이터 부족",
};

export type RegionScore = {
  regionCode: string;
  regionName: string;
  totalScore: number | null;
  rank: number | null;
  decision: Decision;
  dimensions: Record<ScoreDimensionKey, ScoreDimension>;
  conditions: string[];
  missingData: string[];
};

export type PolicyBriefRequest = {
  scenario: DemandScenario;
  topRegions: RegionScore[];
  sourceIds: string[];
};

export type PolicyBriefResponse = {
  generator: "rule_based" | "llm";
  content: string;
};
