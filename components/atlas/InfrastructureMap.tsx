"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, {
  type GeoJSONSource,
  type Map as MapLibreMap,
  type MapLayerMouseEvent,
} from "maplibre-gl";
import type {
  AtlasFacility,
  AtlasLinearFeature,
  CountryCode,
  InfrastructureLayer,
} from "@/lib/atlas-types";
import type { Locale } from "@/lib/i18n";
import type {
  DetailedInfrastructureLine,
  DetailedInfrastructurePoint,
  DetailMapFilters,
} from "@/lib/map-detail-types";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";
const FACILITY_SOURCE = "gridos-facilities";
const LINE_SOURCE = "gridos-lines";
const FACILITY_LAYER = "gridos-facility-points";
const FACILITY_HALO_LAYER = "gridos-facility-halo";
const TRANSMISSION_LAYER = "gridos-transmission";
const PIPELINE_LAYER = "gridos-pipeline";
const SELECTED_LINE_LAYER = "gridos-selected-line";
const DENSITY_LAYER = "gridos-density";

const COUNTRY_BOUNDS: Record<
  CountryCode,
  [[number, number], [number, number]]
> = {
  KR: [
    [124.5, 33],
    [132, 39.3],
  ],
  JP: [
    [123, 24],
    [146, 46],
  ],
  TW: [
    [119, 21.5],
    [123, 25.8],
  ],
  US: [
    [-126, 24],
    [-65, 50],
  ],
};

type GeoFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry:
      | { type: "Point"; coordinates: [number, number] }
      | { type: "LineString"; coordinates: [number, number][] }
      | { type: "MultiLineString"; coordinates: [number, number][][] };
    properties: {
      id: string;
      country: CountryCode;
      kind: InfrastructureLayer;
      name: string;
      selected: number;
      operator?: string;
      detail?: string;
      capacityMw?: number;
      fuel?: string;
      networkCount?: number;
      ixCount?: number;
      sourceLabel?: string;
      sourceUrl?: string;
    };
  }>;
};

function facilityCollection(
  facilities: AtlasFacility[],
  countryFilter: CountryCode | "ALL",
  activeLayers: Set<InfrastructureLayer>,
  selectedId: string | null,
  detailPoints: DetailedInfrastructurePoint[],
  filters: DetailMapFilters,
): GeoFeatureCollection {
  const detailed = detailPoints.filter((point) => {
    if (!activeLayers.has(point.kind)) return false;
    if (point.kind === "power_plant") {
      if (
        filters.minimumCapacityMw > 0 &&
        (point.capacityMw === undefined || point.capacityMw < filters.minimumCapacityMw)
      ) {
        return false;
      }
      if (filters.generationFuel !== "all" && point.fuel !== filters.generationFuel) {
        return false;
      }
      if (!filters.includePlanned && point.planned) return false;
    }
    if (point.kind === "data_center" || point.kind === "network_hub") {
      if (filters.networkMode === "ix" && (point.ixCount ?? 0) < 1) return false;
      if (filters.networkMode === "net50" && (point.networkCount ?? 0) < 50) return false;
      if (filters.networkMode === "net200" && (point.networkCount ?? 0) < 200) return false;
    }
    return true;
  });
  return {
    type: "FeatureCollection",
    features: [
      ...facilities
      .filter(
        (facility) =>
          activeLayers.has(facility.kind) &&
          (countryFilter === "ALL" || facility.country === countryFilter),
      )
      .map((facility) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: facility.coordinates,
        },
        properties: {
          id: facility.id,
          country: facility.country,
          kind: facility.kind,
          name: facility.name,
          selected: facility.id === selectedId ? 1 : 0,
        },
      })),
      ...detailed.map((point) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: point.coordinates,
        },
        properties: {
          id: point.id,
          country: point.country,
          kind: point.kind,
          name: point.name,
          selected: point.id === selectedId ? 1 : 0,
          operator: point.operator,
          detail:
            point.kind === "power_plant"
              ? `${point.capacityMw ?? "—"} MW · ${point.fuel ?? "other"}`
              : `${point.networkCount ?? 0} networks · ${point.ixCount ?? 0} IX`,
          capacityMw: point.capacityMw,
          fuel: point.fuel,
          networkCount: point.networkCount,
          ixCount: point.ixCount,
          sourceLabel: point.sourceLabel,
          sourceUrl: point.sourceUrl,
        },
      })),
    ],
  };
}

function lineCollection(
  lines: AtlasLinearFeature[],
  countryFilter: CountryCode | "ALL",
  activeLayers: Set<InfrastructureLayer>,
  selectedId: string | null,
  detailLines: DetailedInfrastructureLine[],
  includePlanned: boolean,
): GeoFeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      ...lines
      .filter(
        (line) =>
          activeLayers.has(line.kind) &&
          (countryFilter === "ALL" || line.country === countryFilter),
      )
      .map((line) => ({
        type: "Feature" as const,
        geometry: {
          type: "LineString" as const,
          coordinates: line.coordinates,
        },
        properties: {
          id: line.id,
          country: line.country,
          kind: line.kind,
          name: line.name,
          selected: line.id === selectedId ? 1 : 0,
          operator: line.operator,
          detail: line.voltage
            ? `${line.voltage} V`
            : line.substance
              ? line.substance
              : undefined,
        },
      })),
      ...detailLines
        .filter(
          (line) =>
            activeLayers.has(line.kind) && (includePlanned || !line.planned),
        )
        .map((line) => ({
          type: "Feature" as const,
          geometry: line.segments?.length
            ? {
                type: "MultiLineString" as const,
                coordinates: line.segments,
              }
            : {
                type: "LineString" as const,
                coordinates: line.coordinates,
              },
          properties: {
            id: line.id,
            country: line.country,
            kind: line.kind,
            name: line.name,
            selected: line.id === selectedId ? 1 : 0,
            operator: line.operator,
            detail: line.voltageKv
              ? `${line.voltageKv} kV`
              : line.substance,
            sourceLabel: line.sourceLabel,
            sourceUrl: line.sourceUrl,
          },
        })),
    ],
  };
}

function moveToCountry(
  map: MapLibreMap,
  countryFilter: CountryCode | "ALL",
  animate: boolean,
) {
  if (countryFilter === "ALL") {
    const camera = { center: [180, 35] as [number, number], zoom: 1.35 };
    if (animate) {
      map.easeTo({ ...camera, duration: 850 });
    } else {
      map.jumpTo(camera);
    }
    return;
  }
  map.fitBounds(COUNTRY_BOUNDS[countryFilter], {
    padding: { top: 68, right: 54, bottom: 54, left: 54 },
    duration: animate ? 850 : 0,
    maxZoom: countryFilter === "TW" ? 7 : countryFilter === "KR" ? 6.3 : 5,
  });
}

function addAtlasLayers(map: MapLibreMap, facilities: GeoFeatureCollection, lines: GeoFeatureCollection) {
  map.addSource(FACILITY_SOURCE, {
    type: "geojson",
    data: facilities as never,
  });
  map.addSource(LINE_SOURCE, {
    type: "geojson",
    data: lines as never,
  });

  map.addLayer({
    id: DENSITY_LAYER,
    type: "heatmap",
    source: FACILITY_SOURCE,
    maxzoom: 8,
    layout: { visibility: "none" },
    paint: {
      "heatmap-weight": [
        "interpolate",
        ["linear"],
        ["coalesce", ["get", "capacityMw"], ["get", "networkCount"], 1],
        0,
        0.15,
        100,
        0.5,
        1000,
        1,
      ],
      "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 1, 0.45, 7, 1.5],
      "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 1, 9, 7, 30],
      "heatmap-opacity": 0.52,
      "heatmap-color": [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        0,
        "rgba(37,99,235,0)",
        0.25,
        "rgba(59,130,246,.38)",
        0.55,
        "rgba(20,184,166,.58)",
        0.78,
        "rgba(245,158,11,.68)",
        1,
        "rgba(220,38,38,.78)",
      ],
    },
  });

  map.addLayer({
    id: TRANSMISSION_LAYER,
    type: "line",
    source: LINE_SOURCE,
    filter: ["==", ["get", "kind"], "transmission"],
    paint: {
      "line-color": "#3979bd",
      "line-width": ["interpolate", ["linear"], ["zoom"], 2, 0.65, 8, 2.8],
      "line-opacity": 0.68,
    },
  });
  map.addLayer({
    id: PIPELINE_LAYER,
    type: "line",
    source: LINE_SOURCE,
    filter: ["==", ["get", "kind"], "pipeline"],
    paint: {
      "line-color": "#dc6b42",
      "line-width": ["interpolate", ["linear"], ["zoom"], 2, 0.8, 8, 3],
      "line-opacity": 0.78,
      "line-dasharray": [2.2, 1.5],
    },
  });
  map.addLayer({
    id: SELECTED_LINE_LAYER,
    type: "line",
    source: LINE_SOURCE,
    filter: ["==", ["get", "selected"], 1],
    paint: {
      "line-color": "#102231",
      "line-width": ["interpolate", ["linear"], ["zoom"], 2, 4, 8, 7],
      "line-opacity": 0.95,
    },
  });
  map.addLayer({
    id: FACILITY_HALO_LAYER,
    type: "circle",
    source: FACILITY_SOURCE,
    filter: ["==", ["get", "selected"], 1],
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 12, 8, 19],
      "circle-color": "#ffffff",
      "circle-opacity": 0.94,
      "circle-stroke-color": "#102231",
      "circle-stroke-width": 2.5,
    },
  });
  map.addLayer({
    id: FACILITY_LAYER,
    type: "circle",
    source: FACILITY_SOURCE,
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        2,
        ["match", ["get", "kind"], "network_hub", 3.4, "data_center", 2.8, 3],
        8,
        ["match", ["get", "kind"], "network_hub", 10, "data_center", 9, 11],
      ],
      "circle-color": [
        "match",
        ["get", "kind"],
        "power_plant",
        "#f1b931",
        "data_center",
        "#20a49c",
        "network_hub",
        "#bf5a9c",
        "#102231",
      ],
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1.8,
      "circle-opacity": 0.96,
    },
  });
}

export default function InfrastructureMap({
  facilities,
  linearFeatures,
  countryFilter,
  activeLayers,
  selectedId,
  onSelect,
  ariaLabel,
  locale,
  countryName,
  labels,
  detailPoints = [],
  detailLines = [],
  detailFilters,
}: {
  facilities: AtlasFacility[];
  linearFeatures: AtlasLinearFeature[];
  countryFilter: CountryCode | "ALL";
  activeLayers: Set<InfrastructureLayer>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  ariaLabel: string;
  attribution: string;
  locale: Locale;
  countryName: string;
  labels: {
    countryDetail: string;
    allOverview: string;
    zoomIn: string;
    zoomOut: string;
    resetView: string;
  };
  detailPoints?: DetailedInfrastructurePoint[];
  detailLines?: DetailedInfrastructureLine[];
  detailFilters: DetailMapFilters;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const facilityDataRef = useRef<GeoFeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });
  const lineDataRef = useRef<GeoFeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const facilityData = useMemo(
    () =>
      facilityCollection(
        facilities,
        countryFilter,
        activeLayers,
        selectedId,
        detailPoints,
        detailFilters,
      ),
    [activeLayers, countryFilter, detailFilters, detailPoints, facilities, selectedId],
  );
  const lineData = useMemo(
    () =>
      lineCollection(
        linearFeatures,
        countryFilter,
        activeLayers,
        selectedId,
        detailLines,
        detailFilters.includePlanned,
      ),
    [
      activeLayers,
      countryFilter,
      detailFilters.includePlanned,
      detailLines,
      linearFeatures,
      selectedId,
    ],
  );
  facilityDataRef.current = facilityData;
  lineDataRef.current = lineData;
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [180, 35],
      zoom: 1.35,
      minZoom: 1,
      maxZoom: 13,
      attributionControl: {},
      renderWorldCopies: true,
      cooperativeGestures: false,
    });
    mapRef.current = map;
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }),
      "top-right",
    );
    map.addControl(new maplibregl.ScaleControl({ unit: "metric", maxWidth: 110 }), "bottom-left");

    const selectFeature = (event: MapLayerMouseEvent) => {
      const id = event.features?.[0]?.properties?.id;
      if (typeof id === "string") onSelectRef.current(id);
    };
    const setPointer = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const clearPointer = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("load", () => {
      addAtlasLayers(map, facilityDataRef.current, lineDataRef.current);
      for (const layer of [
        FACILITY_LAYER,
        FACILITY_HALO_LAYER,
        TRANSMISSION_LAYER,
        PIPELINE_LAYER,
        SELECTED_LINE_LAYER,
      ]) {
        map.on("click", layer, selectFeature);
        map.on("mouseenter", layer, setPointer);
        map.on("mouseleave", layer, clearPointer);
      }
      moveToCountry(map, countryFilter, false);
      setReady(true);
    });
    map.on("error", (event) => {
      if (!map.loaded() && event.error) setFailed(true);
    });

    return () => {
      setReady(false);
      map.remove();
      mapRef.current = null;
    };
    // The map instance is created exactly once; current data is supplied through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const facilitiesSource = map.getSource(FACILITY_SOURCE) as GeoJSONSource | undefined;
    const linesSource = map.getSource(LINE_SOURCE) as GeoJSONSource | undefined;
    facilitiesSource?.setData(facilityData as never);
    linesSource?.setData(lineData as never);
  }, [facilityData, lineData, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !map.getLayer(DENSITY_LAYER)) return;
    map.setLayoutProperty(
      DENSITY_LAYER,
      "visibility",
      detailFilters.showDensity ? "visible" : "none",
    );
  }, [detailFilters.showDensity, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    moveToCountry(map, countryFilter, true);
  }, [countryFilter, ready]);

  const currentLabel =
    countryFilter === "ALL" ? labels.allOverview : `${countryName} · ${labels.countryDetail}`;

  return (
    <div
      className="relative overflow-hidden rounded-[22px] border border-[#102231]/10 bg-[#e8ebe7]"
      aria-label={ariaLabel}
    >
      <div ref={containerRef} className="h-[620px] w-full md:h-[720px]" />
      <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[calc(100%-8rem)] rounded-full border border-[#102231]/10 bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
        <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-[#43535d]">
          {currentLabel}
        </p>
      </div>
      {!ready && !failed && (
        <div className="absolute inset-0 grid place-items-center bg-[#edf0ec]">
          <div className="text-center">
            <span className="mx-auto block h-6 w-6 animate-spin rounded-full border-2 border-[#102231]/20 border-t-[#277167]" />
            <p className="mt-3 text-xs font-semibold text-[#607079]">
              {locale === "ko"
                ? "벡터 지도를 불러오는 중입니다"
                : locale === "ja"
                  ? "ベクター地図を読み込んでいます"
                  : locale === "zh-CN"
                    ? "正在加载矢量地图"
                    : "Loading vector map"}
            </p>
          </div>
        </div>
      )}
      {failed && (
        <div className="absolute inset-0 grid place-items-center bg-[#edf0ec] p-8 text-center">
          <div>
            <p className="text-sm font-semibold text-[#102231]">
              {locale === "ko"
                ? "베이스맵을 불러오지 못했습니다."
                : locale === "ja"
                  ? "ベースマップを読み込めませんでした。"
                  : locale === "zh-CN"
                    ? "无法加载底图。"
                    : "The basemap could not be loaded."}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#607079]">
              {locale === "ko"
                ? "네트워크 연결을 확인한 뒤 새로고침해 주세요."
                : locale === "ja"
                  ? "ネットワーク接続を確認して再読み込みしてください。"
                  : locale === "zh-CN"
                    ? "请检查网络连接后刷新页面。"
                    : "Check the network connection and refresh the page."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
