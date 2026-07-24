import type { Locale } from "./i18n";

export const COUNTRY_CODES = ["KR", "JP", "TW", "CN", "US"] as const;
export type CountryCode = (typeof COUNTRY_CODES)[number];

export const INFRASTRUCTURE_LAYERS = [
  "power_plant",
  "data_center",
  "network_hub",
  "transmission",
  "pipeline",
] as const;
export type InfrastructureLayer = (typeof INFRASTRUCTURE_LAYERS)[number];

export type LocalizedText = Record<Locale, string>;

export type AtlasSource = {
  id: string;
  country?: CountryCode;
  publisher: string;
  title: string;
  url: string;
  kind: "official" | "operator" | "exchange" | "open_data" | "boundary";
  asOf?: string;
  retrievedAt: string;
  licenseNote?: string;
  coverageNote?: string;
};

export type ListedSecurity = {
  exchange: string;
  ticker: string;
  name: string;
  currency: string;
  relationship: "direct" | "parent" | "shareholder";
  sourceId: string;
};

export type AtlasEntity = {
  id: string;
  name: string;
  country: CountryCode;
  website?: string;
  description?: LocalizedText;
  parentEntityIds?: string[];
  securities?: ListedSecurity[];
};

export type AtlasFacility = {
  id: string;
  country: CountryCode;
  kind: Extract<InfrastructureLayer, "power_plant" | "data_center" | "network_hub">;
  name: string;
  coordinates: [number, number];
  disclosureLevel: "exact_public" | "generalized_public";
  locationNote: LocalizedText;
  operatorEntityId?: string;
  ownerEntityIds?: string[];
  connectionIds?: string[];
  sourceIds: string[];
  osmUrl?: string;
  capacityMw?: number;
};

export type AtlasLinearFeature = {
  id: string;
  country: CountryCode;
  kind: Extract<InfrastructureLayer, "transmission" | "pipeline">;
  name: string;
  coordinates: [number, number][];
  disclosureLevel: "exact_public";
  operator?: string;
  owner?: string;
  voltage?: string;
  substance?: string;
  sourceIds: string[];
  osmUrl: string;
};

export type RegionalBalance = {
  id: string;
  country: CountryCode;
  name: LocalizedText;
  demand: { value: number | null; unit: string; label: LocalizedText };
  supply: { value: number | null; unit: string; label: LocalizedText };
  period: string;
  sourceIds: string[];
  methodology: LocalizedText;
  comparableWithinCountry: boolean;
};

export type CountryCoverage = {
  country: CountryCode;
  facilityCount: number;
  linearFeatureCount: number;
  regionCount: number;
  note: LocalizedText;
};

export type PublicAtlas = {
  version: string;
  generatedAt: string;
  coverageNote: LocalizedText;
  sources: AtlasSource[];
  entities: AtlasEntity[];
  facilities: AtlasFacility[];
  linearFeatures: AtlasLinearFeature[];
  regions: RegionalBalance[];
  coverage: CountryCoverage[];
};

export type BoundaryGeometry = {
  country: CountryCode;
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
};

export type AdminBoundaryGeometry = BoundaryGeometry & {
  id: string;
  name: LocalizedText;
  postal?: string;
  label?: [number, number];
};

export type AtlasBoundaries = {
  source: {
    title: string;
    url: string;
    license: string;
    retrievedAt: string;
  };
  features: BoundaryGeometry[];
  admin1: AdminBoundaryGeometry[];
};
