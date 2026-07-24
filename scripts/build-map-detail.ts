/**
 * Build country-level detail layers for the public map.
 *
 * Only source-published public coordinates are collected:
 * - US generation: EIA-860M
 * - US high-voltage transmission: HIFLD public ArcGIS service
 * - US gas trunk pipelines: EIA/HIFLD public ArcGIS service
 * - Five-country data centers / network hubs: PeeringDB public facility records
 * - KR/JP/TW/CN generation, high-voltage lines, and energy pipelines: public OSM tags
 *
 * Raw downloads remain in data/raw/country-detail and are not committed.
 * Browser-ready country files are written to public/data/detail.
 */
import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import {
  COUNTRY_CODES,
  type BoundaryGeometry,
  type CountryCode,
} from "../lib/atlas-types";
import { pointBelongsToBoundary } from "../lib/geo-boundary";
import type {
  CountryInfrastructureDetail,
  DetailedInfrastructureLine,
  DetailedInfrastructurePoint,
  GenerationFuel,
} from "../lib/map-detail-types";

const ROOT = path.resolve(__dirname, "..");
const RAW_DIR = path.join(ROOT, "data", "raw", "country-detail");
const OUTPUT_DIR = path.join(ROOT, "public", "data", "detail");
const BOUNDARIES_PATH = path.join(ROOT, "data", "processed", "atlas-boundaries.json");
const GENERATED_AT = new Date().toISOString();
const VERSION = GENERATED_AT.slice(0, 10);
const USER_AGENT = "GridOS-public-infrastructure-atlas/1.0 (public-interest research)";

const EIA_860M_URL =
  "https://www.eia.gov/electricity/data/eia860m/xls/june_generator2026.xlsx";
const EIA_860M_PAGE = "https://www.eia.gov/electricity/data/eia860m/";
const HIFLD_GRID_SERVICE =
  "https://services1.arcgis.com/Hp6G80Pky0om7QvQ/arcgis/rest/services/Electric_Power_Transmission_Lines/FeatureServer/0";
const EIA_PIPELINE_SERVICE =
  "https://services2.arcgis.com/FiaPA4ga0iQKduv3/arcgis/rest/services/Natural_Gas_Interstate_and_Intrastate_Pipelines_1/FeatureServer/0";
const PEERINGDB_PAGE = "https://www.peeringdb.com/";
const OVERPASS_ENDPOINTS = [
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const EAST_ASIA_CONFIG: Record<
  Exclude<CountryCode, "US">,
  {
    bboxes: [number, number, number, number][];
    voltagePattern: string;
    minimumVoltageKv?: number;
  }
> = {
  KR: {
    bboxes: [[33, 124, 39, 132]],
    voltagePattern: "^(154000|345000|765000)$",
  },
  JP: {
    bboxes: [[24, 123, 46, 146]],
    voltagePattern: "^(110000|132000|154000|187000|220000|275000|500000|1000000)$",
  },
  TW: {
    bboxes: [[21.5, 119, 25.8, 123]],
    voltagePattern: "^(69000|161000|345000)$",
  },
  CN: {
    bboxes: [
      [18, 73, 37, 105],
      [37, 73, 54, 105],
      [18, 105, 37, 122],
      [37, 105, 54, 122],
      [18, 122, 37, 135],
      [37, 122, 54, 135],
    ],
    voltagePattern:
      "^(110000|132000|220000|330000|350000|400000|500000|660000|750000|800000|1000000|1100000)$",
    minimumVoltageKv: 500,
  },
};

fs.mkdirSync(RAW_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const countryBoundaries = new Map<CountryCode, BoundaryGeometry>();
if (fs.existsSync(BOUNDARIES_PATH)) {
  const boundaryData = JSON.parse(fs.readFileSync(BOUNDARIES_PATH, "utf8")) as {
    features: BoundaryGeometry[];
  };
  for (const boundary of boundaryData.features) {
    countryBoundaries.set(boundary.country, boundary);
  }
}
const missingEastAsiaBoundaries = (["KR", "JP", "TW", "CN"] as const).filter(
  (country) => !countryBoundaries.has(country),
);
if (missingEastAsiaBoundaries.length) {
  throw new Error(
    `Country boundary required before detail build: ${missingEastAsiaBoundaries.join(", ")}`,
  );
}

function pointInCountry(country: CountryCode, point: [number, number]): boolean {
  const boundary = countryBoundaries.get(country);
  if (!boundary) throw new Error(`Country boundary missing: ${country}`);
  return pointBelongsToBoundary(point, boundary);
}

async function download(url: string, destination: string): Promise<void> {
  if (fs.existsSync(destination) && fs.statSync(destination).size > 0) return;
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`Download failed ${response.status}: ${url}`);
  fs.writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
}

async function cachedJson<T>(url: string, destination: string): Promise<T> {
  if (fs.existsSync(destination) && fs.statSync(destination).size > 0) {
    return JSON.parse(fs.readFileSync(destination, "utf8")) as T;
  }
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`JSON download failed ${response.status}: ${url}`);
  const json = (await response.json()) as T;
  fs.writeFileSync(destination, JSON.stringify(json));
  return json;
}

function finiteNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/,/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function simplifyLine(
  coordinates: [number, number][],
  maximumPoints = 100,
): [number, number][] {
  if (coordinates.length <= maximumPoints) return coordinates;
  const step = Math.ceil(coordinates.length / maximumPoints);
  const simplified = coordinates.filter((_, index) => index % step === 0);
  const last = coordinates.at(-1);
  if (last && simplified.at(-1) !== last) simplified.push(last);
  return simplified;
}

function fuelFromText(raw: unknown): GenerationFuel {
  const value = String(raw ?? "").toLowerCase();
  if (value.includes("solar") || value.includes("sun")) return "solar";
  if (value.includes("natural gas") || value === "gas" || value.includes("lng")) return "gas";
  if (value.includes("hydro") || value.includes("water")) return "hydro";
  if (value.includes("wind")) return "wind";
  if (value.includes("nuclear") || value.includes("uranium")) return "nuclear";
  if (value.includes("coal") || value.includes("lignite")) return "coal";
  if (
    value.includes("petroleum") ||
    value.includes("oil") ||
    value.includes("diesel") ||
    value.includes("distillate")
  ) {
    return "oil";
  }
  if (
    value.includes("biomass") ||
    value.includes("wood") ||
    value.includes("waste") ||
    value.includes("biogas")
  ) {
    return "biomass";
  }
  if (
    value.includes("battery") ||
    value.includes("storage") ||
    value.includes("flywheel")
  ) {
    return "storage";
  }
  if (value.includes("geothermal")) return "geothermal";
  return "other";
}

type PeeringDbFacility = {
  id: number;
  name: string;
  org_name?: string;
  city?: string;
  country: CountryCode;
  latitude?: number;
  longitude?: number;
  net_count?: number;
  ix_count?: number;
  status?: string;
};

async function buildPeeringDbPoints(
  country: CountryCode,
): Promise<DetailedInfrastructurePoint[]> {
  const result = await cachedJson<{ data: PeeringDbFacility[] }>(
    `https://www.peeringdb.com/api/fac?country=${country}&limit=5000`,
    path.join(RAW_DIR, `peeringdb-${country.toLowerCase()}.json`),
  );
  const points: DetailedInfrastructurePoint[] = [];
  for (const facility of result.data) {
    const lon = finiteNumber(facility.longitude);
    const lat = finiteNumber(facility.latitude);
    if (lon === undefined || lat === undefined || facility.status !== "ok") continue;
    const base = {
      country,
      name: facility.name,
      coordinates: [lon, lat] as [number, number],
      operator: facility.org_name,
      owner: facility.org_name,
      city: facility.city,
      networkCount: finiteNumber(facility.net_count) ?? 0,
      ixCount: finiteNumber(facility.ix_count) ?? 0,
      sourceLabel: "PeeringDB public facility record",
      sourceUrl: `https://www.peeringdb.com/fac/${facility.id}`,
    };
    points.push({
      ...base,
      id: `pdb-dc-${facility.id}`,
      kind: "data_center",
    });
    if ((facility.ix_count ?? 0) > 0) {
      points.push({
        ...base,
        id: `pdb-hub-${facility.id}`,
        kind: "network_hub",
      });
    }
  }
  return points;
}

type PlantAggregate = {
  plantId: string;
  name: string;
  operator: string;
  state: string;
  county: string;
  coordinates: [number, number];
  capacityMw: number;
  fuelCapacity: Map<GenerationFuel, number>;
  status: string;
  planned: boolean;
};

async function buildEiaPlants(): Promise<DetailedInfrastructurePoint[]> {
  const workbookPath = path.join(RAW_DIR, "eia860m-june-2026.xlsx");
  await download(EIA_860M_URL, workbookPath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookPath);
  const plants = new Map<string, PlantAggregate>();

  const consumeSheet = (sheetName: "Operating" | "Planned", planned: boolean) => {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) throw new Error(`Missing EIA worksheet: ${sheetName}`);
    const headerRow = sheet.getRow(3);
    const header = new Map<string, number>();
    headerRow.eachCell((cell, columnNumber) => {
      header.set(String(cell.value ?? "").trim(), columnNumber);
    });
    const column = (name: string) => {
      const index = header.get(name);
      if (!index) throw new Error(`Missing EIA column ${name} in ${sheetName}`);
      return index;
    };
    const latColumn = column("Latitude");
    const lonColumn = column("Longitude");
    const capacityColumn = column("Nameplate Capacity (MW)");
    const statusColumn = column("Status");
    const technologyColumn = column("Technology");
    const plantIdColumn = column("Plant ID");
    const plantNameColumn = column("Plant Name");
    const operatorColumn = column("Entity Name");
    const stateColumn = column("Plant State");
    const countyColumn = column("County");

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 3) return;
      const lon = finiteNumber(row.getCell(lonColumn).value);
      const lat = finiteNumber(row.getCell(latColumn).value);
      const capacity = finiteNumber(row.getCell(capacityColumn).value) ?? 0;
      const plantId = String(row.getCell(plantIdColumn).value ?? "").trim();
      if (!plantId || lon === undefined || lat === undefined || capacity <= 0) return;
      const fuel = fuelFromText(row.getCell(technologyColumn).value);
      const current = plants.get(plantId) ?? {
        plantId,
        name: String(row.getCell(plantNameColumn).value ?? `EIA plant ${plantId}`),
        operator: String(row.getCell(operatorColumn).value ?? ""),
        state: String(row.getCell(stateColumn).value ?? ""),
        county: String(row.getCell(countyColumn).value ?? ""),
        coordinates: [lon, lat] as [number, number],
        capacityMw: 0,
        fuelCapacity: new Map<GenerationFuel, number>(),
        status: String(row.getCell(statusColumn).value ?? ""),
        planned,
      };
      current.capacityMw += capacity;
      current.fuelCapacity.set(fuel, (current.fuelCapacity.get(fuel) ?? 0) + capacity);
      if (!planned) current.planned = false;
      plants.set(plantId, current);
    });
  };

  consumeSheet("Operating", false);
  consumeSheet("Planned", true);

  return [...plants.values()].map((plant) => {
    const fuel =
      [...plant.fuelCapacity.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "other";
    return {
      id: `eia-plant-${plant.plantId}`,
      country: "US",
      kind: "power_plant",
      name: plant.name,
      coordinates: plant.coordinates,
      operator: plant.operator || undefined,
      owner: plant.operator || undefined,
      city: plant.county || undefined,
      region: plant.state || undefined,
      capacityMw: Math.round(plant.capacityMw * 10) / 10,
      fuel,
      status: plant.status || undefined,
      planned: plant.planned,
      sourceLabel: "EIA-860M June 2026",
      sourceUrl: EIA_860M_PAGE,
    };
  });
}

type ArcGisFeature = {
  properties: Record<string, unknown>;
  geometry:
    | { type: "LineString"; coordinates: [number, number][] }
    | { type: "MultiLineString"; coordinates: [number, number][][] }
    | null;
};

async function fetchArcGisFeatures(
  service: string,
  cacheName: string,
  where: string,
  outFields: string,
  maximumRecords?: number,
): Promise<ArcGisFeature[]> {
  const cachePath = path.join(RAW_DIR, cacheName);
  if (fs.existsSync(cachePath) && fs.statSync(cachePath).size > 0) {
    return JSON.parse(fs.readFileSync(cachePath, "utf8")) as ArcGisFeature[];
  }
  const features: ArcGisFeature[] = [];
  const pageSize = 2000;
  for (let offset = 0; ; offset += pageSize) {
    const params = new URLSearchParams({
      where,
      outFields,
      returnGeometry: "true",
      outSR: "4326",
      maxAllowableOffset: "0.03",
      geometryPrecision: "3",
      orderByFields: service === EIA_PIPELINE_SERVICE ? "FID ASC" : "OBJECTID_1 ASC",
      resultOffset: String(offset),
      resultRecordCount: String(
        maximumRecords ? Math.min(pageSize, maximumRecords - offset) : pageSize,
      ),
      f: "geojson",
    });
    let page: { features?: ArcGisFeature[]; error?: unknown } | undefined;
    let lastStatus = 0;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${service}/query?${params}`, {
        headers: { "User-Agent": USER_AGENT },
      });
      lastStatus = response.status;
      if (response.ok) {
        page = (await response.json()) as {
          features?: ArcGisFeature[];
          error?: unknown;
        };
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 800 * 2 ** attempt));
    }
    if (!page) throw new Error(`ArcGIS query failed ${lastStatus}: ${service}`);
    if (!page.features) throw new Error(`ArcGIS response missing features: ${service}`);
    features.push(...page.features);
    if (
      page.features.length < pageSize ||
      (maximumRecords !== undefined && features.length >= maximumRecords)
    ) {
      break;
    }
  }
  const result = maximumRecords ? features.slice(0, maximumRecords) : features;
  fs.writeFileSync(cachePath, JSON.stringify(result));
  return result;
}

function geometryLines(feature: ArcGisFeature): [number, number][][] {
  if (!feature.geometry) return [];
  if (feature.geometry.type === "LineString") {
    return [simplifyLine(feature.geometry.coordinates)];
  }
  return feature.geometry.coordinates.map((line) => simplifyLine(line));
}

async function buildUsGrid(): Promise<DetailedInfrastructureLine[]> {
  const features = await fetchArcGisFeatures(
    HIFLD_GRID_SERVICE,
    "hifld-grid-345kv.geojson.json",
    "VOLTAGE >= 345",
    "ID,OWNER,VOLTAGE,VOLT_CLASS,STATUS",
  );
  const lines: DetailedInfrastructureLine[] = [];
  for (const [featureIndex, feature] of features.entries()) {
    const segments = geometryLines(feature);
    for (const [segmentIndex, coordinates] of segments.entries()) {
      if (coordinates.length < 2) continue;
      const id = String(feature.properties.ID ?? featureIndex);
      const voltage = finiteNumber(feature.properties.VOLTAGE);
      const owner = String(feature.properties.OWNER ?? "").trim();
      lines.push({
        id: `hifld-grid-${id}-${segmentIndex}`,
        country: "US",
        kind: "transmission",
        name: voltage ? `${voltage} kV transmission line` : "High-voltage transmission line",
        coordinates,
        owner: owner || undefined,
        operator: owner || undefined,
        voltageKv: voltage,
        status: String(feature.properties.STATUS ?? "") || undefined,
        sourceLabel: "HIFLD Electric Power Transmission Lines",
        sourceUrl:
          "https://hifld-geoplatform.hub.arcgis.com/datasets/electric-power-transmission-lines",
      });
    }
  }
  return lines;
}

async function buildUsPipelines(): Promise<DetailedInfrastructureLine[]> {
  const features = await fetchArcGisFeatures(
    EIA_PIPELINE_SERVICE,
    "eia-natural-gas-pipelines.geojson.json",
    "1=1",
    "FID,TYPEPIPE,Operator,Status",
  );
  const groups = new Map<
    string,
    {
      operator: string;
      type: string;
      status: string;
      segments: [number, number][][];
    }
  >();
  for (const feature of features) {
    const operator = String(feature.properties.Operator ?? "Unspecified operator").trim();
    const type = String(feature.properties.TYPEPIPE ?? "Pipeline").trim();
    const status = String(feature.properties.Status ?? "").trim();
    const key = `${operator}::${type}::${status}`;
    const group = groups.get(key) ?? { operator, type, status, segments: [] };
    group.segments.push(...geometryLines(feature).filter((line) => line.length >= 2));
    groups.set(key, group);
  }
  return [...groups.values()]
    .filter((group) => group.segments.length > 0)
    .map((group, index) => ({
      id: `eia-gas-pipeline-${index}`,
      country: "US",
      kind: "pipeline",
      name: `${group.operator} · ${group.type}`,
      coordinates: group.segments[0],
      segments: group.segments,
      owner: group.operator,
      operator: group.operator,
      substance: "natural gas",
      status: group.status || undefined,
      sourceLabel: "EIA/HIFLD Natural Gas Interstate and Intrastate Pipelines",
      sourceUrl: "https://www.eia.gov/maps/layer_info-m.php",
    }));
}

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  geometry?: Array<{ lat: number; lon: number }>;
  tags?: Record<string, string>;
};

async function overpass(
  query: string,
  cacheName: string,
): Promise<{ elements: OverpassElement[] }> {
  const cachePath = path.join(RAW_DIR, cacheName);
  if (fs.existsSync(cachePath) && fs.statSync(cachePath).size > 0) {
    return JSON.parse(fs.readFileSync(cachePath, "utf8")) as { elements: OverpassElement[] };
  }
  let lastError: unknown;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": USER_AGENT,
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(240_000),
      });
      if (!response.ok) throw new Error(`Overpass ${response.status}`);
      const json = (await response.json()) as { elements: OverpassElement[] };
      fs.writeFileSync(cachePath, JSON.stringify(json));
      return json;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function parseCapacityMw(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const match = raw.replace(/,/g, "").match(/([\d.]+)\s*(GW|MW|kW|W)?/i);
  if (!match) return undefined;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return undefined;
  const unit = (match[2] ?? "MW").toUpperCase();
  if (unit === "GW") return value * 1000;
  if (unit === "KW") return value / 1000;
  if (unit === "W") return value / 1_000_000;
  return value;
}

async function buildEastAsiaOsm(
  country: Exclude<CountryCode, "US">,
): Promise<{
  points: DetailedInfrastructurePoint[];
  lines: DetailedInfrastructureLine[];
}> {
  const config = EAST_ASIA_CONFIG[country];
  const lineElements = new Map<string, OverpassElement>();
  const plantElements = new Map<string, OverpassElement>();
  for (const [tileIndex, tile] of config.bboxes.entries()) {
    const bbox = tile.join(",");
    const lineQuery = `[out:json][timeout:220][maxsize:536870912];(
      way["power"="line"]["voltage"~"${config.voltagePattern}"](${bbox});
      way["man_made"="pipeline"]["substance"~"^(gas|oil|natural_gas|petroleum|lng|naphtha)$",i](${bbox});
    );out tags geom;`;
    const plantQuery = `[out:json][timeout:220][maxsize:268435456];
      nwr["power"="plant"](${bbox});
      out center tags;`;
    const suffix = config.bboxes.length === 1 ? "" : `-${tileIndex + 1}`;
    const [lineResult, plantResult] = await Promise.all([
      overpass(lineQuery, `osm-lines-${country.toLowerCase()}${suffix}.json`),
      overpass(plantQuery, `osm-plants-${country.toLowerCase()}${suffix}.json`),
    ]);
    for (const element of lineResult.elements) {
      lineElements.set(`${element.type}-${element.id}`, element);
    }
    for (const element of plantResult.elements) {
      plantElements.set(`${element.type}-${element.id}`, element);
    }
  }

  const lines: DetailedInfrastructureLine[] = [];
  for (const element of lineElements.values()) {
    const coordinates = (element.geometry ?? [])
      .map(({ lon, lat }) => [lon, lat] as [number, number])
      .filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat));
    if (coordinates.length < 2) continue;
    if (!coordinates.some((coordinate) => pointInCountry(country, coordinate))) continue;
    const tags = element.tags ?? {};
    const isGrid = tags.power === "line";
    const voltage =
      tags.voltage
        ?.split(";")
        .map((value) => finiteNumber(value))
        .filter((value): value is number => value !== undefined)
        .sort((a, b) => b - a)[0] ?? undefined;
    const displayVoltage = voltage ? voltage / 1000 : undefined;
    if (
      isGrid &&
      config.minimumVoltageKv !== undefined &&
      (displayVoltage === undefined || displayVoltage < config.minimumVoltageKv)
    ) {
      continue;
    }
    lines.push({
      id: `osm-${country.toLowerCase()}-${element.type}-${element.id}`,
      country,
      kind: isGrid ? "transmission" : "pipeline",
      name:
        tags.name ??
        (isGrid
          ? displayVoltage
            ? `${displayVoltage} kV transmission line`
            : "OSM high-voltage transmission line"
          : "OSM energy pipeline"),
      coordinates: simplifyLine(coordinates, 120),
      operator: tags.operator,
      owner: tags.owner,
      voltageKv: displayVoltage,
      substance: tags.substance,
      status: tags.status,
      sourceLabel: "OpenStreetMap public infrastructure tags",
      sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    });
  }

  const points: DetailedInfrastructurePoint[] = [];
  for (const element of plantElements.values()) {
    const lon = finiteNumber(element.lon ?? element.center?.lon);
    const lat = finiteNumber(element.lat ?? element.center?.lat);
    if (lon === undefined || lat === undefined) continue;
    if (!pointInCountry(country, [lon, lat])) continue;
    const tags = element.tags ?? {};
    points.push({
      id: `osm-plant-${country.toLowerCase()}-${element.type}-${element.id}`,
      country,
      kind: "power_plant",
      name: tags.name ?? tags["name:en"] ?? `OSM power plant ${element.id}`,
      coordinates: [lon, lat],
      operator: tags.operator,
      owner: tags.owner,
      capacityMw: parseCapacityMw(tags["plant:output:electricity"]),
      fuel: fuelFromText(
        tags["plant:source"] ?? tags["generator:source"] ?? tags["source"],
      ),
      status: tags["operational_status"] ?? tags.status,
      sourceLabel: "OpenStreetMap public power plant record",
      sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    });
  }
  return { points, lines };
}

function writeCountry(dataset: CountryInfrastructureDetail): void {
  const output = path.join(OUTPUT_DIR, `${dataset.country.toLowerCase()}.json`);
  fs.writeFileSync(output, JSON.stringify(dataset));
  const sizeMb = fs.statSync(output).size / 1024 / 1024;
  console.log(
    `[detail] ${dataset.country}: ${dataset.points.length} points, ${dataset.lines.length} line groups, ${sizeMb.toFixed(2)} MB`,
  );
}

async function main(): Promise<void> {
  const peeringPoints = new Map<CountryCode, DetailedInfrastructurePoint[]>();
  await Promise.all(
    COUNTRY_CODES.map(async (country) => {
      peeringPoints.set(country, await buildPeeringDbPoints(country));
    }),
  );

  const [usPlants, usGrid, usPipelines] = await Promise.all([
    buildEiaPlants(),
    buildUsGrid(),
    buildUsPipelines(),
  ]);
  writeCountry({
    version: VERSION,
    generatedAt: GENERATED_AT,
    country: "US",
    scopeNote:
      "Public nationwide records: EIA operating/planned generation, HIFLD ≥345 kV transmission, EIA/HIFLD gas pipelines, and PeeringDB facilities.",
    sources: [
      {
        label: "EIA-860M June 2026",
        url: EIA_860M_PAGE,
        attribution: "U.S. Energy Information Administration",
        retrievedAt: GENERATED_AT,
      },
      {
        label: "HIFLD Electric Power Transmission Lines",
        url: HIFLD_GRID_SERVICE,
        attribution: "HIFLD open public data",
        retrievedAt: GENERATED_AT,
      },
      {
        label: "EIA/HIFLD Natural Gas Pipelines",
        url: EIA_PIPELINE_SERVICE,
        attribution: "EIA/HIFLD open public data",
        retrievedAt: GENERATED_AT,
      },
      {
        label: "PeeringDB facilities",
        url: PEERINGDB_PAGE,
        attribution: "PeeringDB public interconnection data",
        retrievedAt: GENERATED_AT,
      },
    ],
    points: [...usPlants, ...(peeringPoints.get("US") ?? [])],
    lines: [...usGrid, ...usPipelines],
  });

  for (const country of ["KR", "JP", "TW", "CN"] as const) {
    const osm = await buildEastAsiaOsm(country);
    writeCountry({
      version: VERSION,
      generatedAt: GENERATED_AT,
      country,
      scopeNote:
        "Source-published public records only: OSM power plants, tagged high-voltage lines and energy pipelines clipped to the country boundary, plus PeeringDB public facilities.",
      sources: [
        {
          label: "OpenStreetMap public infrastructure tags",
          url: "https://www.openstreetmap.org/copyright",
          attribution: "© OpenStreetMap contributors, ODbL",
          retrievedAt: GENERATED_AT,
        },
        {
          label: "PeeringDB facilities",
          url: PEERINGDB_PAGE,
          attribution: "PeeringDB public interconnection data",
          retrievedAt: GENERATED_AT,
        },
      ],
      points: [...osm.points, ...(peeringPoints.get(country) ?? [])],
      lines: osm.lines,
    });
  }
}

main().catch((error) => {
  console.error("[detail] build failed:", error);
  process.exit(1);
});
