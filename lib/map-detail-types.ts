import type { CountryCode, InfrastructureLayer } from "./atlas-types";

export type GenerationFuel =
  | "solar"
  | "gas"
  | "hydro"
  | "wind"
  | "oil"
  | "biomass"
  | "storage"
  | "coal"
  | "geothermal"
  | "nuclear"
  | "other";

export type DetailedInfrastructurePoint = {
  id: string;
  country: CountryCode;
  kind: Extract<InfrastructureLayer, "power_plant" | "data_center" | "network_hub">;
  name: string;
  coordinates: [number, number];
  operator?: string;
  owner?: string;
  city?: string;
  region?: string;
  capacityMw?: number;
  fuel?: GenerationFuel;
  status?: string;
  planned?: boolean;
  networkCount?: number;
  ixCount?: number;
  sourceLabel: string;
  sourceUrl: string;
};

export type DetailedInfrastructureLine = {
  id: string;
  country: CountryCode;
  kind: Extract<InfrastructureLayer, "transmission" | "pipeline">;
  name: string;
  coordinates: [number, number][];
  segments?: [number, number][][];
  operator?: string;
  owner?: string;
  voltageKv?: number;
  substance?: string;
  status?: string;
  planned?: boolean;
  sourceLabel: string;
  sourceUrl: string;
};

export type CountryInfrastructureDetail = {
  version: string;
  generatedAt: string;
  country: CountryCode;
  scopeNote: string;
  sources: Array<{
    label: string;
    url: string;
    attribution: string;
    retrievedAt: string;
  }>;
  points: DetailedInfrastructurePoint[];
  lines: DetailedInfrastructureLine[];
};

export type DetailMapFilters = {
  minimumCapacityMw: 0 | 50 | 100;
  generationFuel: GenerationFuel | "all";
  networkMode: "all" | "ix" | "net50" | "net200";
  includePlanned: boolean;
  showDensity: boolean;
};
