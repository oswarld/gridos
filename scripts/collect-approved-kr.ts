/**
 * Fetches the two approved Korean official sources into CI artifacts.
 *
 * Security boundary:
 * - the service key is read only in Node/CI;
 * - no key or authenticated URL is logged or written to output;
 * - KEPCO's anonymized substation identifier stays admin-area-only;
 * - no coordinate is generated or inferred.
 *
 * Promotion into Supabase is intentionally separate from collection so schema,
 * disclosure, record counts, and unexpected source changes can be validated first.
 */
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const KPX_DEFAULT =
  "https://apis.data.go.kr/B552115/PowerMarketGenInfo/getPowerMarketGenInfo";
const KEPCO_DEFAULT =
  "https://api.odcloud.kr/api/15128065/v1/uddi:3a841aea-8d81-499a-a82a-ac6588c35b88";

function loadLocalEnv() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].trim().replace(/^"|"$/g, "");
  }
}

function requiredServiceKey(): string {
  const decoded = process.env.PUBLIC_DATA_SERVICE_KEY;
  const encoded = process.env.PUBLIC_DATA_SERVICE_ENCODED_KEY;
  if (decoded) return decoded;
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return encoded;
    }
  }
  throw new Error("PUBLIC_DATA_SERVICE_KEY is required");
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.map(asRecord);
  if (value && typeof value === "object") return [asRecord(value)];
  return [];
}

async function fetchJson(url: URL): Promise<Record<string, unknown>> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`official API request failed (${response.status})`);
  }
  try {
    return asRecord(JSON.parse(text));
  } catch {
    throw new Error("official API returned a non-JSON response");
  }
}

async function collectKpx(serviceKey: string) {
  const endpoint = process.env.KPX_GENERATION_API_URL || KPX_DEFAULT;
  const rows: Record<string, unknown>[] = [];
  let pageNo = 1;
  let totalCount = Infinity;
  const perPage = 1000;

  while (rows.length < totalCount) {
    const url = new URL(endpoint);
    url.searchParams.set("serviceKey", serviceKey);
    url.searchParams.set("numOfRows", String(perPage));
    url.searchParams.set("pageNo", String(pageNo));
    url.searchParams.set("dataType", "json");
    const payload = await fetchJson(url);
    const response = asRecord(payload.response);
    const header = asRecord(response.header);
    if (header.resultCode && String(header.resultCode) !== "00") {
      throw new Error(`KPX API rejected the request (${String(header.resultCode)})`);
    }
    const body = asRecord(response.body);
    const itemsNode = asRecord(body.items);
    const pageRows = asArray(itemsNode.item ?? body.items);
    totalCount = Number(body.totalCount ?? pageRows.length);
    rows.push(...pageRows);
    if (!pageRows.length || pageRows.length < perPage) break;
    pageNo += 1;
  }

  if (!rows.length) throw new Error("KPX returned zero records");
  return rows.map((row, index) => {
    const canonicalName = String(row.genNm ?? "");
    const capacityValue = Number(row.pcap);
    const reviewReasons: string[] = [];
    if (!canonicalName) reviewReasons.push("missing_name");
    if (!Number.isFinite(capacityValue) || capacityValue < 0) {
      reviewReasons.push("invalid_capacity");
    }
    if (/테스트|test|dummy/i.test(canonicalName)) {
      reviewReasons.push("test_or_dummy_name");
    }
    return {
      sourceRecordKey: String(row.rn ?? `${index + 1}`),
      entityKind: "facility",
      assetKind: "power_plant",
      countryCode: "KR",
      canonicalName,
      operatorName: String(row.company ?? ""),
      regionLabel: String(row.area ?? ""),
      dispatchType: String(row.cent ?? ""),
      generationSource: String(row.genSrc ?? ""),
      generationForm: String(row.genFom ?? ""),
      fuel: String(row.fuel ?? ""),
      capacityValue,
      capacityUnit: "MW",
      disclosureLevel: "admin_area_only",
      geometry: null,
      publicationStatus: reviewReasons.length ? "review_required" : "candidate",
      reviewReasons,
      source: row,
    };
  });
}

async function collectKepco(serviceKey: string) {
  const endpoint = process.env.KEPCO_SUBSTATION_API_URL || KEPCO_DEFAULT;
  const rows: Record<string, unknown>[] = [];
  const perPage = 1000;
  let page = 1;
  let totalCount = Infinity;

  while (rows.length < totalCount) {
    const url = new URL(endpoint);
    url.searchParams.set("serviceKey", serviceKey);
    url.searchParams.set("page", String(page));
    url.searchParams.set("perPage", String(perPage));
    url.searchParams.set("returnType", "JSON");
    const payload = await fetchJson(url);
    const pageRows = asArray(payload.data);
    totalCount = Number(payload.matchCount ?? payload.totalCount ?? pageRows.length);
    rows.push(...pageRows);
    if (!pageRows.length || pageRows.length < perPage) break;
    page += 1;
  }

  if (!rows.length) throw new Error("KEPCO returned zero records");
  return rows.map((row, index) => {
    const adminArea1 = String(row["시도"] ?? "");
    const adminArea2 = String(row["시군구"] ?? "");
    const adminArea3 = String(row["읍면동"] ?? "");
    const anonymizedSupplySubstation = String(row["공급변전소"] ?? "");
    const reviewReasons: string[] = [];
    if (!adminArea1 || !adminArea2 || !adminArea3) reviewReasons.push("missing_admin_area");
    if (!anonymizedSupplySubstation.includes("*")) {
      reviewReasons.push("anonymization_marker_missing");
    }
    return {
      sourceRecordKey: String(index + 1),
      entityKind: "facility",
      assetKind: "substation",
      countryCode: "KR",
      adminArea1,
      adminArea2,
      adminArea3,
      anonymizedSupplySubstation,
      disclosureLevel: "admin_area_only",
      geometry: null,
      publicationStatus: reviewReasons.length ? "review_required" : "candidate",
      reviewReasons,
      source: row,
    };
  });
}

function sha256(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  loadLocalEnv();
  const serviceKey = requiredServiceKey();
  const retrievedAt = new Date().toISOString();
  const stamp = retrievedAt.replace(/[:.]/g, "-");
  const [kpx, kepco] = await Promise.all([
    collectKpx(serviceKey),
    collectKepco(serviceKey),
  ]);
  if ([...kpx, ...kepco].some((record) => record.geometry !== null)) {
    throw new Error("collection boundary violation: generated geometry detected");
  }

  const kpxEnvelope = {
    datasetId: "kr_kpx_power_market_generation_units",
    sourceUrl: "https://www.data.go.kr/data/15099767/openapi.do",
    retrievedAt,
    disclosureLevel: "admin_area_only",
    recordCount: kpx.length,
    reviewRequiredCount: kpx.filter(
      (record) => record.publicationStatus === "review_required",
    ).length,
    checksumSha256: sha256(kpx),
    records: kpx,
  };
  const kepcoEnvelope = {
    datasetId: "kr_kepco_available_substations_by_admin_area",
    sourceUrl: "https://www.data.go.kr/data/15128065/fileData.do",
    retrievedAt,
    disclosureLevel: "admin_area_only",
    recordCount: kepco.length,
    reviewRequiredCount: kepco.filter(
      (record) => record.publicationStatus === "review_required",
    ).length,
    checksumSha256: sha256(kepco),
    records: kepco,
  };

  writeJson(
    path.join(ROOT, "data", "raw", "official", "kpx-generation", `${stamp}.json`),
    kpxEnvelope,
  );
  writeJson(
    path.join(ROOT, "data", "raw", "official", "kepco-substations", `${stamp}.json`),
    kepcoEnvelope,
  );
  writeJson(path.join(ROOT, "data", "normalized", "kr-official-atlas-staging.json"), {
    schemaVersion: 1,
    retrievedAt,
    datasets: [kpxEnvelope, kepcoEnvelope],
  });

  console.log(`[official-data] collected KPX=${kpx.length}, KEPCO=${kepco.length}`);
  console.log("[official-data] no coordinates were generated or inferred");
}

main().catch((error) => {
  console.error(
    `[official-data] failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
});
