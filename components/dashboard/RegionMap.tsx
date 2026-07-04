"use client";

import { useMemo } from "react";
import sidoGeo from "@/data/processed/sido-geo.json";
import type { RegionScore } from "@/lib/types";
import { DECISION_LABELS } from "@/lib/types";

type Ring = [number, number][];
type GeoRegion = { code: string; name: string; rings: Ring[] };
type SidoGeo = {
  source: { title: string; fetchedAt: string } | null;
  regions: GeoRegion[];
};

const geo = sidoGeo as unknown as SidoGeo;

/** 점수별 채색 (K-GRID 팔레트: 성공 그린 → 브랜드 옐로 → 코럴), 데이터 부족은 회색 */
function fillColor(score: number | null): string {
  if (score === null) return "#eef0f3";
  if (score >= 70) return "#00b473";
  if (score >= 60) return "#7fd7bb";
  if (score >= 50) return "#ffd02f";
  if (score >= 40) return "#ffab66";
  return "#ff9999";
}

export default function RegionMap({
  scores,
  selectedCode,
  onSelect,
}: {
  scores: RegionScore[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
}) {
  const byCode = useMemo(() => new Map(scores.map((s) => [s.regionCode, s])), [scores]);

  const layout = useMemo(() => {
    if (!geo.regions.length) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const r of geo.regions) {
      for (const ring of r.rings) {
        for (const [x, y] of ring) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    // 위도에 따른 경도 축척 보정 (한반도 중위도 근사)
    const midLat = (minY + maxY) / 2;
    const xScale = Math.cos((midLat * Math.PI) / 180);
    const W = 420;
    const spanX = (maxX - minX) * xScale;
    const spanY = maxY - minY;
    const H = (W * spanY) / spanX;
    const project = ([lon, lat]: [number, number]): [number, number] => [
      ((lon - minX) * xScale / spanX) * W,
      H - ((lat - minY) / spanY) * H,
    ];
    const paths = geo.regions.map((r) => ({
      code: r.code,
      name: r.name,
      d: r.rings
        .map((ring) => "M" + ring.map((p) => project(p).map((v) => v.toFixed(1)).join(",")).join("L") + "Z")
        .join(" "),
      // 라벨 위치: 가장 큰 링의 bbox 중심 + 겹침 지역 수동 보정
      label: (() => {
        const biggest = [...r.rings].sort((a, b) => b.length - a.length)[0] ?? [];
        if (!biggest.length) return null;
        let bMinX = Infinity, bMinY = Infinity, bMaxX = -Infinity, bMaxY = -Infinity;
        for (const [x, y] of biggest) {
          if (x < bMinX) bMinX = x;
          if (x > bMaxX) bMaxX = x;
          if (y < bMinY) bMinY = y;
          if (y > bMaxY) bMaxY = y;
        }
        // 서울을 감싸는 경기, 대구를 감싸는 경북 등은 중심이 다른 시도 위에
        // 떨어지므로 경위도 기준으로 라벨을 이동한다.
        const nudge: Record<string, [number, number]> = {
          gyeonggi: [0.25, 0.35],   // 북동쪽(포천 방면)
          gyeongbuk: [0.15, 0.35],  // 북쪽(안동 방면)
          gyeongnam: [-0.25, 0.1],
          chungnam: [-0.15, -0.1],
          incheon: [-0.05, -0.12],
        };
        const [nx, ny] = nudge[r.code] ?? [0, 0];
        return project([(bMinX + bMaxX) / 2 + nx, (bMinY + bMaxY) / 2 + ny]);
      })(),
    }));
    return { W, H, paths };
  }, []);

  if (!layout) {
    return (
      <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <p className="text-sm font-semibold text-slate-600">지도 데이터 미수집</p>
        <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-500">
          .env.local에 <code className="rounded bg-slate-200 px-1">VWORLD_API_KEY</code>를 추가하고{" "}
          <code className="rounded bg-slate-200 px-1">pnpm map:fetch</code>를 실행하면 VWorld 시도
          행정경계 기반 지도가 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${layout.W} ${layout.H}`}
        className="w-full"
        role="img"
        aria-label="시도별 입지 적합도 지도"
      >
        {layout.paths.map((p) => {
          const s = byCode.get(p.code);
          const active = selectedCode === p.code;
          const inScope = !!s;
          // React 19의 <title>은 단일 문자열 자식만 허용 — 복수 텍스트 노드는
          // SSR/클라이언트 하이드레이션 불일치를 일으킨다.
          const tooltip = s
            ? `${p.name} · ${s.totalScore === null ? "데이터 부족" : s.totalScore.toFixed(1) + "점"} · ${DECISION_LABELS[s.decision]}${s.rank ? ` · ${s.rank}위` : ""}`
            : `${p.name} · 비교 대상에서 제외됨`;
          return (
            <path
              key={p.code}
              d={p.d}
              fill={inScope ? fillColor(s!.totalScore) : "#f1f5f9"}
              stroke={active ? "#0f172a" : "#ffffff"}
              strokeWidth={active ? 2.5 : 1}
              opacity={inScope ? 1 : 0.5}
              className="cursor-pointer transition-opacity hover:opacity-80"
              onClick={() => onSelect(p.code)}
              aria-label={tooltip}
            >
              <title>{tooltip}</title>
            </path>
          );
        })}
        {layout.paths.map((p) => {
          const s = byCode.get(p.code);
          if (!p.label || !s) return null;
          return (
            <text
              key={`label-${p.code}`}
              x={p.label[0]}
              y={p.label[1]}
              textAnchor="middle"
              className="pointer-events-none select-none"
              fontSize="11"
              fontWeight="700"
              fill="#0f172a"
            >
              {s.regionName}
              {s.rank !== null && s.rank <= 3 ? ` ${s.rank}위` : ""}
            </text>
          );
        })}
      </svg>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-steel">
        <span className="font-semibold text-ink">종합 점수</span>
        {[
          ["70 이상", "#00b473"],
          ["60 이상", "#7fd7bb"],
          ["50 이상", "#ffd02f"],
          ["40 이상", "#ffab66"],
          ["40 미만", "#ff9999"],
          ["데이터 부족", "#eef0f3"],
        ].map(([label, color]) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
      {geo.source && (
        <p className="mt-2 text-[11px] text-stone2">
          행정경계: VWorld 시도 경계 데이터 · {geo.source.fetchedAt.slice(0, 10)} 수집 · 표시용 단순화
        </p>
      )}
    </div>
  );
}
