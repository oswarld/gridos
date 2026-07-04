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

/** 점수 → 채색 (rose→amber→emerald), null → 회색 */
function fillColor(score: number | null): string {
  if (score === null) return "#e2e8f0";
  if (score >= 70) return "#10b981";
  if (score >= 60) return "#6ee7b7";
  if (score >= 50) return "#fbbf24";
  if (score >= 40) return "#fb923c";
  return "#f43f5e";
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
      // 라벨 위치: 가장 큰 링의 무게중심 근사
      label: (() => {
        const biggest = [...r.rings].sort((a, b) => b.length - a.length)[0] ?? [];
        if (!biggest.length) return null;
        const cx = biggest.reduce((s, p) => s + p[0], 0) / biggest.length;
        const cy = biggest.reduce((s, p) => s + p[1], 0) / biggest.length;
        return project([cx, cy]);
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
            >
              <title>
                {p.name}
                {s
                  ? ` — ${s.totalScore === null ? "데이터 부족" : s.totalScore.toFixed(1) + "점"} · ${DECISION_LABELS[s.decision]}${s.rank ? ` · ${s.rank}위` : ""}`
                  : " — 비교 대상에서 제외됨"}
              </title>
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
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
        <span className="font-semibold text-slate-600">종합 점수</span>
        {[
          ["70+", "#10b981"],
          ["60+", "#6ee7b7"],
          ["50+", "#fbbf24"],
          ["40+", "#fb923c"],
          ["<40", "#f43f5e"],
          ["데이터 부족", "#e2e8f0"],
        ].map(([label, color]) => (
          <span key={label} className="inline-flex items-center gap-1">
            <span className="h-3 w-3 rounded-sm" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
      {geo.source && (
        <p className="mt-1 text-[10px] text-slate-400">
          행정경계: {geo.source.title} ({geo.source.fetchedAt.slice(0, 10)} 수집, 표시용 단순화)
        </p>
      )}
    </div>
  );
}
