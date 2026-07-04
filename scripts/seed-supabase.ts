/**
 * data/processed/gridos-data.json 을 Supabase에 시드한다 (PostgREST fetch 기반).
 * SUPABASE_SERVICE_ROLE_KEY 가 있으면 그것을, 없으면 anon key를 사용한다
 * (anon 시드는 시드용 임시 RLS 정책이 열려 있을 때만 동작).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { restInsert, restDeleteAll } from "../lib/supabase/rest";

const ROOT = path.resolve(__dirname, "..");

// .env.local 로드 (외부 의존성 없이)
const envPath = path.join(ROOT, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("[seed] NEXT_PUBLIC_SUPABASE_URL / key 가 .env.local 에 없습니다");
  process.exit(1);
}
const cfg = { url, key };

const dataPath = path.join(ROOT, "data", "processed", "gridos-data.json");
if (!fs.existsSync(dataPath)) {
  console.error("[seed] gridos-data.json 없음 — pnpm data:build 먼저 실행");
  process.exit(1);
}
const grid = JSON.parse(fs.readFileSync(dataPath, "utf8"));
if (!grid.sources?.length || !grid.regions?.length) {
  console.error("[seed] 원천 또는 지역 데이터가 비어 있음 — 시드 차단");
  process.exit(1);
}

async function main() {
  // 기존 데이터 제거 (역참조 순서)
  await restDeleteAll(cfg, "region_metrics", "id");
  await restDeleteAll(cfg, "region_profiles", "region_code");
  await restDeleteAll(cfg, "sources", "id");

  await restInsert(
    cfg,
    "sources",
    grid.sources.map((s: any) => ({
      id: s.id,
      provider: s.provider,
      title: s.title,
      url: s.url,
      collected_at: s.collectedAt,
      base_date: s.baseDate,
      row_count: s.rowCount,
      update_cycle: s.updateCycle ?? null,
      license_note: s.licenseNote ?? null,
      access_method: s.accessMethod,
    }))
  );

  await restInsert(
    cfg,
    "region_profiles",
    grid.regions.map((r: any) => ({ region_code: r.regionCode, region_name: r.regionName }))
  );

  const metricRows: any[] = [];
  for (const r of grid.regions) {
    for (const [metricKey, m] of Object.entries<any>(r.metrics)) {
      metricRows.push({
        region_code: r.regionCode,
        metric_key: metricKey,
        value: m.value,
        unit: m.unit,
        source_id: m.sourceId,
        base_date: m.baseDate,
        quality: m.quality,
        evidence: m.evidence ?? null,
      });
    }
  }
  await restInsert(cfg, "region_metrics", metricRows);

  try {
    await restInsert(cfg, "ingestion_runs", [
      {
        status: "success",
        finished_at: new Date().toISOString(),
        source_count: grid.sources.length,
        region_count: grid.regions.length,
      },
    ]);
  } catch (e: any) {
    console.warn("[seed] ingestion_runs 기록 실패(무시): " + e.message);
  }

  console.log(`[seed] OK — sources=${grid.sources.length}, regions=${grid.regions.length}, metrics=${metricRows.length}`);
}

main().catch((e) => {
  console.error("[seed] FAIL:", e.message);
  process.exit(1);
});
