"use client";

import { useEffect, useMemo, useState } from "react";
import atlasJson from "@/data/processed/atlas-public.json";
import { ATLAS_UI } from "@/lib/atlas-i18n";
import {
  COUNTRY_CODES,
  INFRASTRUCTURE_LAYERS,
  type AtlasEntity,
  type AtlasFacility,
  type AtlasLinearFeature,
  type CountryCode,
  type InfrastructureLayer,
  type ListedSecurity,
  type PublicAtlas,
} from "@/lib/atlas-types";
import { DICTIONARIES, LOCALES, numberLocale, type Locale } from "@/lib/i18n";
import type {
  CountryInfrastructureDetail,
  DetailedInfrastructureLine,
  DetailedInfrastructurePoint,
  DetailMapFilters,
  GenerationFuel,
} from "@/lib/map-detail-types";
import InfrastructureMap from "./InfrastructureMap";

const atlas = atlasJson as PublicAtlas;

const LAYER_STYLES: Record<
  InfrastructureLayer,
  { color: string; marker: "circle" | "square" | "diamond" | "line" | "dash" }
> = {
  power_plant: { color: "#a855f7", marker: "circle" },
  data_center: { color: "#22b863", marker: "square" },
  network_hub: { color: "#8b8df8", marker: "diamond" },
  transmission: { color: "#d92c71", marker: "line" },
  pipeline: { color: "#f59e0b", marker: "dash" },
};

const GENERATION_FUELS: GenerationFuel[] = [
  "solar",
  "gas",
  "hydro",
  "wind",
  "oil",
  "biomass",
  "storage",
  "coal",
  "geothermal",
  "nuclear",
  "other",
];

const DETAIL_COPY: Record<
  Locale,
  {
    controls: string;
    controlsHint: string;
    capacity: string;
    all: string;
    network: string;
    ixOnly: string;
    networks50: string;
    networks200: string;
    includePlanned: string;
    density: string;
    loading: string;
    loadFailed: string;
    publicRecords: string;
    exactSource: string;
    networks: string;
    exchanges: string;
    fuels: Record<GenerationFuel, string>;
  }
> = {
  ko: {
    controls: "지도 레이어 & 필터 제어",
    controlsHint: "원하는 레이어를 켜거나 발전·네트워크 조건을 조절하세요.",
    capacity: "발전 용량",
    all: "전체",
    network: "데이터센터",
    ixOnly: "IX 연결",
    networks50: "네트워크 50+",
    networks200: "네트워크 200+",
    includePlanned: "계획 시설 포함",
    density: "밀도 음영",
    loading: "국가 상세 데이터를 불러오는 중",
    loadFailed: "상세 데이터를 불러오지 못해 대표 스냅샷을 표시합니다.",
    publicRecords: "공개 상세 레코드",
    exactSource: "원문 공개 위치",
    networks: "연결 네트워크",
    exchanges: "IX 수",
    fuels: {
      solar: "태양광",
      gas: "가스",
      hydro: "수력",
      wind: "풍력",
      oil: "석유",
      biomass: "바이오매스",
      storage: "저장",
      coal: "석탄",
      geothermal: "지열",
      nuclear: "원자력",
      other: "기타",
    },
  },
  en: {
    controls: "Map layers & filters",
    controlsHint: "Combine layers and refine generation or network conditions.",
    capacity: "Generation capacity",
    all: "All",
    network: "Data centers",
    ixOnly: "IX connected",
    networks50: "50+ networks",
    networks200: "200+ networks",
    includePlanned: "Include planned",
    density: "Density heatmap",
    loading: "Loading national detail records",
    loadFailed: "Detail data is unavailable; showing the representative snapshot.",
    publicRecords: "public detail records",
    exactSource: "Source-published location",
    networks: "Networks",
    exchanges: "IX count",
    fuels: {
      solar: "Solar",
      gas: "Gas",
      hydro: "Hydro",
      wind: "Wind",
      oil: "Oil",
      biomass: "Biomass",
      storage: "Storage",
      coal: "Coal",
      geothermal: "Geothermal",
      nuclear: "Nuclear",
      other: "Other",
    },
  },
  "zh-CN": {
    controls: "地图图层与筛选",
    controlsHint: "组合图层，并调整发电或网络条件。",
    capacity: "发电容量",
    all: "全部",
    network: "数据中心",
    ixOnly: "已连接 IX",
    networks50: "网络 50+",
    networks200: "网络 200+",
    includePlanned: "包含规划设施",
    density: "密度热图",
    loading: "正在加载全国详细记录",
    loadFailed: "详细数据不可用，正在显示代表性快照。",
    publicRecords: "条公开详细记录",
    exactSource: "来源公开位置",
    networks: "连接网络",
    exchanges: "IX 数量",
    fuels: {
      solar: "太阳能",
      gas: "燃气",
      hydro: "水电",
      wind: "风电",
      oil: "石油",
      biomass: "生物质",
      storage: "储能",
      coal: "煤炭",
      geothermal: "地热",
      nuclear: "核电",
      other: "其他",
    },
  },
  ja: {
    controls: "地図レイヤーとフィルター",
    controlsHint: "レイヤーを組み合わせ、発電・ネットワーク条件を調整します。",
    capacity: "発電容量",
    all: "すべて",
    network: "データセンター",
    ixOnly: "IX 接続",
    networks50: "ネットワーク 50+",
    networks200: "ネットワーク 200+",
    includePlanned: "計画施設を含む",
    density: "密度ヒートマップ",
    loading: "全国詳細データを読み込み中",
    loadFailed: "詳細データを取得できないため代表スナップショットを表示します。",
    publicRecords: "件の公開詳細レコード",
    exactSource: "原典公開位置",
    networks: "接続ネットワーク",
    exchanges: "IX 数",
    fuels: {
      solar: "太陽光",
      gas: "ガス",
      hydro: "水力",
      wind: "風力",
      oil: "石油",
      biomass: "バイオマス",
      storage: "蓄電",
      coal: "石炭",
      geothermal: "地熱",
      nuclear: "原子力",
      other: "その他",
    },
  },
};

const CONFIDENTIAL_LABEL: Record<Locale, string> = {
  ko: "기밀",
  en: "Confidential",
  "zh-CN": "机密",
  ja: "機密",
};

type SelectedRecord =
  | { type: "facility"; record: AtlasFacility }
  | { type: "linear"; record: AtlasLinearFeature }
  | { type: "detail-point"; record: DetailedInfrastructurePoint }
  | { type: "detail-line"; record: DetailedInfrastructureLine }
  | null;

function uniqueSecurities(
  entityIds: string[],
  entityById: Map<string, AtlasEntity>,
): { entity: AtlasEntity; security: ListedSecurity }[] {
  const queue = [...entityIds];
  const visited = new Set<string>();
  const found: { entity: AtlasEntity; security: ListedSecurity }[] = [];
  while (queue.length) {
    const id = queue.shift();
    if (!id || visited.has(id)) continue;
    visited.add(id);
    const entity = entityById.get(id);
    if (!entity) continue;
    for (const security of entity.securities ?? []) found.push({ entity, security });
    queue.push(...(entity.parentEntityIds ?? []));
  }
  const unique = new Map<string, { entity: AtlasEntity; security: ListedSecurity }>();
  for (const row of found) {
    unique.set(`${row.security.exchange}:${row.security.ticker}`, row);
  }
  return [...unique.values()];
}

function LayerMarker({ layer }: { layer: InfrastructureLayer }) {
  const style = LAYER_STYLES[layer];
  if (style.marker === "line" || style.marker === "dash") {
    return (
      <span
        className="block h-[3px] w-7 rounded-full"
        style={{
          background:
            style.marker === "dash"
              ? `repeating-linear-gradient(90deg, ${style.color} 0 7px, transparent 7px 11px)`
              : style.color,
        }}
      />
    );
  }
  return (
    <span
      className={`block h-3.5 w-3.5 ${
        style.marker === "circle"
          ? "rounded-full"
          : style.marker === "diamond"
            ? "rotate-45 rounded-[2px]"
            : "rounded-[3px]"
      }`}
      style={{ background: style.color }}
    />
  );
}

function ConfidentialBadge({
  locale,
  description,
}: {
  locale: Locale;
  description: string;
}) {
  return (
    <span
      title={description}
      aria-label={`${CONFIDENTIAL_LABEL[locale]} — ${description}`}
      className="inline-flex rounded-full bg-[#fff4c4] px-2.5 py-1 text-[10px] font-semibold text-[#746019]"
    >
      [{CONFIDENTIAL_LABEL[locale]}]
    </span>
  );
}

function externalTickerUrl(security: ListedSecurity): string {
  if (security.exchange === "Nasdaq") {
    return `https://www.nasdaq.com/market-activity/stocks/${security.ticker.toLowerCase()}`;
  }
  if (security.exchange === "NYSE") {
    return `https://www.nyse.com/quote/XNYS:${security.ticker}`;
  }
  return atlas.sources.find((source) => source.id === security.sourceId)?.url ?? "#";
}

export default function AtlasDashboard({ locale }: { locale: Locale }) {
  const dictionary = DICTIONARIES[locale];
  const copy = ATLAS_UI[locale];
  const detailCopy = DETAIL_COPY[locale];
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const [countryFilter, setCountryFilter] = useState<CountryCode | "ALL">("ALL");
  const [balanceCountry, setBalanceCountry] = useState<CountryCode>("KR");
  const [activeLayers, setActiveLayers] = useState<Set<InfrastructureLayer>>(
    new Set(INFRASTRUCTURE_LAYERS),
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    atlas.facilities[0]?.id ?? null,
  );
  const [detailByCountry, setDetailByCountry] = useState<
    Partial<Record<CountryCode, CountryInfrastructureDetail>>
  >({});
  const [detailLoading, setDetailLoading] = useState<CountryCode | null>(null);
  const [detailError, setDetailError] = useState<CountryCode | null>(null);
  const [detailFilters, setDetailFilters] = useState<DetailMapFilters>({
    minimumCapacityMw: 100,
    generationFuel: "all",
    networkMode: "all",
    includePlanned: false,
    showDensity: false,
  });
  const detailData =
    countryFilter === "ALL" ? undefined : detailByCountry[countryFilter];
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(numberLocale(locale), {
        maximumFractionDigits: 1,
      }),
    [locale],
  );
  const compactFormatter = useMemo(
    () =>
      new Intl.NumberFormat(numberLocale(locale), {
        notation: "compact",
        maximumFractionDigits: 1,
      }),
    [locale],
  );
  const entityById = useMemo(
    () => new Map(atlas.entities.map((entity) => [entity.id, entity])),
    [],
  );
  const facilityById = useMemo(
    () => new Map(atlas.facilities.map((facility) => [facility.id, facility])),
    [],
  );
  const sourceById = useMemo(
    () => new Map(atlas.sources.map((source) => [source.id, source])),
    [],
  );
  const detailPointById = useMemo(
    () => new Map((detailData?.points ?? []).map((point) => [point.id, point])),
    [detailData],
  );
  const detailLineById = useMemo(
    () => new Map((detailData?.lines ?? []).map((line) => [line.id, line])),
    [detailData],
  );

  useEffect(() => {
    document.documentElement.lang = dictionary.htmlLang;
  }, [dictionary.htmlLang]);

  useEffect(() => {
    if (countryFilter === "ALL" || detailByCountry[countryFilter]) return;
    const country = countryFilter;
    const controller = new AbortController();
    setDetailLoading(country);
    setDetailError(null);
    fetch(`${basePath}/data/detail/${country.toLowerCase()}.json`, {
      signal: controller.signal,
      cache: "force-cache",
    })
      .then((response) => {
        if (!response.ok) throw new Error(`detail ${response.status}`);
        return response.json() as Promise<CountryInfrastructureDetail>;
      })
      .then((dataset) => {
        if (dataset.country !== country) throw new Error("detail country mismatch");
        setDetailByCountry((current) => ({ ...current, [country]: dataset }));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setDetailError(country);
      })
      .finally(() => {
        setDetailLoading((current) => (current === country ? null : current));
      });
    return () => controller.abort();
  }, [basePath, countryFilter, detailByCountry]);

  const selected: SelectedRecord = useMemo(() => {
    if (!selectedId) return null;
    const facility = facilityById.get(selectedId);
    if (facility) return { type: "facility", record: facility };
    const linear = atlas.linearFeatures.find((feature) => feature.id === selectedId);
    if (linear) return { type: "linear", record: linear };
    const detailPoint = detailPointById.get(selectedId);
    if (detailPoint) return { type: "detail-point", record: detailPoint };
    const detailLine = detailLineById.get(selectedId);
    return detailLine ? { type: "detail-line", record: detailLine } : null;
  }, [detailLineById, detailPointById, facilityById, selectedId]);

  const selectedEntities =
    selected?.type === "facility"
      ? [
          ...(selected.record.operatorEntityId ? [selected.record.operatorEntityId] : []),
          ...(selected.record.ownerEntityIds ?? []),
        ]
      : [];
  const linkedSecurities = uniqueSecurities(selectedEntities, entityById);
  const selectedSources = selected
    ? selected.type === "facility" || selected.type === "linear"
      ? selected.record.sourceIds
        .map((id) => sourceById.get(id))
        .filter((source) => source !== undefined)
      : []
    : [];
  const regionalRows = useMemo(
    () =>
      atlas.regions
        .filter((region) => region.country === balanceCountry)
        .sort((a, b) => {
          const ratioA =
            a.demand.value && a.supply.value !== null ? a.supply.value / a.demand.value : -1;
          const ratioB =
            b.demand.value && b.supply.value !== null ? b.supply.value / b.demand.value : -1;
          return ratioB - ratioA;
        }),
    [balanceCountry],
  );

  const visibleDetailPoints = useMemo(
    () =>
      (detailData?.points ?? []).filter((point) => {
        if (point.kind === "power_plant") {
          if (
            detailFilters.minimumCapacityMw > 0 &&
            (point.capacityMw === undefined ||
              point.capacityMw < detailFilters.minimumCapacityMw)
          ) {
            return false;
          }
          if (
            detailFilters.generationFuel !== "all" &&
            point.fuel !== detailFilters.generationFuel
          ) {
            return false;
          }
          if (!detailFilters.includePlanned && point.planned) return false;
        }
        if (point.kind === "data_center" || point.kind === "network_hub") {
          if (detailFilters.networkMode === "ix" && (point.ixCount ?? 0) < 1) {
            return false;
          }
          if (
            detailFilters.networkMode === "net50" &&
            (point.networkCount ?? 0) < 50
          ) {
            return false;
          }
          if (
            detailFilters.networkMode === "net200" &&
            (point.networkCount ?? 0) < 200
          ) {
            return false;
          }
        }
        return true;
      }),
    [detailData, detailFilters],
  );

  const layerCount = (layer: InfrastructureLayer) => {
    const representative =
      atlas.facilities.filter(
        (facility) =>
          facility.kind === layer &&
          (countryFilter === "ALL" || facility.country === countryFilter),
      ).length +
      atlas.linearFeatures.filter(
        (feature) =>
          feature.kind === layer &&
          (countryFilter === "ALL" || feature.country === countryFilter),
      ).length;
    if (!detailData) return representative;
    if (layer === "power_plant" || layer === "data_center" || layer === "network_hub") {
      return visibleDetailPoints.filter((point) => point.kind === layer).length;
    }
    return detailData.lines.filter(
      (line) =>
        line.kind === layer && (detailFilters.includePlanned || !line.planned),
    ).length;
  };

  const updateDetailFilters = (patch: Partial<DetailMapFilters>) => {
    setDetailFilters((current) => ({ ...current, ...patch }));
  };

  const toggleLayer = (layer: InfrastructureLayer) => {
    setActiveLayers((current) => {
      const next = new Set(current);
      if (next.has(layer)) {
        if (next.size > 1) next.delete(layer);
      } else {
        next.add(layer);
      }
      return next;
    });
  };

  const selectCountry = (country: CountryCode | "ALL") => {
    setCountryFilter(country);
    if (country !== "ALL") {
      setBalanceCountry(country);
      const firstFacility = atlas.facilities.find(
        (facility) => facility.country === country && activeLayers.has(facility.kind),
      );
      setSelectedId(
        firstFacility?.id ??
          atlas.linearFeatures.find(
            (feature) => feature.country === country && activeLayers.has(feature.kind),
          )?.id ??
          null,
      );
    }
  };

  const formatValue = (value: number | null, unit: string) =>
    value === null ? dictionary.noValue : `${compactFormatter.format(value)} ${unit}`;

  const relationshipLabel = (relationship: ListedSecurity["relationship"]) =>
    relationship === "direct"
      ? copy.directListing
      : relationship === "parent"
        ? copy.parentListing
        : copy.shareholderListing;

  return (
    <main className="min-h-screen bg-white text-[#1c1c1e]">
      <header className="sticky top-0 z-50 border-b border-[#e0e2e8] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-4 px-5 py-3 lg:px-8">
          <a href="#top" className="flex items-center gap-2.5" aria-label={dictionary.siteName}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ffd02f]">
              <img
                src={`${basePath}/high-voltage.webp`}
                alt=""
                width={30}
                height={30}
                className="h-7 w-7 object-contain"
              />
            </span>
            <span className="text-xl font-semibold tracking-[-0.04em]">{dictionary.siteName}</span>
          </a>
          <span className="rounded-full bg-[#fff4c4] px-3 py-1 text-[11px] font-semibold text-[#746019]">
            {dictionary.publicBadge}
          </span>
          <nav className="order-3 flex w-full gap-6 overflow-x-auto text-sm font-medium text-[#555a6a] lg:order-none lg:ml-auto lg:w-auto">
            <a className="whitespace-nowrap hover:text-[#1c1c1e]" href="#map">
              {dictionary.nav.map}
            </a>
            <a className="whitespace-nowrap hover:text-[#1c1c1e]" href="#balance">
              {dictionary.nav.balance}
            </a>
            <a className="whitespace-nowrap hover:text-[#1c1c1e]" href="#sources">
              {dictionary.nav.sources}
            </a>
            <a className="whitespace-nowrap hover:text-[#1c1c1e]" href="#governance">
              {dictionary.nav.governance}
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-1 rounded-full border border-[#e0e2e8] bg-[#f7f8fa] p-1 lg:ml-3">
            {LOCALES.map((code) => (
              <a
                key={code}
                href={`${basePath}/${code}/`}
                hrefLang={code}
                lang={code}
                aria-current={code === locale ? "page" : undefined}
                className={`rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition ${
                  code === locale
                    ? "bg-[#1c1c1e] text-white"
                    : "text-[#6b6f7e] hover:bg-white hover:text-[#1c1c1e]"
                }`}
              >
                {code === "zh-CN"
                  ? "中文"
                  : code === "ko"
                    ? "한국어"
                    : code === "ja"
                      ? "日本語"
                      : "EN"}
              </a>
            ))}
          </div>
        </div>
      </header>

      <section id="top" className="border-b border-[#eef0f3] bg-white">
        <div className="mx-auto grid max-w-[1400px] gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-8 lg:py-10">
          <div className="flex max-w-5xl items-start gap-5">
            <img
              src={`${basePath}/high-voltage.webp`}
              alt=""
              width={80}
              height={80}
              className="hidden h-20 w-20 shrink-0 object-contain sm:block"
            />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b6f7e]">
                {dictionary.eyebrow}
              </p>
              <h1 className="mt-2 max-w-4xl text-[clamp(2rem,4vw,3.75rem)] font-medium leading-[1.06] tracking-[-0.055em] text-[#050038]">
                {dictionary.headline}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#555a6a] md:text-base">
                {dictionary.intro}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-full bg-[#1c1c1e] px-5 py-3 text-xs text-white">
            <span className="h-2 w-2 rounded-full bg-[#ffd02f]" />
            <span className="font-semibold">Release {atlas.version}</span>
            <span className="text-white/40">·</span>
            <span className="text-white/70">{copy.currentRelease}</span>
          </div>
        </div>
      </section>

      <section id="map" className="scroll-mt-16 border-b border-[#e0e2e8] bg-[#f7f8fa]">
        <div className="mx-auto max-w-[1480px] px-4 py-7 lg:px-6 lg:py-9">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => selectCountry("ALL")}
              className={`min-h-11 rounded-full border px-5 py-2 text-left text-sm font-medium transition ${
                countryFilter === "ALL"
                  ? "border-[#1c1c1e] bg-[#1c1c1e] text-white"
                  : "border-[#c7cad5] bg-white text-[#555a6a] hover:border-[#1c1c1e]"
              }`}
            >
              <span>{copy.allCountries}</span>
            </button>
            {COUNTRY_CODES.map((country) => {
              const countryDetail = detailByCountry[country];
              const active = countryFilter === country;
              return (
                <button
                  key={country}
                  type="button"
                  onClick={() => selectCountry(country)}
                  className={`min-h-11 rounded-full border px-5 py-2 text-left text-sm font-medium transition ${
                    active
                      ? "border-[#1c1c1e] bg-[#1c1c1e] text-white"
                      : "border-[#c7cad5] bg-white text-[#555a6a] hover:border-[#1c1c1e]"
                  }`}
                >
                  <span>{dictionary.countries[country]}</span>
                  {countryDetail && (
                    <span className={`ml-2 text-[10px] tabular-nums ${active ? "text-white/55" : "text-[#8e91a0]"}`}>
                      {compactFormatter.format(countryDetail.points.length + countryDetail.lines.length)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-[#e0e2e8] bg-white p-4 shadow-[0_1px_2px_rgba(5,0,56,.04)] md:p-5">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h2 className="text-sm font-semibold text-[#1c1c1e]">{detailCopy.controls}</h2>
              <p className="text-xs text-[#8e91a0]">{detailCopy.controlsHint}</p>
              {detailLoading === countryFilter && (
                <span className="ml-auto flex items-center gap-2 text-[11px] font-semibold text-[#277167]">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#277167]/20 border-t-[#277167]" />
                  {detailCopy.loading}
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-[#eef0f3] pt-4">
              {INFRASTRUCTURE_LAYERS.map((layer) => {
                const enabled = activeLayers.has(layer);
                return (
                  <button
                    key={layer}
                    type="button"
                    aria-pressed={enabled}
                    onClick={() => toggleLayer(layer)}
                    className={`flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                      enabled
                        ? "border-[#c7cad5] bg-white text-[#1c1c1e] shadow-[0_2px_6px_rgba(5,0,56,.07)]"
                        : "border-[#eef0f3] bg-[#f7f8fa] text-[#a5a8b5]"
                    }`}
                  >
                    <LayerMarker layer={layer} />
                    <span>{copy.layers[layer]}</span>
                    <span className="rounded-full bg-[#f7f8fa] px-1.5 py-0.5 text-[9px] tabular-nums text-[#6b6f7e]">
                      {formatter.format(layerCount(layer))}
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                aria-pressed={detailFilters.showDensity}
                onClick={() =>
                  updateDetailFilters({ showDensity: !detailFilters.showDensity })
                }
                className={`flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                  detailFilters.showDensity
                    ? "border-[#4262ff] bg-[#f5f3ff] text-[#2a41b6]"
                    : "border-[#eef0f3] bg-[#f7f8fa] text-[#8e91a0]"
                }`}
              >
                <span className="h-3 w-3 rounded-full bg-[radial-gradient(circle,#ef4444_0,#f59e0b_35%,#3b82f6_70%,transparent_72%)]" />
                {detailCopy.density}
              </button>
            </div>

            <div className="mt-4 space-y-3 border-t border-[#eef0f3] pt-4 text-xs">
              {activeLayers.has("power_plant") && (
                <>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 font-medium text-[#6b6f7e]">
                      {detailCopy.capacity}:
                    </span>
                    {([100, 50, 0] as const).map((capacity) => (
                      <button
                        key={capacity}
                        type="button"
                        onClick={() =>
                          updateDetailFilters({ minimumCapacityMw: capacity })
                        }
                        className={`min-h-9 rounded-full border px-3 py-1.5 font-medium ${
                          detailFilters.minimumCapacityMw === capacity
                            ? "border-[#1c1c1e] bg-[#1c1c1e] text-white"
                            : "border-[#e0e2e8] bg-white text-[#6b6f7e]"
                        }`}
                      >
                        {capacity === 0 ? detailCopy.all : `≥${capacity}MW`}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 font-medium text-[#6b6f7e]">
                      {copy.layers.power_plant}:
                    </span>
                    <button
                      type="button"
                      onClick={() => updateDetailFilters({ generationFuel: "all" })}
                      className={`min-h-8 rounded-full border px-3 py-1 ${
                        detailFilters.generationFuel === "all"
                          ? "border-[#1c1c1e] bg-[#1c1c1e] font-medium text-white"
                          : "border-[#e0e2e8] bg-white text-[#6b6f7e]"
                      }`}
                    >
                      {detailCopy.all}
                    </button>
                    {GENERATION_FUELS.map((fuel) => (
                      <button
                        key={fuel}
                        type="button"
                        onClick={() => updateDetailFilters({ generationFuel: fuel })}
                        className={`min-h-8 rounded-full border px-3 py-1 ${
                          detailFilters.generationFuel === fuel
                            ? "border-[#1c1c1e] bg-[#1c1c1e] font-medium text-white"
                            : "border-[#e0e2e8] bg-white text-[#6b6f7e]"
                        }`}
                      >
                        {detailCopy.fuels[fuel]}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {(activeLayers.has("data_center") || activeLayers.has("network_hub")) && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 font-medium text-[#6b6f7e]">
                    {detailCopy.network}:
                  </span>
                  {(
                    [
                      ["all", detailCopy.all],
                      ["ix", detailCopy.ixOnly],
                      ["net50", detailCopy.networks50],
                      ["net200", detailCopy.networks200],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => updateDetailFilters({ networkMode: mode })}
                      className={`min-h-8 rounded-full border px-3 py-1 ${
                        detailFilters.networkMode === mode
                          ? "border-[#1c1c1e] bg-[#1c1c1e] font-medium text-white"
                          : "border-[#e0e2e8] bg-white text-[#6b6f7e]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-[#6b6f7e]">
                <input
                  type="checkbox"
                  checked={detailFilters.includePlanned}
                  onChange={(event) =>
                    updateDetailFilters({ includePlanned: event.target.checked })
                  }
                  className="h-4 w-4 rounded border-[#c7cad5] accent-[#1c1c1e]"
                />
                <span className="font-semibold">{detailCopy.includePlanned}</span>
              </label>
            </div>

            {detailError === countryFilter && (
              <p className="mt-3 rounded-lg bg-[#fff3df] px-3 py-2 text-[11px] text-[#8a5b19]">
                {detailCopy.loadFailed}
              </p>
            )}
          </div>

          <div className="mt-4 grid overflow-hidden rounded-2xl border border-[#e0e2e8] bg-white shadow-[0_12px_32px_-4px_rgba(5,0,56,.08)] xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-h-[650px] border-b border-[#e0e2e8] p-3 md:p-5 xl:border-b-0 xl:border-r">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b6f7e]">
                {countryFilter === "ALL"
                  ? copy.allCountries
                  : dictionary.countries[countryFilter]}
              </p>
              <h2 className="mt-2 text-2xl font-medium tracking-[-0.035em] text-[#050038]">
                {countryFilter === "ALL"
                  ? copy.mapTitle
                  : `${dictionary.countries[countryFilter]} · ${copy.countryDetail}`}
              </h2>
              <p className="mt-2 max-w-3xl text-xs leading-5 text-[#6b6f7e]">
                {detailData
                  ? `${formatter.format(detailData.points.length + detailData.lines.length)} ${detailCopy.publicRecords} · ${detailData.generatedAt.slice(0, 10)}`
                  : copy.mapIntro}
              </p>
              <div className="mt-5">
                <InfrastructureMap
                  facilities={atlas.facilities}
                  linearFeatures={atlas.linearFeatures}
                  countryFilter={countryFilter}
                  activeLayers={activeLayers}
                  detailPoints={detailData?.points}
                  detailLines={detailData?.lines}
                  detailFilters={detailFilters}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  ariaLabel={copy.mapAria}
                  attribution={copy.mapAttribution}
                  locale={locale}
                  countryName={
                    countryFilter === "ALL"
                      ? copy.allCountries
                      : dictionary.countries[countryFilter]
                  }
                  labels={{
                    countryDetail: copy.countryDetail,
                    allOverview: copy.allOverview,
                    zoomIn: copy.zoomIn,
                    zoomOut: copy.zoomOut,
                    resetView: copy.resetView,
                  }}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                {INFRASTRUCTURE_LAYERS.map((layer) => (
                  <span key={layer} className="flex items-center gap-2 text-[11px] text-[#6b6f7e]">
                    <LayerMarker layer={layer} />
                    {copy.layers[layer]}
                  </span>
                ))}
              </div>
            </div>

            <aside className="bg-[#fafbfc] p-5 md:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8e91a0]">
                {copy.selectedFacility}
              </p>
              {selected ? (
                <>
                  <div className="mt-3 flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white shadow-[0_1px_2px_rgba(5,0,56,.06)]">
                      <LayerMarker layer={selected.record.kind} />
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6b6f7e]">
                        {dictionary.countries[selected.record.country]} · {copy.layers[selected.record.kind]}
                      </p>
                      <h2 className="mt-1 text-2xl font-medium leading-7 tracking-[-0.035em] text-[#050038]">
                        {selected.record.name}
                      </h2>
                    </div>
                  </div>

                  {selected.type === "facility" || selected.type === "detail-point" ? (
                    <>
                      <dl className="mt-6 space-y-3 rounded-xl border border-[#e0e2e8] bg-white p-4 text-xs">
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-[#8e91a0]">{copy.operator}</dt>
                          <dd className="text-right font-semibold">
                            {selected.type === "facility"
                              ? selected.record.operatorEntityId
                                ? entityById.get(selected.record.operatorEntityId)?.name
                                : copy.noPublicRecord
                              : selected.record.operator ?? copy.noPublicRecord}
                          </dd>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-[#8e91a0]">{copy.owner}</dt>
                          <dd className="text-right font-semibold">
                            {selected.type === "facility"
                              ? (selected.record.ownerEntityIds ?? [])
                                  .map((id) => entityById.get(id)?.name)
                                  .filter(Boolean)
                                  .join(", ") || (
                                  <ConfidentialBadge
                                    locale={locale}
                                    description={copy.noPublicRecord}
                                  />
                                )
                              : selected.record.owner || (
                                  <ConfidentialBadge
                                    locale={locale}
                                    description={copy.noPublicRecord}
                                  />
                                )}
                          </dd>
                        </div>
                        {selected.record.capacityMw !== undefined && (
                          <div className="flex items-start justify-between gap-4">
                            <dt className="text-[#8e91a0]">{copy.capacity}</dt>
                            <dd className="text-right font-semibold">
                              {formatter.format(selected.record.capacityMw)} MW
                            </dd>
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-[#8e91a0]">{copy.locationPrecision}</dt>
                          <dd className="max-w-[190px] text-right font-semibold">
                            {selected.type === "facility"
                              ? selected.record.disclosureLevel === "exact_public"
                                ? copy.exactPublic
                                : copy.generalizedPublic
                              : detailCopy.exactSource}
                          </dd>
                        </div>
                        {selected.type === "detail-point" &&
                          selected.record.kind !== "power_plant" && (
                            <>
                              <div className="flex items-start justify-between gap-4">
                                <dt className="text-[#8e91a0]">{detailCopy.networks}</dt>
                                <dd className="text-right font-semibold">
                                  {formatter.format(selected.record.networkCount ?? 0)}
                                </dd>
                              </div>
                              <div className="flex items-start justify-between gap-4">
                                <dt className="text-[#8e91a0]">{detailCopy.exchanges}</dt>
                                <dd className="text-right font-semibold">
                                  {formatter.format(selected.record.ixCount ?? 0)}
                                </dd>
                              </div>
                            </>
                          )}
                      </dl>
                      {selected.type === "facility" && (
                        <p className="mt-3 text-[11px] leading-5 text-[#8e91a0]">
                          {selected.record.locationNote[locale]}
                        </p>
                      )}

                      {selected.type === "facility" && (
                        <div className="mt-6">
                          <h3 className="text-xs font-semibold">{copy.connections}</h3>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(selected.record.connectionIds ?? []).length ? (
                              selected.record.connectionIds?.map((id) => {
                                const connected = facilityById.get(id);
                                return connected ? (
                                  <button
                                    key={id}
                                    type="button"
                                    onClick={() => setSelectedId(id)}
                                    className="rounded-full border border-[#c7cad5] bg-white px-3 py-1.5 text-[11px] font-medium hover:border-[#1c1c1e]"
                                  >
                                    {connected.name} →
                                  </button>
                                ) : null;
                              })
                            ) : (
                              <span className="text-[11px] text-[#8e91a0]">
                                {copy.noPublicRecord}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-6">
                        <h3 className="text-xs font-semibold">{copy.listedCompany}</h3>
                        <div className="mt-2 space-y-2">
                          {linkedSecurities.length ? (
                            linkedSecurities.map(({ entity, security }) => (
                              <a
                                key={`${security.exchange}:${security.ticker}`}
                                href={externalTickerUrl(security)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between rounded-xl bg-[#1c1c1e] p-3.5 text-white transition hover:bg-[#2c2c34]"
                              >
                                <span>
                                  <span className="block text-sm font-semibold">{entity.name}</span>
                                  <span className="mt-0.5 block text-[10px] text-white/55">
                                    {relationshipLabel(security.relationship)}
                                  </span>
                                </span>
                                <span className="rounded-full bg-[#ffd02f] px-3 py-1 text-xs font-semibold text-[#1c1c1e]">
                                  {security.exchange} · {security.ticker}
                                </span>
                              </a>
                            ))
                          ) : (
                            <p className="text-[11px] text-[#8e91a0]">{copy.noPublicRecord}</p>
                          )}
                        </div>
                        <p className="mt-2 text-[10px] leading-4 text-[#8a9298]">
                          {locale === "ko"
                            ? "기업·증권 식별 연결이며 투자 추천이 아닙니다."
                            : locale === "ja"
                              ? "企業・証券の識別リンクであり、投資推奨ではありません。"
                              : locale === "zh-CN"
                                ? "仅用于识别企业与证券，不构成投资建议。"
                                : "Entity and security identification only; not investment advice."}
                        </p>
                      </div>
                    </>
                  ) : (
                    <dl className="mt-6 space-y-3 rounded-xl border border-[#e0e2e8] bg-white p-4 text-xs">
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-[#8e91a0]">{copy.operator}</dt>
                        <dd className="text-right font-semibold">
                          {selected.record.operator ?? copy.noPublicRecord}
                        </dd>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-[#8e91a0]">{copy.owner}</dt>
                        <dd className="text-right font-semibold">
                          {selected.record.owner || (
                            <ConfidentialBadge
                              locale={locale}
                              description={copy.noPublicRecord}
                            />
                          )}
                        </dd>
                      </div>
                      {((selected.type === "linear" && selected.record.voltage) ||
                        (selected.type === "detail-line" &&
                          selected.record.voltageKv !== undefined)) && (
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-[#8e91a0]">Voltage</dt>
                          <dd className="text-right font-semibold">
                            {selected.type === "linear"
                              ? `${selected.record.voltage} V`
                              : `${selected.record.voltageKv} kV`}
                          </dd>
                        </div>
                      )}
                      {selected.record.substance && (
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-[#8e91a0]">Substance</dt>
                          <dd className="text-right font-semibold">{selected.record.substance}</dd>
                        </div>
                      )}
                    </dl>
                  )}

                  <div className="mt-6 border-t border-[#e0e2e8] pt-5">
                    <h3 className="text-xs font-semibold">{copy.source}</h3>
                    <div className="mt-2 space-y-2">
                      {selectedSources.map((source) => (
                        <a
                          key={source.id}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-xl border border-[#eef0f3] bg-white p-3 text-[11px] leading-4 hover:border-[#c7cad5]"
                        >
                          <span className="font-semibold">{source.publisher}</span>
                          <span className="mt-0.5 block text-[#6b6f7e]">{source.title} ↗</span>
                        </a>
                      ))}
                      {(selected.type === "detail-point" ||
                        selected.type === "detail-line") && (
                        <a
                          href={selected.record.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-xl border border-[#eef0f3] bg-white p-3 text-[11px] leading-4 hover:border-[#c7cad5]"
                        >
                          <span className="font-semibold">{selected.record.sourceLabel}</span>
                          <span className="mt-0.5 block text-[#6b6f7e]">
                            {selected.record.name} ↗
                          </span>
                        </a>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm leading-6 text-[#6d7880]">{copy.selectFacility}</p>
              )}
            </aside>
          </div>
        </div>
      </section>

      <section id="balance" className="scroll-mt-16 border-b border-[#e0e2e8] bg-white">
        <div className="mx-auto max-w-[1280px] px-5 py-16 lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b6f7e]">
              01 · Balance
            </p>
            <h2 className="mt-3 text-4xl font-medium tracking-[-0.045em] text-[#050038]">{copy.balanceTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-[#555a6a]">{copy.balanceIntro}</p>
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            {COUNTRY_CODES.map((country) => (
              <button
                key={country}
                type="button"
                onClick={() => setBalanceCountry(country)}
                className={`min-h-10 rounded-full border px-4 py-2 text-xs font-medium transition ${
                  balanceCountry === country
                    ? "border-[#1c1c1e] bg-[#1c1c1e] text-white"
                    : "border-[#c7cad5] bg-white text-[#6b6f7e] hover:border-[#1c1c1e]"
                }`}
              >
                {dictionary.countries[country]} ·{" "}
                {atlas.coverage.find((row) => row.country === country)?.regionCount ?? 0}
              </button>
            ))}
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-[#e0e2e8] bg-white">
            <table className="w-full min-w-[940px] border-collapse text-left text-sm">
              <thead className="border-b border-[#e0e2e8] bg-[#fafbfc] text-[11px] uppercase tracking-[0.08em] text-[#6b6f7e]">
                <tr>
                  <th className="px-5 py-4 font-semibold">{copy.region}</th>
                  <th className="px-5 py-4 text-right font-semibold">{copy.demand}</th>
                  <th className="px-5 py-4 text-right font-semibold">{copy.supply}</th>
                  <th className="px-5 py-4 text-right font-semibold">{copy.ratio}</th>
                  <th className="px-5 py-4 text-right font-semibold">{copy.period}</th>
                </tr>
              </thead>
              <tbody>
                {regionalRows.map((region) => {
                  const ratio =
                    region.demand.value && region.supply.value !== null
                      ? (region.supply.value / region.demand.value) * 100
                      : null;
                  return (
                    <tr
                      key={region.id}
                      className="border-b border-[#eef0f3] last:border-0 hover:bg-[#fafbfc]"
                    >
                      <th className="px-5 py-4">
                        <span className="font-semibold">{region.name[locale]}</span>
                        <span className="mt-1 block text-[10px] font-normal text-[#78838b]">
                          {region.demand.label[locale]}
                        </span>
                      </th>
                      <td className="px-5 py-4 text-right tabular-nums">
                        {formatValue(region.demand.value, region.demand.unit)}
                      </td>
                      <td className="px-5 py-4 text-right tabular-nums">
                        {formatValue(region.supply.value, region.supply.unit)}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold tabular-nums">
                        {ratio === null ? dictionary.noValue : `${formatter.format(ratio)}%`}
                      </td>
                      <td className="px-5 py-4 text-right text-xs text-[#6b6f7e]">
                        {region.period}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {regionalRows[0] && (
            <div className="mt-4 grid gap-3 lg:grid-cols-[auto_1fr]">
              <span className="h-fit rounded-full bg-[#fff4c4] px-3 py-1.5 text-[11px] font-semibold text-[#746019]">
                {regionalRows[0].comparableWithinCountry
                  ? copy.withinCountryOnly
                  : copy.coverage}
              </span>
              <div>
                <p className="text-xs leading-5 text-[#555a6a]">{regionalRows[0].methodology[locale]}</p>
                <p className="mt-1 text-[11px] leading-5 text-[#8e91a0]">{copy.countryMethodWarning}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="sources" className="scroll-mt-16 border-b border-[#e0e2e8] bg-[#f7f8fa]">
        <div className="mx-auto max-w-[1280px] px-5 py-16 lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b6f7e]">
              02 · Provenance
            </p>
            <h2 className="mt-3 text-4xl font-medium tracking-[-0.045em] text-[#050038]">{copy.provenanceTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-[#555a6a]">{copy.provenanceIntro}</p>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {atlas.sources.map((source) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border border-[#eef0f3] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#c7cad5] hover:shadow-[0_4px_12px_rgba(5,0,56,.06)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-[#4262ff]">{source.publisher}</p>
                  <span className="rounded-full bg-[#f7f8fa] px-2 py-1 text-[9px] font-semibold uppercase text-[#6b6f7e]">
                    {source.country ?? "GLOBAL"}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-semibold leading-5 group-hover:underline">
                  {source.title}
                </h3>
                <p className="mt-3 text-[10px] text-[#8e91a0]">
                  {copy.retrieved} · {source.retrievedAt.slice(0, 10)}
                  {source.asOf ? ` · ${source.asOf}` : ""}
                </p>
                {(source.licenseNote || source.coverageNote) && (
                  <p className="mt-2 text-[10px] leading-4 text-[#8e91a0]">
                    {source.licenseNote ?? source.coverageNote}
                  </p>
                )}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="governance" className="scroll-mt-16 bg-[#1c1c1e] text-white">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-5 py-16 lg:grid-cols-[.72fr_1.28fr] lg:px-8 lg:py-24">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#ffd02f]">
              03 · Governance
            </p>
            <h2 className="mt-3 text-4xl font-medium tracking-[-0.045em]">
              {dictionary.governanceTitle}
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/60">{dictionary.governanceIntro}</p>
          </div>
          <div>
            <ol className="grid gap-3 md:grid-cols-2">
              {dictionary.governanceItems.map((item, index) => (
                <li key={item} className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
                  <span className="text-xs font-semibold text-[#ffd02f]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-4 text-sm leading-6 text-white/80">{item}</p>
                </li>
              ))}
            </ol>
            <p className="mt-6 border-t border-white/10 pt-6 text-xs leading-5 text-white/45">
              {dictionary.openSourceNote}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
