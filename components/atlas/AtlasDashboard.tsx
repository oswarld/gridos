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
import InfrastructureMap from "./InfrastructureMap";

const atlas = atlasJson as PublicAtlas;

const LAYER_STYLES: Record<
  InfrastructureLayer,
  { color: string; marker: "circle" | "square" | "diamond" | "line" | "dash" }
> = {
  power_plant: { color: "#f3b72f", marker: "circle" },
  data_center: { color: "#24a7a0", marker: "square" },
  network_hub: { color: "#c0589c", marker: "diamond" },
  transmission: { color: "#3b75b8", marker: "line" },
  pipeline: { color: "#d66a43", marker: "dash" },
};

type SelectedRecord =
  | { type: "facility"; record: AtlasFacility }
  | { type: "linear"; record: AtlasLinearFeature }
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
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const [countryFilter, setCountryFilter] = useState<CountryCode | "ALL">("ALL");
  const [balanceCountry, setBalanceCountry] = useState<CountryCode>("KR");
  const [activeLayers, setActiveLayers] = useState<Set<InfrastructureLayer>>(
    new Set(INFRASTRUCTURE_LAYERS),
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    atlas.facilities[0]?.id ?? null,
  );
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

  useEffect(() => {
    document.documentElement.lang = dictionary.htmlLang;
  }, [dictionary.htmlLang]);

  const selected: SelectedRecord = useMemo(() => {
    if (!selectedId) return null;
    const facility = facilityById.get(selectedId);
    if (facility) return { type: "facility", record: facility };
    const linear = atlas.linearFeatures.find((feature) => feature.id === selectedId);
    return linear ? { type: "linear", record: linear } : null;
  }, [facilityById, selectedId]);

  const selectedEntities =
    selected?.type === "facility"
      ? [
          ...(selected.record.operatorEntityId ? [selected.record.operatorEntityId] : []),
          ...(selected.record.ownerEntityIds ?? []),
        ]
      : [];
  const linkedSecurities = uniqueSecurities(selectedEntities, entityById);
  const selectedSources = selected
    ? selected.record.sourceIds
        .map((id) => sourceById.get(id))
        .filter((source) => source !== undefined)
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
    <main className="min-h-screen bg-[#f2f0ea] text-[#102231]">
      <header className="sticky top-0 z-50 border-b border-[#102231]/10 bg-[#f7f5ef]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1640px] flex-wrap items-center gap-4 px-5 py-3 lg:px-8">
          <a href="#top" className="flex items-center gap-3" aria-label={dictionary.siteName}>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#102231] text-sm font-bold text-[#f4b942]">
              G
            </span>
            <span className="text-lg font-semibold tracking-[-0.03em]">{dictionary.siteName}</span>
          </a>
          <span className="rounded-full border border-[#1f756b]/25 bg-[#dcece5] px-3 py-1 text-[11px] font-semibold text-[#205e57]">
            {dictionary.publicBadge}
          </span>
          <nav className="order-3 flex w-full gap-5 overflow-x-auto text-sm text-[#425361] lg:order-none lg:ml-auto lg:w-auto">
            <a className="whitespace-nowrap hover:text-[#102231]" href="#map">
              {dictionary.nav.map}
            </a>
            <a className="whitespace-nowrap hover:text-[#102231]" href="#balance">
              {dictionary.nav.balance}
            </a>
            <a className="whitespace-nowrap hover:text-[#102231]" href="#sources">
              {dictionary.nav.sources}
            </a>
            <a className="whitespace-nowrap hover:text-[#102231]" href="#governance">
              {dictionary.nav.governance}
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-1 rounded-full border border-[#102231]/10 bg-white/70 p-1 lg:ml-3">
            {LOCALES.map((code) => (
              <a
                key={code}
                href={`${basePath}/${code}/`}
                hrefLang={code}
                lang={code}
                aria-current={code === locale ? "page" : undefined}
                className={`rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition ${
                  code === locale
                    ? "bg-[#102231] text-white"
                    : "text-[#52616c] hover:bg-white hover:text-[#102231]"
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

      <section id="top" className="border-b border-[#102231]/10">
        <div className="mx-auto grid max-w-[1640px] gap-7 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#277167]">
              {dictionary.eyebrow}
            </p>
            <h1 className="mt-3 max-w-5xl text-[clamp(2.15rem,4vw,3.8rem)] font-medium leading-[1.02] tracking-[-0.05em]">
              {dictionary.headline}
            </h1>
            <p className="mt-4 max-w-4xl text-sm leading-6 text-[#50606a] md:text-base">
              {dictionary.intro}
            </p>
          </div>
          <div className="self-end rounded-3xl border border-[#102231]/10 bg-[#102231] p-5 text-white shadow-[0_18px_40px_rgba(16,34,49,.1)]">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.12em] text-white/55">
              <span>Release {atlas.version}</span>
              <span>{copy.releaseSummary}</span>
            </div>
            <p className="mt-5 text-lg font-semibold">{copy.currentRelease}</p>
            <p className="mt-2 text-sm text-[#8ed1c4]">{copy.allLayersLive}</p>
            <p className="mt-4 border-t border-white/15 pt-4 text-[11px] leading-5 text-white/60">
              {copy.releaseScope}
            </p>
          </div>
        </div>
      </section>

      <section id="map" className="scroll-mt-16 border-b border-[#102231]/10">
        <div className="mx-auto max-w-[1640px] px-5 py-8 lg:px-8 lg:py-10">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => selectCountry("ALL")}
              className={`min-w-36 rounded-2xl border px-4 py-3 text-left transition ${
                countryFilter === "ALL"
                  ? "border-[#102231] bg-[#102231] text-white"
                  : "border-[#102231]/10 bg-white/65 hover:bg-white"
              }`}
            >
              <span className="block text-sm font-semibold">{copy.allCountries}</span>
              <span className={`mt-1 block text-[10px] ${countryFilter === "ALL" ? "text-white/55" : "text-[#75808a]"}`}>
                {atlas.facilities.length} + {atlas.linearFeatures.length}
              </span>
            </button>
            {COUNTRY_CODES.map((country) => {
              const coverage = atlas.coverage.find((row) => row.country === country);
              const active = countryFilter === country;
              return (
                <button
                  key={country}
                  type="button"
                  onClick={() => selectCountry(country)}
                  className={`min-w-32 rounded-2xl border px-4 py-3 text-left transition ${
                    active
                      ? "border-[#102231] bg-[#102231] text-white"
                      : "border-[#102231]/10 bg-white/65 hover:bg-white"
                  }`}
                >
                  <span className="block text-sm font-semibold">{dictionary.countries[country]}</span>
                  <span className={`mt-1 block text-[10px] ${active ? "text-white/55" : "text-[#75808a]"}`}>
                    {coverage?.facilityCount ?? 0} facilities · {coverage?.linearFeatureCount ?? 0} ways
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid overflow-hidden rounded-[30px] border border-[#102231]/10 bg-[#f9f8f4] shadow-[0_24px_60px_rgba(16,34,49,.08)] xl:grid-cols-[260px_minmax(0,1fr)_350px]">
            <aside className="border-b border-[#102231]/10 p-5 xl:border-b-0 xl:border-r">
              <h2 className="text-lg font-semibold">{dictionary.layerTitle}</h2>
              <p className="mt-1 text-xs leading-5 text-[#6d7880]">{copy.publicSnapshot}</p>
              <div className="mt-5 space-y-2">
                {INFRASTRUCTURE_LAYERS.map((layer) => {
                  const enabled = activeLayers.has(layer);
                  const facilityCount = atlas.facilities.filter(
                    (facility) =>
                      facility.kind === layer &&
                      (countryFilter === "ALL" || facility.country === countryFilter),
                  ).length;
                  const wayCount = atlas.linearFeatures.filter(
                    (feature) =>
                      feature.kind === layer &&
                      (countryFilter === "ALL" || feature.country === countryFilter),
                  ).length;
                  return (
                    <button
                      key={layer}
                      type="button"
                      aria-pressed={enabled}
                      onClick={() => toggleLayer(layer)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                        enabled
                          ? "border-[#277167]/30 bg-[#e4efea]"
                          : "border-[#102231]/8 bg-white/55 text-[#66747d]"
                      }`}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white">
                        <LayerMarker layer={layer} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{copy.layers[layer]}</span>
                        <span className="mt-0.5 block text-[10px] text-[#75808a]">
                          {facilityCount + wayCount} {copy.layerScope.toLowerCase()}
                        </span>
                      </span>
                      <span
                        className={`ml-auto h-5 w-9 rounded-full p-0.5 transition ${
                          enabled ? "bg-[#277167]" : "bg-[#c8ccc9]"
                        }`}
                        aria-hidden
                      >
                        <span
                          className={`block h-4 w-4 rounded-full bg-white transition ${
                            enabled ? "translate-x-4" : ""
                          }`}
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 rounded-2xl border border-[#102231]/10 bg-white/65 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7b858c]">
                  {copy.coverage}
                </p>
                <p className="mt-2 text-[11px] leading-5 text-[#66747d]">
                  {atlas.coverageNote[locale]}
                </p>
              </div>
            </aside>

            <div className="min-h-[650px] border-b border-[#102231]/10 p-4 md:p-7 xl:border-b-0 xl:border-r">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#277167]">
                {countryFilter === "ALL"
                  ? copy.allCountries
                  : dictionary.countries[countryFilter]}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                {countryFilter === "ALL"
                  ? copy.mapTitle
                  : `${dictionary.countries[countryFilter]} · ${copy.countryDetail}`}
              </h2>
              <p className="mt-2 max-w-3xl text-xs leading-5 text-[#6d7880]">{copy.mapIntro}</p>
              <div className="mt-5">
                <InfrastructureMap
                  facilities={atlas.facilities}
                  linearFeatures={atlas.linearFeatures}
                  countryFilter={countryFilter}
                  activeLayers={activeLayers}
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
                  <span key={layer} className="flex items-center gap-2 text-[11px] text-[#607079]">
                    <LayerMarker layer={layer} />
                    {copy.layers[layer]}
                  </span>
                ))}
              </div>
            </div>

            <aside className="p-5 md:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#78838b]">
                {copy.selectedFacility}
              </p>
              {selected ? (
                <>
                  <div className="mt-3 flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e7ecea]">
                      <LayerMarker layer={selected.record.kind} />
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#277167]">
                        {dictionary.countries[selected.record.country]} · {copy.layers[selected.record.kind]}
                      </p>
                      <h2 className="mt-1 text-2xl font-semibold leading-7 tracking-[-0.035em]">
                        {selected.record.name}
                      </h2>
                    </div>
                  </div>

                  {selected.type === "facility" ? (
                    <>
                      <dl className="mt-6 space-y-3 rounded-2xl border border-[#102231]/10 bg-white p-4 text-xs">
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-[#75808a]">{copy.operator}</dt>
                          <dd className="text-right font-semibold">
                            {selected.record.operatorEntityId
                              ? entityById.get(selected.record.operatorEntityId)?.name
                              : copy.noPublicRecord}
                          </dd>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-[#75808a]">{copy.owner}</dt>
                          <dd className="text-right font-semibold">
                            {(selected.record.ownerEntityIds ?? [])
                              .map((id) => entityById.get(id)?.name)
                              .filter(Boolean)
                              .join(", ") || copy.noPublicRecord}
                          </dd>
                        </div>
                        {selected.record.capacityMw !== undefined && (
                          <div className="flex items-start justify-between gap-4">
                            <dt className="text-[#75808a]">{copy.capacity}</dt>
                            <dd className="text-right font-semibold">
                              {formatter.format(selected.record.capacityMw)} MW
                            </dd>
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-[#75808a]">{copy.locationPrecision}</dt>
                          <dd className="max-w-[190px] text-right font-semibold">
                            {selected.record.disclosureLevel === "exact_public"
                              ? copy.exactPublic
                              : copy.generalizedPublic}
                          </dd>
                        </div>
                      </dl>
                      <p className="mt-3 text-[11px] leading-5 text-[#75808a]">
                        {selected.record.locationNote[locale]}
                      </p>

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
                                  className="rounded-full border border-[#102231]/10 bg-white px-3 py-1.5 text-[11px] font-semibold hover:border-[#277167]"
                                >
                                  {connected.name} →
                                </button>
                              ) : null;
                            })
                          ) : (
                            <span className="text-[11px] text-[#75808a]">{copy.noPublicRecord}</span>
                          )}
                        </div>
                      </div>

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
                                className="flex items-center justify-between rounded-2xl bg-[#102231] p-3.5 text-white transition hover:bg-[#1e384b]"
                              >
                                <span>
                                  <span className="block text-sm font-semibold">{entity.name}</span>
                                  <span className="mt-0.5 block text-[10px] text-white/55">
                                    {relationshipLabel(security.relationship)}
                                  </span>
                                </span>
                                <span className="rounded-full bg-[#f4b942] px-3 py-1 text-xs font-bold text-[#102231]">
                                  {security.exchange} · {security.ticker}
                                </span>
                              </a>
                            ))
                          ) : (
                            <p className="text-[11px] text-[#75808a]">{copy.noPublicRecord}</p>
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
                    <dl className="mt-6 space-y-3 rounded-2xl border border-[#102231]/10 bg-white p-4 text-xs">
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-[#75808a]">{copy.operator}</dt>
                        <dd className="text-right font-semibold">
                          {selected.record.operator ?? copy.noPublicRecord}
                        </dd>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-[#75808a]">{copy.owner}</dt>
                        <dd className="text-right font-semibold">
                          {selected.record.owner ?? copy.noPublicRecord}
                        </dd>
                      </div>
                      {selected.record.voltage && (
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-[#75808a]">Voltage</dt>
                          <dd className="text-right font-semibold">{selected.record.voltage} V</dd>
                        </div>
                      )}
                      {selected.record.substance && (
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-[#75808a]">Substance</dt>
                          <dd className="text-right font-semibold">{selected.record.substance}</dd>
                        </div>
                      )}
                    </dl>
                  )}

                  <div className="mt-6 border-t border-[#102231]/10 pt-5">
                    <h3 className="text-xs font-semibold">{copy.source}</h3>
                    <div className="mt-2 space-y-2">
                      {selectedSources.map((source) => (
                        <a
                          key={source.id}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-xl bg-[#e9ece8] p-3 text-[11px] leading-4 hover:bg-[#dde4df]"
                        >
                          <span className="font-semibold">{source.publisher}</span>
                          <span className="mt-0.5 block text-[#66747d]">{source.title} ↗</span>
                        </a>
                      ))}
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

      <section id="balance" className="scroll-mt-16 border-b border-[#102231]/10 bg-[#e9e7e0]">
        <div className="mx-auto max-w-[1640px] px-5 py-14 lg:px-8 lg:py-20">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#277167]">
              01 · Balance
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em]">{copy.balanceTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-[#61707a]">{copy.balanceIntro}</p>
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            {COUNTRY_CODES.map((country) => (
              <button
                key={country}
                type="button"
                onClick={() => setBalanceCountry(country)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  balanceCountry === country
                    ? "border-[#102231] bg-[#102231] text-white"
                    : "border-[#102231]/10 bg-white/60 hover:bg-white"
                }`}
              >
                {dictionary.countries[country]} ·{" "}
                {atlas.coverage.find((row) => row.country === country)?.regionCount ?? 0}
              </button>
            ))}
          </div>

          <div className="mt-5 overflow-x-auto rounded-3xl border border-[#102231]/10 bg-[#f8f7f3]">
            <table className="w-full min-w-[940px] border-collapse text-left text-sm">
              <thead className="border-b border-[#102231]/10 text-[11px] uppercase tracking-[0.08em] text-[#697680]">
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
                      className="border-b border-[#102231]/7 last:border-0 hover:bg-white"
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
                      <td className="px-5 py-4 text-right text-xs text-[#66747d]">
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
              <span className="h-fit rounded-full bg-[#d5e6df] px-3 py-1.5 text-[11px] font-semibold text-[#205e57]">
                {copy.withinCountryOnly}
              </span>
              <div>
                <p className="text-xs leading-5 text-[#5f6d76]">{regionalRows[0].methodology[locale]}</p>
                <p className="mt-1 text-[11px] leading-5 text-[#7b858c]">{copy.countryMethodWarning}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="sources" className="scroll-mt-16 border-b border-[#102231]/10">
        <div className="mx-auto max-w-[1640px] px-5 py-14 lg:px-8 lg:py-20">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#277167]">
              02 · Provenance
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em]">{copy.provenanceTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-[#61707a]">{copy.provenanceIntro}</p>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {atlas.sources.map((source) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border border-[#102231]/10 bg-white/70 p-5 transition hover:-translate-y-0.5 hover:bg-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-[#277167]">{source.publisher}</p>
                  <span className="rounded-full bg-[#e7ece8] px-2 py-1 text-[9px] font-semibold uppercase text-[#66747d]">
                    {source.country ?? "GLOBAL"}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-semibold leading-5 group-hover:underline">
                  {source.title}
                </h3>
                <p className="mt-3 text-[10px] text-[#7b858c]">
                  {copy.retrieved} · {source.retrievedAt.slice(0, 10)}
                  {source.asOf ? ` · ${source.asOf}` : ""}
                </p>
                {(source.licenseNote || source.coverageNote) && (
                  <p className="mt-2 text-[10px] leading-4 text-[#7b858c]">
                    {source.licenseNote ?? source.coverageNote}
                  </p>
                )}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="governance" className="scroll-mt-16 bg-[#102231] text-white">
        <div className="mx-auto grid max-w-[1640px] gap-12 px-5 py-16 lg:grid-cols-[.72fr_1.28fr] lg:px-8 lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#73b7aa]">
              03 · Governance
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em]">
              {dictionary.governanceTitle}
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/60">{dictionary.governanceIntro}</p>
          </div>
          <div>
            <ol className="grid gap-3 md:grid-cols-2">
              {dictionary.governanceItems.map((item, index) => (
                <li key={item} className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
                  <span className="text-xs font-semibold text-[#f4b942]">
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
