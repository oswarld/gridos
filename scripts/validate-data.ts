/**
 * 배포 차단 검증 (docs/Technical_Architecture.md 13장)
 * 1. 원천/지역/지표 데이터 무결성 검사
 * 2. 제출 빌드 경로에 더미데이터 생성 코드가 없는지 키워드 검사
 */
import * as fs from "node:fs";
import * as path from "node:path";
import {
  COUNTRY_CODES,
  type BoundaryGeometry,
  type CountryCode,
} from "../lib/atlas-types";

const ROOT = path.resolve(__dirname, "..");
let failed = false;

function fail(msg: string) {
  console.error(`  ✗ ${msg}`);
  failed = true;
}
function ok(msg: string) {
  console.log(`  ✓ ${msg}`);
}

function pointInRing([x, y]: [number, number], ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point: [number, number], polygon: number[][][]): boolean {
  if (!polygon[0] || !pointInRing(point, polygon[0])) return false;
  return !polygon.slice(1).some((hole) => pointInRing(point, hole));
}

function pointInBoundary(
  point: [number, number],
  boundary: BoundaryGeometry,
): boolean {
  if (boundary.type === "Polygon") {
    return pointInPolygon(point, boundary.coordinates as number[][][]);
  }
  return (boundary.coordinates as number[][][][]).some((polygon) =>
    pointInPolygon(point, polygon),
  );
}

// ─── 1. 데이터 무결성 ───
console.log("[validate] 데이터 무결성 검사");
const dataPath = path.join(ROOT, "data", "processed", "gridos-data.json");
if (!fs.existsSync(dataPath)) {
  fail("gridos-data.json 없음 — pnpm data:build 먼저 실행");
} else {
  const d = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  if (!Array.isArray(d.sources) || d.sources.length === 0) fail("sources 비어 있음");
  else ok(`원천 ${d.sources.length}개`);

  const badRows = (d.sources ?? []).filter((s: any) => !(s.rowCount > 0));
  if (badRows.length) fail(`행 수 0인 원천: ${badRows.map((s: any) => s.id).join(", ")}`);
  else ok("모든 원천 행 수 > 0");

  if (!Array.isArray(d.regions) || d.regions.length === 0) fail("regions 비어 있음");
  else ok(`지역 ${d.regions.length}개`);

  const sourceIds = new Set((d.sources ?? []).map((s: any) => s.id));
  let metricCount = 0;
  let orphan = 0;
  let invalidValue = 0;
  for (const r of d.regions ?? []) {
    for (const m of Object.values<any>(r.metrics ?? {})) {
      metricCount++;
      if (!sourceIds.has(m.sourceId)) orphan++;
      if (m.value !== null && !Number.isFinite(m.value)) invalidValue++;
    }
  }
  if (orphan) fail(`출처 없는 지표 ${orphan}개`);
  else ok(`지표 ${metricCount}개 모두 출처 연결됨`);
  if (invalidValue) fail(`유한하지 않은 값 ${invalidValue}개`);
  else ok("모든 값이 null 또는 유한수");

  if (isNaN(Date.parse(d.generatedAt))) fail("generatedAt이 ISO 날짜가 아님");
  else ok("generatedAt ISO 형식");
}

// ─── 2. 5개국 공개 아틀라스 무결성 ───
console.log("[validate] 5개국 공개 아틀라스 검사");
const atlasPath = path.join(ROOT, "data", "processed", "atlas-public.json");
const boundariesPath = path.join(ROOT, "data", "processed", "atlas-boundaries.json");
if (!fs.existsSync(atlasPath) || !fs.existsSync(boundariesPath)) {
  fail("atlas-public.json 또는 atlas-boundaries.json 없음 — pnpm data:build:atlas 먼저 실행");
} else {
  const atlas = JSON.parse(fs.readFileSync(atlasPath, "utf8"));
  const boundaries = JSON.parse(fs.readFileSync(boundariesPath, "utf8"));
  const atlasSources: any[] = atlas.sources ?? [];
  const atlasEntities: any[] = atlas.entities ?? [];
  const atlasFacilities: any[] = atlas.facilities ?? [];
  const atlasLinearFeatures: any[] = atlas.linearFeatures ?? [];
  const atlasRegions: any[] = atlas.regions ?? [];
  const boundaryFeatures: any[] = boundaries.features ?? [];
  const countries = [...COUNTRY_CODES];
  const layers = ["power_plant", "data_center", "network_hub", "transmission", "pipeline"];
  const idGroups: [string, any[]][] = [
    ["source", atlasSources],
    ["entity", atlasEntities],
    ["facility", atlasFacilities],
    ["linearFeature", atlasLinearFeatures],
    ["region", atlasRegions],
  ];

  for (const [label, rows] of idGroups) {
    const ids = rows.map((row) => row.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length) fail(`${label} 중복 ID: ${[...new Set(duplicates)].join(", ")}`);
    else ok(`${label} ID ${ids.length}개 중복 없음`);
  }

  const sourceIds = new Set(atlasSources.map((source) => source.id));
  const entityIds = new Set(atlasEntities.map((entity) => entity.id));
  const facilityIds = new Set(atlasFacilities.map((facility) => facility.id));
  let atlasOrphans = 0;
  let invalidCoordinates = 0;
  let invalidRelations = 0;

  for (const entity of atlasEntities) {
    for (const parentId of entity.parentEntityIds ?? []) {
      if (!entityIds.has(parentId)) invalidRelations++;
    }
    for (const security of entity.securities ?? []) {
      if (!sourceIds.has(security.sourceId)) atlasOrphans++;
      if (!security.ticker || !security.exchange) invalidRelations++;
    }
  }
  for (const facility of atlasFacilities) {
    if (
      !Array.isArray(facility.coordinates) ||
      facility.coordinates.length !== 2 ||
      (facility.coordinates as any[]).some((value) => !Number.isFinite(value))
    ) {
      invalidCoordinates++;
    }
    for (const sourceId of facility.sourceIds ?? []) {
      if (!sourceIds.has(sourceId)) atlasOrphans++;
    }
    if (facility.operatorEntityId && !entityIds.has(facility.operatorEntityId)) invalidRelations++;
    for (const ownerId of facility.ownerEntityIds ?? []) {
      if (!entityIds.has(ownerId)) invalidRelations++;
    }
    for (const connectionId of facility.connectionIds ?? []) {
      if (!facilityIds.has(connectionId)) invalidRelations++;
    }
  }
  for (const feature of atlasLinearFeatures) {
    if (
      !Array.isArray(feature.coordinates) ||
      feature.coordinates.length < 2 ||
      (feature.coordinates as any[]).flat().some((value) => !Number.isFinite(value))
    ) {
      invalidCoordinates++;
    }
    for (const sourceId of feature.sourceIds ?? []) {
      if (!sourceIds.has(sourceId)) atlasOrphans++;
    }
    const allowedPipelineSubstances = new Set([
      "gas",
      "oil",
      "fuel",
      "lpg",
      "ngl",
      "hydrogen",
      "propane",
      "butane",
      "ethane",
      "syngas",
      "y-grade",
    ]);
    if (
      feature.kind === "pipeline" &&
      feature.substance &&
      !allowedPipelineSubstances.has(feature.substance)
    ) {
      fail(`에너지 물질이 아닌 pipeline 태그: ${feature.id} (${feature.substance})`);
    }
  }
  for (const region of atlasRegions) {
    for (const sourceId of region.sourceIds ?? []) {
      if (!sourceIds.has(sourceId)) atlasOrphans++;
    }
    const demand = region.demand?.value;
    const supply = region.supply?.value;
    if (
      (demand !== null && !Number.isFinite(demand)) ||
      (supply !== null && !Number.isFinite(supply))
    ) {
      fail(`유한하지 않은 수급 값: ${region.id}`);
    }
    if (region.demand?.unit !== region.supply?.unit) {
      fail(`수요·공급 단위 불일치: ${region.id}`);
    }
    if (!region.methodology?.ko || !region.methodology?.en) {
      fail(`방법론 주석 누락: ${region.id}`);
    }
  }
  if (atlasOrphans) fail(`아틀라스 출처 고아 참조 ${atlasOrphans}개`);
  else ok("시설·선형망·수급·티커가 모두 출처에 연결됨");
  if (invalidCoordinates) fail(`유효하지 않은 좌표/선형 ${invalidCoordinates}개`);
  else ok("시설 좌표와 선형 좌표가 모두 유한수");
  if (invalidRelations) fail(`유효하지 않은 기업/시설 관계 ${invalidRelations}개`);
  else ok("운영사·소유주·연결·상장사 관계 참조 정상");

  for (const country of countries) {
    const facilityRows = atlasFacilities.filter((row) => row.country === country);
    const lineRows = atlasLinearFeatures.filter((row) => row.country === country);
    const regionRows = atlasRegions.filter((row) => row.country === country);
    const kinds = new Set([...facilityRows, ...lineRows].map((row) => row.kind));
    const missingLayers = layers.filter((layer) => !kinds.has(layer));
    if (!regionRows.length) {
      fail(`${country} 필수 공개 범위 누락`);
    } else if (country === "CN") {
      ok(`${country}: 상세 지도 중심 공개, 수급 ${regionRows.length}개`);
    } else if (!facilityRows.length || !lineRows.length) {
      fail(`${country} 대표 공개 시설 또는 선형망 누락`);
    } else if (missingLayers.length) {
      fail(`${country} 레이어 누락: ${missingLayers.join(", ")}`);
    } else {
      ok(
        `${country}: 시설 ${facilityRows.length}, 선형 ${lineRows.length}, 지역 ${regionRows.length}, 5개 레이어`,
      );
    }
  }

  const boundaryCountries = new Set(boundaryFeatures.map((row) => row.country));
  const missingBoundaries = countries.filter((country) => !boundaryCountries.has(country));
  if (missingBoundaries.length) fail(`국가 경계 누락: ${missingBoundaries.join(", ")}`);
  else ok("5개국 Natural Earth 경계 존재");
  const adminBoundaries: any[] = boundaries.admin1 ?? [];
  for (const country of countries) {
    const count = adminBoundaries.filter((row) => row.country === country).length;
    if (!count) fail(`${country} 상세 행정경계 누락`);
    else ok(`${country} 상세 행정경계 ${count}개`);
  }

  const generatedTime = Date.parse(atlas.generatedAt);
  const ageDays = (Date.now() - generatedTime) / 86_400_000;
  if (!Number.isFinite(generatedTime) || ageDays < -1 || ageDays > 31) {
    fail(`아틀라스 생성시점 비정상 또는 31일 초과: ${atlas.generatedAt}`);
  } else {
    ok(`아틀라스 스냅샷 최신성 ${Math.max(0, ageDays).toFixed(1)}일`);
  }
  if (!atlas.coverageNote?.ko || !atlas.coverageNote?.en) {
    fail("대표 스냅샷 범위 주석 누락");
  } else {
    ok("완전목록이 아님을 밝히는 범위 주석 존재");
  }
}

// ─── 3. 국가 상세 지도 레이어 ───
console.log("[validate] 국가 상세 지도 레이어 검사");
const detailMinimums: Record<string, { points: number; lines: number }> = {
  KR: { points: 1000, lines: 1000 },
  JP: { points: 5000, lines: 5000 },
  TW: { points: 200, lines: 500 },
  US: { points: 10000, lines: 3000 },
  CN: { points: 10000, lines: 10000 },
};
const boundaryDataset = fs.existsSync(boundariesPath)
  ? (JSON.parse(fs.readFileSync(boundariesPath, "utf8")) as {
      features?: BoundaryGeometry[];
    })
  : undefined;
const detailBoundaries = new Map(
  (boundaryDataset?.features ?? []).map((boundary) => [boundary.country, boundary]),
);
for (const [country, minimum] of Object.entries(detailMinimums)) {
  const detailPath = path.join(
    ROOT,
    "public",
    "data",
    "detail",
    `${country.toLowerCase()}.json`,
  );
  if (!fs.existsSync(detailPath)) {
    fail(`${country} 상세 지도 없음 — pnpm data:build:detail 먼저 실행`);
    continue;
  }
  const detail = JSON.parse(fs.readFileSync(detailPath, "utf8"));
  const points: any[] = detail.points ?? [];
  const lines: any[] = detail.lines ?? [];
  if (detail.country !== country) fail(`${country} 상세 지도 국가 코드 불일치`);
  const rowCountryMismatch = [...points, ...lines].filter(
    (row) => row.country !== country,
  );
  if (rowCountryMismatch.length) {
    fail(`${country} 상세 행 국가 코드 불일치 ${rowCountryMismatch.length}개`);
  }
  if (points.length < minimum.points || lines.length < minimum.lines) {
    fail(
      `${country} 상세 범위 부족: points=${points.length}, lines=${lines.length}`,
    );
  } else {
    ok(`${country}: 상세 포인트 ${points.length}, 선형 그룹 ${lines.length}`);
  }
  const ids = [...points, ...lines].map((row) => row.id);
  if (new Set(ids).size !== ids.length) fail(`${country} 상세 레이어 ID 중복`);
  const detailKinds = new Set([...points, ...lines].map((row) => row.kind));
  const missingDetailLayers = [
    "power_plant",
    "data_center",
    "network_hub",
    "transmission",
    "pipeline",
  ].filter((kind) => !detailKinds.has(kind));
  if (missingDetailLayers.length) {
    fail(`${country} 상세 레이어 누락: ${missingDetailLayers.join(", ")}`);
  } else {
    ok(`${country} 상세 5개 레이어 존재`);
  }

  let invalidDetailCoordinates = 0;
  let misplacedOsmPoints = 0;
  const detailBoundary = detailBoundaries.get(country as CountryCode);
  const finiteCoordinates = (value: unknown): boolean => {
    if (typeof value === "number") return Number.isFinite(value);
    if (!Array.isArray(value) || value.length === 0) return false;
    return value.every(finiteCoordinates);
  };
  for (const point of points) {
    if (
      !Array.isArray(point.coordinates) ||
      point.coordinates.length !== 2 ||
      !finiteCoordinates(point.coordinates)
    ) {
      invalidDetailCoordinates++;
    } else if (
      country !== "US" &&
      String(point.sourceLabel ?? "").startsWith("OpenStreetMap") &&
      (!detailBoundary ||
        !pointInBoundary(point.coordinates as [number, number], detailBoundary))
    ) {
      misplacedOsmPoints++;
    }
    if (!point.sourceLabel || !String(point.sourceUrl ?? "").startsWith("https://")) {
      fail(`${country} 상세 포인트 출처 누락: ${point.id}`);
    }
  }
  for (const line of lines) {
    if (
      !finiteCoordinates(line.coordinates) ||
      (line.segments && !finiteCoordinates(line.segments))
    ) {
      invalidDetailCoordinates++;
    }
    if (!line.sourceLabel || !String(line.sourceUrl ?? "").startsWith("https://")) {
      fail(`${country} 상세 선형 출처 누락: ${line.id}`);
    }
  }
  if (invalidDetailCoordinates) {
    fail(`${country} 상세 레이어 유효하지 않은 좌표 ${invalidDetailCoordinates}개`);
  } else {
    ok(`${country} 상세 좌표 및 공개 출처 정상`);
  }
  if (misplacedOsmPoints) {
    fail(`${country} 경계 밖 OSM 시설 ${misplacedOsmPoints}개`);
  } else if (country !== "US") {
    ok(`${country} OSM 시설 국가경계 귀속 정상`);
  }
}

// ─── 4. 더미데이터 키워드 검사 ───
console.log("[validate] 더미데이터 키워드 검사 (app/, components/, lib/)");
// 키워드를 문자열 결합으로 만들어 이 파일 자체가 검사에 걸리지 않게 한다.
const BANNED = [
  "dum" + "my",
  "mo" + "ck",
  "fak" + "er",
  "Math.rand" + "om",
  "sample" + "Data",
  "fixt" + "ure",
  "placeholder " + "region",
];
const SCAN_DIRS = ["app", "components", "lib"];
const hits: string[] = [];
function scan(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      scan(p);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      const content = fs.readFileSync(p, "utf8");
      for (const kw of BANNED) {
        if (content.includes(kw)) hits.push(`${path.relative(ROOT, p)}: '${kw}'`);
      }
    }
  }
}
for (const d of SCAN_DIRS) {
  const p = path.join(ROOT, d);
  if (fs.existsSync(p)) scan(p);
}
if (hits.length) {
  for (const h of hits) fail(h);
} else {
  ok("금지 키워드 없음");
}

if (failed) {
  console.error("[validate] FAIL — 배포 차단");
  process.exit(1);
}
console.log("[validate] OK");
