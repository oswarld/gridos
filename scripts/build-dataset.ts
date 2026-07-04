/**
 * GridOS 데이터 파이프라인: 실제 공공데이터 원천(xlsx 스냅샷 + OpenAPI 응답)을
 * region_profile 단위로 정규화해 data/processed/gridos-data.json 과
 * Supabase 시드 SQL(data/processed/seed.sql)을 생성한다.
 *
 * 원칙 (docs/PRD.md P0):
 *  - 원천에 없는 값은 계산하지 않고 quality='missing' 으로 남긴다
 *  - 모든 지표에 sourceId / baseDate / evidence 를 붙인다
 *  - 원천 행 수가 0이면 즉시 실패한다
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as XLSX from "xlsx";
import {
  REGIONS,
  resolveRegionCode,
  NATIONAL_COMPLEX_TO_REGION,
  CITYGAS_COMPANY_TO_REGION,
  KOGAS_BRANCH_TO_REGIONS,
} from "../lib/domain/region";
import type {
  GridData,
  MetricKey,
  RegionMetricValue,
  RegionProfile,
  SourceMeta,
} from "../lib/types";

const ROOT = path.resolve(__dirname, "..");
const RESOURCES = path.join(ROOT, "resources");
const RAW_API = path.join(ROOT, "data", "raw", "api");
const OUT_DIR = path.join(ROOT, "data", "processed");

const now = new Date().toISOString();

function fail(msg: string): never {
  console.error(`[build-dataset] FAIL: ${msg}`);
  process.exit(1);
}

function readSheet(file: string, sheet: string): unknown[][] {
  const wb = XLSX.readFile(file);
  const ws = wb.Sheets[sheet];
  if (!ws) fail(`${path.basename(file)} 에 시트 '${sheet}' 없음`);
  return XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
}

function readApiJson(name: string): { data: Record<string, unknown>[]; totalCount: number } {
  const p = path.join(RAW_API, name);
  if (!fs.existsSync(p)) fail(`API 원천 파일 없음: ${p} (scripts/ingest-api.ts 먼저 실행)`);
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  return j;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "" || v === "해당없음") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

// ─────────────────────────────────────────────────────────────
// 원천 메타데이터
// ─────────────────────────────────────────────────────────────
const sources: SourceMeta[] = [];
function addSource(meta: Omit<SourceMeta, "collectedAt" | "rowCount">, rowCount: number): string {
  if (rowCount <= 0) fail(`원천 '${meta.title}' 행 수 0 — 빌드 차단`);
  sources.push({ ...meta, rowCount, collectedAt: now });
  return meta.id;
}

// 지역별 지표 누적
const metrics: Record<string, Partial<Record<MetricKey, RegionMetricValue>>> = {};
for (const r of REGIONS) metrics[r.code] = {};

function setMetric(regionCode: string, key: MetricKey, v: RegionMetricValue) {
  if (!metrics[regionCode]) return;
  metrics[regionCode][key] = v;
}

// ─────────────────────────────────────────────────────────────
// 1. 한국산업단지공단_전국산업단지현황통계 (시도별 소계)
// ─────────────────────────────────────────────────────────────
{
  const file = path.join(RESOURCES, "한국산업단지공단_전국산업단지현황통계_20250930.xlsx");
  const rows = readSheet(file, "시도별");
  let count = 0;
  for (const row of rows) {
    const label = typeof row?.[0] === "string" ? (row[0] as string).trim() : null;
    if (!label || !label.endsWith("소계")) continue;
    const code = resolveRegionCode(label.replace(/소계$/, ""));
    if (!code) continue;
    count++;
    const src = "kicox_status";
    const base = "2025-09-30";
    setMetric(code, "industrial_complex_count", {
      value: num(row[1]), unit: "개", sourceId: src, baseDate: base, quality: num(row[1]) === null ? "missing" : "ok",
      evidence: `${label} 산업단지 수`,
    });
    setMetric(code, "industrial_tenants", {
      value: num(row[9]), unit: "개사", sourceId: src, baseDate: base, quality: num(row[9]) === null ? "missing" : "ok",
      evidence: `${label} 입주업체 수`,
    });
    setMetric(code, "industrial_operating", {
      value: num(row[10]), unit: "개사", sourceId: src, baseDate: base, quality: num(row[10]) === null ? "missing" : "ok",
      evidence: `${label} 가동업체 수`,
    });
  }
  if (count === 0) fail("전국산업단지현황통계에서 시도별 소계 행을 찾지 못함");
  addSource({
    id: "kicox_status",
    provider: "산업통상부(한국산업단지공단)",
    title: "한국산업단지공단_전국산업단지현황통계",
    url: "https://www.data.go.kr/data/3041272/fileData.do",
    baseDate: "2025-09-30",
    updateCycle: "분기",
    accessMethod: "data_go_kr_file",
  }, count);
}

// ─────────────────────────────────────────────────────────────
// 2. 한국산업단지공단_국가산업단지 산업동향정보 (단지→시도 집계)
// ─────────────────────────────────────────────────────────────
{
  const file = path.join(RESOURCES, "한국산업단지공단_국가산업단지 산업동향정보_20260331.xlsx");
  const src = "kicox_trend";
  const base = "2026-03-31";

  type Acc = { production: number; exportUsd: number; employment: number; utilWeighted: number; utilWeight: number; complexes: string[] };
  const acc: Record<string, Acc> = {};
  const complexRegion = (name: unknown): string | null =>
    typeof name === "string" ? NATIONAL_COMPLEX_TO_REGION[name.trim()] ?? null : null;

  let rowCount = 0;

  const prod = readSheet(file, "표4 단지별 생산");
  for (const row of prod.slice(3)) {
    const code = complexRegion(row?.[0]);
    const v = num(row?.[2]);
    if (!code || v === null) continue;
    rowCount++;
    acc[code] ??= { production: 0, exportUsd: 0, employment: 0, utilWeighted: 0, utilWeight: 0, complexes: [] };
    acc[code].production += v;
    acc[code].complexes.push(String(row[0]));
  }

  const exp = readSheet(file, "표6 단지별 수출");
  for (const row of exp.slice(3)) {
    const code = complexRegion(row?.[0]);
    const v = num(row?.[2]);
    if (!code || v === null) continue;
    rowCount++;
    acc[code] ??= { production: 0, exportUsd: 0, employment: 0, utilWeighted: 0, utilWeight: 0, complexes: [] };
    acc[code].exportUsd += v;
  }

  const emp = readSheet(file, "표8 단지별 고용");
  for (const row of emp.slice(4)) {
    const code = complexRegion(row?.[0]);
    const v = num(row?.[2]);
    if (!code || v === null) continue;
    rowCount++;
    acc[code] ??= { production: 0, exportUsd: 0, employment: 0, utilWeighted: 0, utilWeight: 0, complexes: [] };
    acc[code].employment += v;
  }

  const util = readSheet(file, "표10 단지별 가동률");
  for (const row of util.slice(3)) {
    const code = complexRegion(row?.[0]);
    const rate = num(row?.[5]);
    const weight = num(row?.[4]) ?? 0; // 당분기 생산액 가중
    if (!code || rate === null) continue;
    rowCount++;
    acc[code] ??= { production: 0, exportUsd: 0, employment: 0, utilWeighted: 0, utilWeight: 0, complexes: [] };
    acc[code].utilWeighted += rate * weight;
    acc[code].utilWeight += weight;
  }

  if (rowCount === 0) fail("국가산업단지 산업동향정보에서 유효 행을 찾지 못함");

  for (const r of REGIONS) {
    const a = acc[r.code];
    const has = !!a;
    const ev = has
      ? `국가산단(${a.complexes.join(", ")}) 2026년 1분기 합계. 국가산단 미소재 시도는 데이터 부족.`
      : "해당 시도에 한국산업단지공단 관할 국가산업단지 동향 데이터 없음";
    setMetric(r.code, "natl_complex_production", {
      value: has ? a.production : null, unit: "억원/분기", sourceId: src, baseDate: base,
      quality: has ? "partial" : "missing", evidence: ev,
    });
    setMetric(r.code, "natl_complex_export", {
      value: has ? a.exportUsd : null, unit: "백만달러/분기", sourceId: src, baseDate: base,
      quality: has ? "partial" : "missing", evidence: ev,
    });
    setMetric(r.code, "natl_complex_employment", {
      value: has ? a.employment : null, unit: "명", sourceId: src, baseDate: base,
      quality: has ? "partial" : "missing", evidence: ev,
    });
    setMetric(r.code, "natl_complex_utilization", {
      value: has && a.utilWeight > 0 ? a.utilWeighted / a.utilWeight : null, unit: "%", sourceId: src, baseDate: base,
      quality: has && a.utilWeight > 0 ? "partial" : "missing",
      evidence: has ? `생산액 가중 평균 가동률 (${a.complexes.join(", ")})` : ev,
    });
  }

  addSource({
    id: "kicox_trend",
    provider: "산업통상부(한국산업단지공단)",
    title: "한국산업단지공단_국가산업단지 산업동향정보",
    url: "https://www.data.go.kr/data/3042071/fileData.do",
    baseDate: base,
    updateCycle: "분기",
    accessMethod: "data_go_kr_file",
  }, rowCount);
}

// ─────────────────────────────────────────────────────────────
// 3. 한국에너지공단_에너지다소비사업자 (수전 전력 MWh / 에너지 사용 toe)
// ─────────────────────────────────────────────────────────────
{
  const file = path.join(RESOURCES, "한국에너지공단_에너지다소비사업자 에너지 사용 현황(통합)_20241231.xlsx");
  const src = "kea_energy_users";
  const wb = XLSX.readFile(file);

  const parseRegionYearSheet = (sheetPrefix: string) => {
    const sheetName = wb.SheetNames.find((s) => s.startsWith(sheetPrefix));
    if (!sheetName) fail(`에너지다소비사업자 시트 '${sheetPrefix}*' 없음`);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName!], { header: 1 }) as unknown[][];
    const header = rows[0] as string[];
    // 헤더: [연도, 부문, 강원(MWh), 경기(MWh), ...] — 괄호 단위 제거 후 지역 매핑
    const regionCols: { idx: number; code: string }[] = [];
    header.forEach((h, i) => {
      if (i < 2 || typeof h !== "string") return;
      const code = resolveRegionCode(h.replace(/\(.*\)$/, ""));
      if (code) regionCols.push({ idx: i, code });
    });
    let latestYear = 0;
    for (const row of rows.slice(1)) {
      const y = num(row?.[0]);
      if (y && y > latestYear) latestYear = y;
    }
    const sums: Record<string, number> = {};
    let used = 0;
    for (const row of rows.slice(1)) {
      if (num(row?.[0]) !== latestYear) continue;
      used++;
      for (const { idx, code } of regionCols) {
        const v = num(row[idx]);
        if (v !== null) sums[code] = (sums[code] ?? 0) + v;
      }
    }
    return { sums, latestYear, rowsUsed: used, totalRows: rows.length - 1 };
  };

  const elec = parseRegionYearSheet("11_");
  const toe = parseRegionYearSheet("6_");

  for (const r of REGIONS) {
    const e = elec.sums[r.code];
    setMetric(r.code, "electricity_use_mwh", {
      value: e ?? null, unit: "MWh/년", sourceId: src, baseDate: `${elec.latestYear}-12-31`,
      quality: e === undefined ? "missing" : "ok",
      evidence: `에너지다소비사업자 수전 전력(${elec.latestYear}년, 산업·건물·수송 부문 합계)`,
    });
    const t = toe.sums[r.code];
    setMetric(r.code, "energy_use_toe", {
      value: t ?? null, unit: "toe/년", sourceId: src, baseDate: `${toe.latestYear}-12-31`,
      quality: t === undefined ? "missing" : "ok",
      evidence: `에너지다소비사업자 에너지 사용량(${toe.latestYear}년, 전 부문 합계)`,
    });
  }

  addSource({
    id: "kea_energy_users",
    provider: "한국에너지공단",
    title: "한국에너지공단_에너지다소비사업자 에너지 사용 현황(통합)",
    url: "https://www.data.go.kr/data/15127341/fileData.do",
    baseDate: "2024-12-31",
    updateCycle: "연간",
    accessMethod: "data_go_kr_file",
  }, elec.totalRows + toe.totalRows);
}

// ─────────────────────────────────────────────────────────────
// 4. 이용률(태양광/풍력) — 전력통계정보시스템(EPSIS) 웹 조회 수동 스냅샷
// ─────────────────────────────────────────────────────────────
{
  const parseUtilization = (fileName: string, fuel: "태양광" | "풍력", metricKey: MetricKey, srcId: string) => {
    const rows = readSheet(path.join(RESOURCES, fileName), "Sheet1");
    let latest = 0;
    for (const row of rows.slice(1)) {
      const y = num(row?.[0]);
      if (y && y > latest) latest = y;
    }
    let count = 0;
    for (const row of rows.slice(1)) {
      if (num(row?.[0]) !== latest || row?.[3] !== fuel) continue;
      const code = typeof row?.[1] === "string" ? resolveRegionCode(row[1] as string) : null;
      const v = num(row?.[2]);
      if (!code) continue;
      count++;
      setMetric(code, metricKey, {
        value: v, unit: "%", sourceId: srcId, baseDate: `${latest}-12-31`,
        quality: v === null ? "missing" : "ok",
        evidence: `${latest}년 ${fuel} 설비 이용률(EPSIS 웹 조회 스냅샷)`,
      });
    }
    if (count === 0) fail(`${fileName} 에서 ${fuel} 이용률 행을 찾지 못함`);
    addSource({
      id: srcId,
      provider: "한국전력거래소(EPSIS)",
      title: `전력통계정보시스템 이용률(${fuel})`,
      url: "https://epsis.kpx.or.kr/",
      baseDate: `${latest}-12-31`,
      updateCycle: "연간",
      accessMethod: "manual_web_download",
      licenseNote: "EPSIS 웹 조회 화면에서 수동 다운로드한 스냅샷",
    }, rows.length - 1);
  };
  parseUtilization("_HOME_이용률(태양광,풍력)_이용률(태양광).xlsx", "태양광", "solar_capacity_factor", "epsis_util_solar");
  parseUtilization("_HOME_이용률(태양광,풍력)_이용률(풍력).xlsx", "풍력", "wind_capacity_factor", "epsis_util_wind");
}

// ─────────────────────────────────────────────────────────────
// 5. 한국가스공사_월별 지역본부별 천연가스 공급량 (최근 12개월 합계)
// ─────────────────────────────────────────────────────────────
{
  const j = readApiJson("kogas_regional_supply.json");
  const src = "kogas_supply";
  const sorted = [...j.data].sort((a, b) => String(a["년도"]).localeCompare(String(b["년도"])));
  const last12 = sorted.slice(-12);
  if (last12.length === 0) fail("가스공사 공급량 데이터 없음");
  const from = String(last12[0]["년도"]);
  const to = String(last12[last12.length - 1]["년도"]);

  const branchSums: Record<string, number> = {};
  for (const row of last12) {
    for (const [k, v] of Object.entries(row)) {
      if (k === "년도") continue;
      const n = num(v);
      if (n !== null) branchSums[k] = (branchSums[k] ?? 0) + n;
    }
  }
  const regionVal: Record<string, { v: number; branch: string; shared: boolean }> = {};
  for (const [branch, v] of Object.entries(branchSums)) {
    const codes = KOGAS_BRANCH_TO_REGIONS[branch];
    if (!codes) continue;
    for (const code of codes) regionVal[code] = { v, branch, shared: codes.length > 1 };
  }
  for (const r of REGIONS) {
    const hit = regionVal[r.code];
    setMetric(r.code, "gas_supply_annual", {
      value: hit ? hit.v : null, unit: "천㎥ (최근 12개월 합)", sourceId: src, baseDate: to,
      quality: hit ? (hit.shared ? "partial" : "ok") : "missing",
      evidence: hit
        ? `가스공사 ${hit.branch}본부 ${from}~${to} 공급량 합계${hit.shared ? " (충청본부 값을 충북·충남에 동일 표시)" : ""}`
        : "한국가스공사 지역본부가 없는 시도로, 원천에 값이 없습니다",
    });
  }
  addSource({
    id: src,
    provider: "산업통상부(한국가스공사)",
    title: "한국가스공사_월별 지역본부별 천연가스 공급량",
    url: "https://www.data.go.kr/data/15049904/fileData.do",
    baseDate: to,
    updateCycle: "분기",
    accessMethod: "data_go_kr_openapi",
  }, j.totalCount);
}

// ─────────────────────────────────────────────────────────────
// 6. 한국가스공사_월별 시간당 최대 총 공급량 (전국 컨텍스트)
// ─────────────────────────────────────────────────────────────
let nationalGasPeak: GridData["national"]["gasPeakSupplyLatest"] = null;
{
  const j = readApiJson("kogas_peak_supply.json");
  const src = "kogas_peak";
  const sorted = [...j.data].sort((a, b) => String(a["연월일"]).localeCompare(String(b["연월일"])));
  const latest = sorted[sorted.length - 1];
  if (!latest) fail("가스공사 최대 공급량 데이터 없음");
  nationalGasPeak = {
    value: num(latest["최대 총 공급량"]),
    unit: "천㎥/시간 (전국)",
    date: String(latest["연월일"]),
    sourceId: src,
  };
  addSource({
    id: src,
    provider: "산업통상부(한국가스공사)",
    title: "한국가스공사_월별 시간당 최대 총 공급량 현황",
    url: "https://www.data.go.kr/data/15066501/fileData.do",
    baseDate: String(latest["연월일"]),
    updateCycle: "월간",
    accessMethod: "data_go_kr_openapi",
  }, j.totalCount);
}

// ─────────────────────────────────────────────────────────────
// 7. 한국석유공사_국내 석유제품 지역별 소비현황 (최신 연도)
// ─────────────────────────────────────────────────────────────
{
  const j = readApiJson("knoc_petroleum_consumption.json");
  const src = "knoc_petroleum";
  let latest: Record<string, unknown> | null = null;
  for (const row of j.data) {
    const y = num(row["년"]);
    if (y !== null && (!latest || y > (num(latest["년"]) ?? 0))) latest = row;
  }
  if (!latest) fail("석유공사 소비현황 데이터 없음");
  const year = num(latest["년"]);
  for (const r of REGIONS) {
    const raw = Object.entries(latest).find(([k]) => resolveRegionCode(k) === r.code);
    const v = raw ? num(raw[1]) : null;
    setMetric(r.code, "petroleum_consumption", {
      value: v, unit: "천배럴/년", sourceId: src, baseDate: `${year}-12-31`,
      quality: v === null ? "missing" : "ok",
      evidence: `${year}년 석유제품 소비량`,
    });
  }
  addSource({
    id: src,
    provider: "산업통상부(한국석유공사)",
    title: "한국석유공사_국내 석유제품 지역별 소비현황",
    url: "https://www.data.go.kr/data/15054602/fileData.do",
    baseDate: `${year}-12-31`,
    updateCycle: "연간",
    accessMethod: "data_go_kr_openapi",
  }, j.totalCount);
}

// ─────────────────────────────────────────────────────────────
// 8. 한국가스안전공사_전국 도시가스사별 가스공급 정보 (사업자→권역 배분)
// ─────────────────────────────────────────────────────────────
{
  const j = readApiJson("kgs_citygas_supply.json");
  const src = "kgs_citygas";
  const custSums: Record<string, number> = {};
  const pipeSums: Record<string, number> = {};
  const companies: Record<string, string[]> = {};
  const unmapped: string[] = [];
  for (const row of j.data) {
    const name = String(row["도시가스사업자"] ?? "").replace(/\s+/g, "");
    const code = CITYGAS_COMPANY_TO_REGION[name];
    if (!code) {
      if (name) unmapped.push(name);
      continue;
    }
    const cust = num(row["수요자 수(개)"]);
    const pipe = num(row["배관(미터)"]);
    if (cust !== null) custSums[code] = (custSums[code] ?? 0) + cust;
    if (pipe !== null) pipeSums[code] = (pipeSums[code] ?? 0) + pipe;
    (companies[code] ??= []).push(name);
  }
  for (const r of REGIONS) {
    const has = companies[r.code]?.length;
    const ev = has
      ? `도시가스사(${companies[r.code].join(", ")})의 주 공급권역 기준 배분. 복수 시도 공급 사업자는 주 권역 1곳에 배분(partial).${unmapped.length ? ` 권역 미확인 사업자 제외: ${unmapped.join(", ")}` : ""}`
      : "주 공급권역이 해당 시도로 확인되는 도시가스사 없음";
    setMetric(r.code, "citygas_customers", {
      value: custSums[r.code] ?? null, unit: "개(수요자)", sourceId: src, baseDate: "2025-09-19",
      quality: has ? "partial" : "missing", evidence: ev,
    });
    setMetric(r.code, "citygas_pipeline_m", {
      value: pipeSums[r.code] ?? null, unit: "m(배관)", sourceId: src, baseDate: "2025-09-19",
      quality: has ? "partial" : "missing", evidence: ev,
    });
  }
  addSource({
    id: src,
    provider: "산업통상부(한국가스안전공사)",
    title: "한국가스안전공사_전국 도시가스사별 가스공급 정보",
    url: "https://www.data.go.kr/data/15020493/fileData.do",
    baseDate: "2025-09-19",
    updateCycle: "연간",
    accessMethod: "data_go_kr_openapi",
  }, j.totalCount);
}

// ─────────────────────────────────────────────────────────────
// 9. 한국에너지공단_기초지자체별 신재생에너지 보급 현황 (광역 합계)
// ─────────────────────────────────────────────────────────────
{
  const j = readApiJson("knrec_renewable_deployment.json");
  const src = "knrec_renewable";
  const base = "2024-12-31";
  // '기초 == 광역' 행이 광역 합계 행. 에너지원 '신·재생에너지'가 전체 합계.
  const genSums: Record<string, number> = {};
  const capSums: Record<string, number> = {};
  for (const row of j.data) {
    const wide = String(row["광역"] ?? "");
    const basic = String(row["기초"] ?? "");
    const fuel = String(row["에너지원"] ?? "");
    if (wide !== basic || !fuel.includes("신") || !fuel.includes("재생")) continue;
    const code = resolveRegionCode(wide);
    if (!code) continue;
    const g = num(row["발전량(MWh)"]);
    const c = num(row["보급용량_발전_누적(kW)"]);
    if (g !== null) genSums[code] = (genSums[code] ?? 0) + g;
    if (c !== null) capSums[code] = (capSums[code] ?? 0) + c;
  }
  for (const r of REGIONS) {
    setMetric(r.code, "renewable_generation_mwh", {
      value: genSums[r.code] ?? null, unit: "MWh/년", sourceId: src, baseDate: base,
      quality: genSums[r.code] === undefined ? "missing" : "ok",
      evidence: "기초지자체별 신·재생에너지 발전량의 광역 합계 행",
    });
    setMetric(r.code, "renewable_capacity_kw", {
      value: capSums[r.code] ?? null, unit: "kW(누적)", sourceId: src, baseDate: base,
      quality: capSums[r.code] === undefined ? "missing" : "ok",
      evidence: "기초지자체별 신·재생에너지 보급용량(발전, 누적)의 광역 합계 행",
    });
  }
  addSource({
    id: src,
    provider: "한국에너지공단",
    title: "한국에너지공단_기초지자체별 신재생에너지 보급 현황",
    url: "https://www.data.go.kr/data/15086292/fileData.do",
    baseDate: base,
    updateCycle: "연간",
    accessMethod: "data_go_kr_openapi",
  }, j.totalCount);
}

// ─────────────────────────────────────────────────────────────
// 10. 한국전력거래소_지역별 시간별 태양광 및 풍력 발전량 (2025 연간 집계)
// ─────────────────────────────────────────────────────────────
{
  const p = path.join(RAW_API, "kpx_solarwind_aggregated.json");
  if (!fs.existsSync(p)) fail("kpx_solarwind_aggregated.json 없음");
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  const src = "kpx_solarwind";
  const solar: Record<string, number> = {};
  const wind: Record<string, number> = {};
  for (const row of j.rows) {
    const code = resolveRegionCode(String(row.region));
    if (!code) continue;
    if (row.fuel === "태양광") solar[code] = (solar[code] ?? 0) + row.annualMwh;
    if (row.fuel === "풍력") wind[code] = (wind[code] ?? 0) + row.annualMwh;
  }
  for (const r of REGIONS) {
    setMetric(r.code, "solar_generation_mwh", {
      value: solar[r.code] ?? null, unit: "MWh/년(전력시장 거래량)", sourceId: src, baseDate: j.baseDate,
      quality: solar[r.code] === undefined ? "missing" : "ok",
      evidence: `2025년 시간별 태양광 전력거래량 ${j.sourceTotalCount.toLocaleString()}행의 연간 합계`,
    });
    setMetric(r.code, "wind_generation_mwh", {
      value: wind[r.code] ?? null, unit: "MWh/년(전력시장 거래량)", sourceId: src, baseDate: j.baseDate,
      quality: wind[r.code] === undefined ? "missing" : "ok",
      evidence: `2025년 시간별 풍력 전력거래량 ${j.sourceTotalCount.toLocaleString()}행의 연간 합계`,
    });
  }
  addSource({
    id: src,
    provider: "한국전력거래소",
    title: "한국전력거래소_지역별 시간별 태양광 및 풍력 발전량",
    url: "https://www.data.go.kr/data/15065269/fileData.do",
    baseDate: j.baseDate,
    updateCycle: "연간",
    accessMethod: "data_go_kr_openapi",
  }, j.sourceTotalCount);
}

// ─────────────────────────────────────────────────────────────
// 출력
// ─────────────────────────────────────────────────────────────
const regions: RegionProfile[] = REGIONS.map((r) => ({
  regionCode: r.code,
  regionName: r.name,
  metrics: metrics[r.code],
}));

const gridData: Omit<GridData, "dataOrigin"> = {
  generatedAt: now,
  sources,
  regions,
  national: { gasPeakSupplyLatest: nationalGasPeak },
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "gridos-data.json"), JSON.stringify(gridData, null, 2));

// Supabase 시드 SQL 생성
const esc = (s: string | null | undefined) => (s === null || s === undefined ? "null" : `'${String(s).replace(/'/g, "''")}'`);
const lines: string[] = [
  "begin;",
  "delete from public.region_metrics;",
  "delete from public.region_profiles;",
  "delete from public.sources;",
];
for (const s of sources) {
  lines.push(
    `insert into public.sources (id, provider, title, url, collected_at, base_date, row_count, update_cycle, license_note, access_method) values (` +
      `${esc(s.id)}, ${esc(s.provider)}, ${esc(s.title)}, ${esc(s.url)}, ${esc(s.collectedAt)}, ${esc(s.baseDate)}, ${s.rowCount}, ${esc(s.updateCycle)}, ${esc(s.licenseNote)}, ${esc(s.accessMethod)});`
  );
}
for (const r of regions) {
  lines.push(`insert into public.region_profiles (region_code, region_name) values (${esc(r.regionCode)}, ${esc(r.regionName)});`);
}
for (const r of regions) {
  for (const [key, m] of Object.entries(r.metrics)) {
    if (!m) continue;
    lines.push(
      `insert into public.region_metrics (region_code, metric_key, value, unit, source_id, base_date, quality, evidence) values (` +
        `${esc(r.regionCode)}, ${esc(key)}, ${m.value === null ? "null" : m.value}, ${esc(m.unit)}, ${esc(m.sourceId)}, ${esc(m.baseDate)}, ${esc(m.quality)}, ${esc(m.evidence)});`
    );
  }
}
lines.push(
  `insert into public.ingestion_runs (status, finished_at, source_count, region_count) values ('success', now(), ${sources.length}, ${regions.length});`
);
lines.push("commit;");
fs.writeFileSync(path.join(OUT_DIR, "seed.sql"), lines.join("\n"));

console.log(`[build-dataset] OK — sources=${sources.length}, regions=${regions.length}`);
for (const s of sources) console.log(`  - ${s.id}: ${s.title} (rows=${s.rowCount}, baseDate=${s.baseDate})`);
