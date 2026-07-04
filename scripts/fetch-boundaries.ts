/**
 * VWorld 데이터 API(LT_C_ADSIDO_INFO)에서 시도 행정경계를 받아
 * 단순화(RDP) 후 data/processed/sido-geo.json 으로 저장한다.
 *
 * 사용: .env.local 에 VWORLD_API_KEY 설정 후 `pnpm map:fetch`
 * 지도는 빌드에 포함된 이 파일만 사용하므로 런타임에 키가 노출되지 않는다.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { resolveRegionCode } from "../lib/domain/region";

const ROOT = path.resolve(__dirname, "..");

// .env.local 로드
const envPath = path.join(ROOT, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

const KEY = process.env.VWORLD_API_KEY;
if (!KEY) {
  console.error("[map:fetch] VWORLD_API_KEY 가 .env.local 에 없습니다.");
  console.error("  https://www.vworld.kr 에서 발급한 키를 VWORLD_API_KEY=... 로 추가한 뒤 다시 실행하세요.");
  process.exit(1);
}

type Ring = [number, number][];

/** Ramer–Douglas–Peucker 단순화 */
function rdp(points: Ring, epsilon: number): Ring {
  if (points.length < 3) return points;
  const [sx, sy] = points[0];
  const [ex, ey] = points[points.length - 1];
  let maxDist = 0;
  let index = 0;
  const dx = ex - sx;
  const dy = ey - sy;
  const len = Math.hypot(dx, dy) || 1e-12;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const dist = Math.abs(dy * px - dx * py + ex * sy - ey * sx) / len;
    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }
  if (maxDist > epsilon) {
    const left = rdp(points.slice(0, index + 1), epsilon);
    const right = rdp(points.slice(index), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [points[0], points[points.length - 1]];
}

function ringArea(ring: Ring): number {
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
}

async function fetchPage(page: number) {
  const url =
    `https://api.vworld.kr/req/data?service=data&request=GetFeature&data=LT_C_ADSIDO_INFO` +
    `&key=${encodeURIComponent(KEY!)}&format=json&geometry=true&crs=EPSG:4326&size=20&page=${page}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`VWorld HTTP ${res.status}`);
  const j = (await res.json()) as any;
  const status = j?.response?.status;
  if (status !== "OK") {
    throw new Error(`VWorld 응답 상태 ${status}: ${JSON.stringify(j?.response?.error ?? j).slice(0, 300)}`);
  }
  return j.response.result.featureCollection.features as any[];
}

async function main() {
  const features = await fetchPage(1);
  console.log(`[map:fetch] 시도 경계 ${features.length}개 피처 수신`);

  const EPS = 0.008; // 약 0.8km 급 단순화 — 전국 지도 표시용
  const MIN_AREA = 0.005; // 작은 부속도서 제거 (deg^2)

  const regions: { code: string; name: string; rings: Ring[] }[] = [];
  for (const f of features) {
    const name: string = f.properties?.ctp_kor_nm ?? "";
    const code = resolveRegionCode(name);
    if (!code) {
      console.warn(`  ! 매핑 실패: ${name}`);
      continue;
    }
    const geom = f.geometry;
    const polys: Ring[][] =
      geom.type === "MultiPolygon" ? geom.coordinates : geom.type === "Polygon" ? [geom.coordinates] : [];
    const rings: Ring[] = [];
    for (const poly of polys) {
      const outer = poly[0] as Ring; // 외곽 링만 사용 (구멍 무시 — 표시용)
      if (ringArea(outer) < MIN_AREA) continue;
      const simplified = rdp(outer, EPS);
      if (simplified.length >= 4) rings.push(simplified);
    }
    // 링이 모두 면적 기준에서 탈락하면 가장 큰 링 하나는 유지
    if (rings.length === 0 && polys.length > 0) {
      const biggest = polys.map((p) => p[0] as Ring).sort((a, b) => ringArea(b) - ringArea(a))[0];
      rings.push(rdp(biggest, EPS));
    }
    regions.push({ code, name, rings });
    console.log(`  - ${name} → ${code}: 링 ${rings.length}개, 점 ${rings.reduce((s, r) => s + r.length, 0)}개`);
  }

  if (regions.length < 17) {
    console.error(`[map:fetch] FAIL — 17개 시도 중 ${regions.length}개만 수집됨`);
    process.exit(1);
  }

  const out = {
    source: {
      title: "VWorld 디지털트윈국토 데이터 API — 시도 행정경계(LT_C_ADSIDO_INFO)",
      url: "https://www.vworld.kr/dev/v4dv_2ddataguide2_s001.do",
      fetchedAt: new Date().toISOString(),
      crs: "EPSG:4326",
      note: `RDP epsilon ${EPS}, 최소 면적 ${MIN_AREA} 단순화 적용 (표시 전용)`,
    },
    regions,
  };
  const outPath = path.join(ROOT, "data", "processed", "sido-geo.json");
  fs.writeFileSync(outPath, JSON.stringify(out));
  console.log(`[map:fetch] OK → ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(0)}KB)`);
}

main().catch((e) => {
  console.error("[map:fetch] FAIL:", e.message);
  process.exit(1);
});
