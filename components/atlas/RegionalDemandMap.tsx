"use client";

import { useMemo } from "react";
import sidoGeo from "@/data/processed/sido-geo.json";
import { regionName, type AtlasDictionary, type Locale } from "@/lib/i18n";
import type { RegionProfile } from "@/lib/types";

type Ring = [number, number][];
type GeoRegion = { code: string; name: string; rings: Ring[] };
type SidoGeo = {
  source: { title: string; fetchedAt: string } | null;
  regions: GeoRegion[];
};

const geo = sidoGeo as unknown as SidoGeo;

function demandValue(region: RegionProfile | undefined): number | null {
  return region?.metrics.electricity_use_mwh?.value ?? null;
}

function fillFor(value: number | null, max: number): string {
  if (value === null || max <= 0) return "#e8edf1";
  const ratio = Math.log1p(value) / Math.log1p(max);
  if (ratio >= 0.9) return "#12283f";
  if (ratio >= 0.78) return "#1f4d66";
  if (ratio >= 0.66) return "#2f7188";
  if (ratio >= 0.54) return "#63a1ad";
  if (ratio >= 0.42) return "#a7ced0";
  return "#d8e8e5";
}

export default function RegionalDemandMap({
  regions,
  selectedCode,
  onSelect,
  locale,
  dictionary,
}: {
  regions: RegionProfile[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
  locale: Locale;
  dictionary: AtlasDictionary;
}) {
  const byCode = useMemo(
    () => new Map(regions.map((region) => [region.regionCode, region])),
    [regions],
  );
  const maxDemand = useMemo(
    () => Math.max(0, ...regions.map((region) => demandValue(region) ?? 0)),
    [regions],
  );

  const layout = useMemo(() => {
    if (!geo.regions.length) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const region of geo.regions) {
      for (const ring of region.rings) {
        for (const [x, y] of ring) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }

    const midLat = (minY + maxY) / 2;
    const xScale = Math.cos((midLat * Math.PI) / 180);
    const width = 420;
    const spanX = (maxX - minX) * xScale;
    const spanY = maxY - minY;
    const height = (width * spanY) / spanX;
    const project = ([lon, lat]: [number, number]): [number, number] => [
      (((lon - minX) * xScale) / spanX) * width,
      height - ((lat - minY) / spanY) * height,
    ];

    const paths = geo.regions.map((region) => {
      const biggest = [...region.rings].sort((a, b) => b.length - a.length)[0] ?? [];
      let label: [number, number] | null = null;
      if (biggest.length) {
        let ringMinX = Infinity;
        let ringMinY = Infinity;
        let ringMaxX = -Infinity;
        let ringMaxY = -Infinity;
        for (const [x, y] of biggest) {
          ringMinX = Math.min(ringMinX, x);
          ringMaxX = Math.max(ringMaxX, x);
          ringMinY = Math.min(ringMinY, y);
          ringMaxY = Math.max(ringMaxY, y);
        }
        const nudge: Record<string, [number, number]> = {
          gyeonggi: [0.25, 0.35],
          gyeongbuk: [0.15, 0.35],
          gyeongnam: [-0.25, 0.1],
          chungnam: [-0.15, -0.1],
          incheon: [-0.05, -0.12],
        };
        const [nx, ny] = nudge[region.code] ?? [0, 0];
        label = project([
          (ringMinX + ringMaxX) / 2 + nx,
          (ringMinY + ringMaxY) / 2 + ny,
        ]);
      }

      return {
        ...region,
        label,
        d: region.rings
          .map(
            (ring) =>
              `M${ring
                .map((point) => project(point).map((value) => value.toFixed(1)).join(","))
                .join("L")}Z`,
          )
          .join(" "),
      };
    });
    return { width, height, paths };
  }, []);

  if (!layout) return null;

  return (
    <div>
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="mx-auto w-full max-w-[520px]"
        role="img"
        aria-label={dictionary.mapAria}
      >
        {layout.paths.map((path) => {
          const region = byCode.get(path.code);
          const value = demandValue(region);
          const name = regionName(path.code, path.name, locale);
          const tooltip =
            value === null
              ? `${name} · ${dictionary.noValue}`
              : `${name} · ${new Intl.NumberFormat(locale).format(value)} MWh`;
          const active = selectedCode === path.code;
          return (
            <path
              key={path.code}
              d={path.d}
              fill={fillFor(value, maxDemand)}
              stroke={active ? "#f4b942" : "#ffffff"}
              strokeWidth={active ? 3 : 1.25}
              className="cursor-pointer transition-opacity hover:opacity-80 focus:outline-none"
              onClick={() => onSelect(path.code)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(path.code);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={tooltip}
            >
              <title>{tooltip}</title>
            </path>
          );
        })}
        {layout.paths.map((path) => {
          const region = byCode.get(path.code);
          if (!path.label || !region) return null;
          return (
            <text
              key={`label-${path.code}`}
              x={path.label[0]}
              y={path.label[1]}
              textAnchor="middle"
              className="pointer-events-none select-none"
              fontSize="10"
              fontWeight="650"
              fill="#102231"
            >
              {regionName(path.code, path.name, locale)}
            </text>
          );
        })}
      </svg>
      <div className="mt-4 flex items-center justify-center gap-3 text-xs text-slate2">
        <span>{dictionary.lowerDemand}</span>
        <span
          className="h-2.5 w-36 rounded-full"
          style={{ background: "linear-gradient(90deg, #d8e8e5, #63a1ad, #12283f)" }}
          aria-hidden
        />
        <span>{dictionary.higherDemand}</span>
      </div>
      {geo.source && (
        <p className="mt-3 text-center text-[11px] text-stone2">
          {dictionary.boundarySource} · {geo.source.fetchedAt.slice(0, 10)}
        </p>
      )}
    </div>
  );
}
