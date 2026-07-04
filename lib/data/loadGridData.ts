// GridData 서버 로더: Supabase(PostgREST)를 기본 원천으로 사용하고,
// 환경변수 미설정/장애 시 빌드에 포함된 실데이터 스냅샷(seed와 동일 파일)으로
// 폴백한다. 폴백 여부는 dataOrigin으로 화면에 표시한다.
import bundledSnapshot from "../../data/processed/gridos-data.json";
import { restConfigFromEnv, restSelect } from "../supabase/rest";
import type { GridData, MetricKey, RegionMetricValue, RegionProfile, SourceMeta } from "../types";

type SourceRow = {
  id: string;
  provider: string;
  title: string;
  url: string;
  collected_at: string;
  base_date: string | null;
  row_count: number;
  update_cycle: string | null;
  license_note: string | null;
  access_method: SourceMeta["accessMethod"];
};

type ProfileRow = { region_code: string; region_name: string };

type MetricRow = {
  region_code: string;
  metric_key: string;
  value: number | string | null;
  unit: string;
  source_id: string;
  base_date: string | null;
  quality: RegionMetricValue["quality"];
  evidence: string | null;
};

function validate(data: GridData): GridData {
  if (!data.sources.length) throw new Error("원천 데이터가 비어 있음 — 배포 차단");
  for (const s of data.sources) {
    if (!(s.rowCount > 0)) throw new Error(`원천 '${s.title}' 행 수가 0 — 배포 차단`);
  }
  if (!data.regions.length) throw new Error("지역 프로파일이 비어 있음 — 배포 차단");
  return data;
}

async function loadFromSupabase(): Promise<GridData | null> {
  const cfg = restConfigFromEnv();
  if (!cfg) return null;
  try {
    const [sources, profiles, metrics] = await Promise.all([
      restSelect<SourceRow>(cfg, "sources", "select=*"),
      restSelect<ProfileRow>(cfg, "region_profiles", "select=*"),
      restSelect<MetricRow>(cfg, "region_metrics", "select=*&limit=1000"),
    ]);
    if (!sources.length || !profiles.length) return null;

    const regions: RegionProfile[] = profiles.map((p) => ({
      regionCode: p.region_code,
      regionName: p.region_name,
      metrics: {},
    }));
    const byCode = new Map(regions.map((r) => [r.regionCode, r]));
    for (const m of metrics) {
      const region = byCode.get(m.region_code);
      if (!region) continue;
      region.metrics[m.metric_key as MetricKey] = {
        value: m.value === null ? null : Number(m.value),
        unit: m.unit,
        sourceId: m.source_id,
        baseDate: m.base_date,
        quality: m.quality,
        evidence: m.evidence ?? undefined,
      };
    }

    return validate({
      generatedAt: new Date().toISOString(),
      dataOrigin: "supabase",
      sources: sources.map((s) => ({
        id: s.id,
        provider: s.provider,
        title: s.title,
        url: s.url,
        collectedAt: s.collected_at,
        baseDate: s.base_date,
        rowCount: s.row_count,
        updateCycle: s.update_cycle ?? undefined,
        licenseNote: s.license_note ?? undefined,
        accessMethod: s.access_method,
      })),
      regions,
      national: (bundledSnapshot as any).national ?? { gasPeakSupplyLatest: null },
    });
  } catch (e) {
    console.error("[loadGridData] Supabase 로드 실패, 번들 스냅샷으로 폴백:", e);
    return null;
  }
}

export async function loadGridData(): Promise<GridData> {
  const fromDb = await loadFromSupabase();
  if (fromDb) return fromDb;
  // 번들 스냅샷도 Supabase seed와 동일한 실제 공공데이터 파이프라인 산출물이다.
  return validate({ ...(bundledSnapshot as any), dataOrigin: "bundled_snapshot" } as GridData);
}
