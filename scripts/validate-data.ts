/**
 * 배포 차단 검증 (docs/Technical_Architecture.md 13장)
 * 1. 원천/지역/지표 데이터 무결성 검사
 * 2. 제출 빌드 경로에 더미데이터 생성 코드가 없는지 키워드 검사
 */
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(__dirname, "..");
let failed = false;

function fail(msg: string) {
  console.error(`  ✗ ${msg}`);
  failed = true;
}
function ok(msg: string) {
  console.log(`  ✓ ${msg}`);
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

// ─── 2. 더미데이터 키워드 검사 ───
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
