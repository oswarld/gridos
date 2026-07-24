import * as fs from "node:fs";
import * as path from "node:path";
import type {
  AtlasEntity,
  AtlasFacility,
  AtlasLinearFeature,
  AtlasSource,
  CountryCode,
  LocalizedText,
  PublicAtlas,
  RegionalBalance,
} from "../lib/atlas-types";
import { COUNTRY_CODES } from "../lib/atlas-types";

const ROOT = path.resolve(__dirname, "..");
const RAW_OSM_DIR = path.join(ROOT, "data", "raw", "osm-atlas");
const RAW_PUBLIC_DIR = path.join(ROOT, "data", "raw", "atlas-public");
const PROCESSED_DIR = path.join(ROOT, "data", "processed");
const RETRIEVED_AT = new Date().toISOString();

const localized = (
  ko: string,
  en: string,
  zh: string,
  ja: string,
): LocalizedText => ({ ko, en, "zh-CN": zh, ja });

const sources: AtlasSource[] = [
  {
    id: "osm-atlas-2026-07-23",
    publisher: "OpenStreetMap contributors",
    title: "Public OSM infrastructure ways — bounded source snapshots",
    url: "https://www.openstreetmap.org/copyright",
    kind: "open_data",
    asOf: "2026-07-23",
    retrievedAt: RETRIEVED_AT,
    licenseNote: "Open Data Commons Open Database License (ODbL) 1.0",
    coverageNote:
      "Small public map-API bounding boxes around the published facilities; not a national inventory.",
  },
  {
    id: "natural-earth-110m",
    publisher: "Natural Earth",
    title: "Admin 0 — Countries, 1:110m",
    url: "https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/",
    kind: "boundary",
    asOf: "Natural Earth 5.1.2",
    retrievedAt: RETRIEVED_AT,
    licenseNote: "Public domain",
  },
  {
    id: "kr-kea-demand",
    country: "KR",
    publisher: "한국에너지공단",
    title: "에너지다소비사업자 에너지 사용 현황 — 수전전력",
    url: "https://www.data.go.kr/data/15127341/fileData.do",
    kind: "official",
    asOf: "2024-12-31",
    retrievedAt: RETRIEVED_AT,
    coverageNote: "Large energy users only; not total regional electricity demand.",
  },
  {
    id: "kr-knrec-renewable",
    country: "KR",
    publisher: "한국에너지공단",
    title: "기초지자체별 신·재생에너지 보급 현황 — 발전량",
    url: "https://www.data.go.kr/data/15086292/fileData.do",
    kind: "official",
    asOf: "2024-12-31",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "jp-occto-demand-2026",
    country: "JP",
    publisher: "電力広域的運営推進機関 (OCCTO)",
    title: "2026年度 全国及び供給区域ごとの需要想定",
    url: "https://www.occto.or.jp/news/010743.html",
    kind: "official",
    asOf: "2026-01-21",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "jp-occto-supply-2026",
    country: "JP",
    publisher: "電力広域的運営推進機関 (OCCTO)",
    title: "2026年度供給計画の取りまとめ",
    url: "https://www.occto.or.jp/various/kyoukei/torimatome/260330_kyokyukeikaku_torimatome_1.html",
    kind: "official",
    asOf: "2026-03-30",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "tw-taipower-regional-2026",
    country: "TW",
    publisher: "台灣電力股份有限公司",
    title: "各區域間過去電力供需",
    url: "https://data.gov.tw/dataset/162596",
    kind: "open_data",
    asOf: "live 10-minute observation",
    retrievedAt: RETRIEVED_AT,
    licenseNote: "Open Government Data License, version 1.0",
  },
  {
    id: "us-eia-generation-2024",
    country: "US",
    publisher: "U.S. Energy Information Administration",
    title: "Electric Power Operational Data — generation by state",
    url: "https://www.eia.gov/opendata/browser/electricity/electric-power-operational-data",
    kind: "official",
    asOf: "2024",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "us-eia-sales-2024",
    country: "US",
    publisher: "U.S. Energy Information Administration",
    title: "Electricity retail sales by state",
    url: "https://www.eia.gov/opendata/browser/electricity/retail-sales",
    kind: "official",
    asOf: "2024",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "cn-nea-market-2024",
    country: "CN",
    publisher: "国家能源局",
    title: "2024年度中国电力市场发展报告",
    url: "https://www.nea.gov.cn/20250717/54ae0fdb11f04b39a5b670999c04ef81/2025071754ae0fdb11f04b39a5b670999c04ef81_19fe782a11f3aa40209907a80e3e692150.pdf",
    kind: "official",
    asOf: "2024",
    retrievedAt: RETRIEVED_AT,
    coverageNote:
      "National generation and total electricity consumption; provincial balance rows are not inferred.",
  },
  {
    id: "kinx-centers",
    country: "KR",
    publisher: "KINX",
    title: "KINX data center infrastructure",
    url: "https://www.kinx.net/infrastructure/dc/",
    kind: "operator",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "kinx-ix",
    country: "KR",
    publisher: "KINX",
    title: "KINX Internet Exchange service",
    url: "https://www.kinx.net/service/ix/",
    kind: "operator",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "krx-kinx",
    country: "KR",
    publisher: "Korea Exchange KIND",
    title: "KINX listed-company disclosure — 093320",
    url: "https://kind.krx.co.kr/external/2026/04/30/000236/20260430000564/00637.htm",
    kind: "exchange",
    asOf: "2026-04-30",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "equinix-sl1",
    publisher: "Equinix",
    title: "SL1 Seoul IBX data center",
    url: "https://www.equinix.com/data-centers/asia-pacific-colocation/korea-colocation/seoul-data-center/sl1",
    kind: "operator",
    country: "KR",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "equinix-ty11",
    publisher: "Equinix",
    title: "IBX Sustainability Quick Reference — TY11 address",
    url: "https://sustainability.equinix.com/wp-content/uploads/2022/04/GU_IBX-Sustainability-Quick-Reference_EN-LTR-1.pdf",
    kind: "operator",
    country: "JP",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "equinix-dc4",
    publisher: "Equinix",
    title: "DC4 Washington, D.C. IBX data center",
    url: "https://www.equinix.com/data-centers/americas-colocation/united-states-colocation/washington-dc-data-centers/dc4",
    kind: "operator",
    country: "US",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "equinix-ix",
    publisher: "Equinix",
    title: "Equinix Internet Exchange",
    url: "https://www.equinix.com/services/interconnection-services/internet-exchange",
    kind: "operator",
    country: "US",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "equinix-ticker",
    country: "US",
    publisher: "Equinix Investor Relations",
    title: "Equinix FAQ — Nasdaq ticker EQIX",
    url: "https://investor.equinix.com/about-equinix/faq",
    kind: "operator",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "ewp-ulsan",
    country: "KR",
    publisher: "한국동서발전",
    title: "국내 발전사업 — 울산발전본부",
    url: "https://www.ewp.co.kr/kor/subpage/content.html?pc=75UKJ6W8JNAST1Q0TC5U7VV8MXS7N74",
    kind: "operator",
    asOf: "2026",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "jera-kashima",
    country: "JP",
    publisher: "JERA",
    title: "Kashima Thermal Power Station",
    url: "https://www.jera.co.jp/en/corporate/business/thermal-power/list/kashima",
    kind: "operator",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "jera-ownership",
    country: "JP",
    publisher: "JERA",
    title: "Corporate profile and ownership",
    url: "https://www.jera.co.jp/en/corporate/about/com_outline",
    kind: "operator",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "jpix-otemachi",
    country: "JP",
    publisher: "JPIX",
    title: "JPIX Otemachi service site",
    url: "https://www.jpix.ad.jp/service/?p=3504",
    kind: "operator",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "kddi-stock",
    country: "JP",
    publisher: "KDDI",
    title: "Guide for Shareholders — securities code 9433",
    url: "https://www.kddi.com/english/corporate/ir/stock-rating/guide/",
    kind: "operator",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "chubu-stock",
    country: "JP",
    publisher: "Japan Exchange Group",
    title: "Listed company search — Chubu Electric Power 9502",
    url: "https://www2.jpx.co.jp/tseHpFront/StockSearch.do?callJorEFlg=1&method=topsearch&topSearchStr=9502",
    kind: "exchange",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "taipower-plants",
    country: "TW",
    publisher: "台灣電力股份有限公司",
    title: "Power plant map and list",
    url: "https://hc2.taipower.com.tw/2289/59899/59902/",
    kind: "operator",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "chief-locations",
    country: "TW",
    publisher: "Chief Telecom",
    title: "Chief Telecom locations and LY2 data center",
    url: "https://www.chief.com.tw/locations/",
    kind: "operator",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "chief-company",
    country: "TW",
    publisher: "Chief Telecom",
    title: "Company introduction — stock code 6561 and TPIX",
    url: "https://www.chief.com.tw/introduction/",
    kind: "operator",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "pge-diablo",
    country: "US",
    publisher: "Pacific Gas and Electric Company",
    title: "Diablo Canyon Power Plant",
    url: "https://www.pge.com/en/about/pge-systems/nuclear-power.html",
    kind: "operator",
    retrievedAt: RETRIEVED_AT,
  },
  {
    id: "pge-ticker",
    country: "US",
    publisher: "PG&E",
    title: "Diablo Canyon public meeting notice — PG&E Corp. NYSE: PCG",
    url: "https://www.pge.com/assets/pge/docs/about/pge-systems/dcdep-public-meeting-notice-03022023.pdf",
    kind: "operator",
    retrievedAt: RETRIEVED_AT,
  },
];

const entities: AtlasEntity[] = [
  {
    id: "kinx",
    country: "KR",
    name: "KINX",
    website: "https://www.kinx.net/",
    securities: [
      {
        exchange: "KOSDAQ",
        ticker: "093320",
        name: "KINX Inc.",
        currency: "KRW",
        relationship: "direct",
        sourceId: "krx-kinx",
      },
    ],
  },
  {
    id: "equinix",
    country: "US",
    name: "Equinix",
    website: "https://www.equinix.com/",
    securities: [
      {
        exchange: "Nasdaq",
        ticker: "EQIX",
        name: "Equinix, Inc.",
        currency: "USD",
        relationship: "direct",
        sourceId: "equinix-ticker",
      },
    ],
  },
  { id: "ewp", country: "KR", name: "한국동서발전", website: "https://www.ewp.co.kr/" },
  {
    id: "jera",
    country: "JP",
    name: "JERA",
    website: "https://www.jera.co.jp/en/",
    parentEntityIds: ["tepco-fp", "chubu-electric"],
  },
  { id: "tepco-fp", country: "JP", name: "TEPCO Fuel & Power" },
  {
    id: "chubu-electric",
    country: "JP",
    name: "Chubu Electric Power",
    securities: [
      {
        exchange: "Tokyo",
        ticker: "9502",
        name: "Chubu Electric Power Company",
        currency: "JPY",
        relationship: "shareholder",
        sourceId: "chubu-stock",
      },
    ],
  },
  {
    id: "jpix",
    country: "JP",
    name: "JPIX",
    website: "https://www.jpix.ad.jp/en/",
    parentEntityIds: ["kddi"],
  },
  {
    id: "kddi",
    country: "JP",
    name: "KDDI",
    securities: [
      {
        exchange: "Tokyo",
        ticker: "9433",
        name: "KDDI Corporation",
        currency: "JPY",
        relationship: "shareholder",
        sourceId: "kddi-stock",
      },
    ],
  },
  { id: "taipower", country: "TW", name: "Taiwan Power Company" },
  {
    id: "chief",
    country: "TW",
    name: "Chief Telecom",
    website: "https://www.chief.com.tw/",
    securities: [
      {
        exchange: "Taipei Exchange",
        ticker: "6561",
        name: "Chief Telecom Inc.",
        currency: "TWD",
        relationship: "direct",
        sourceId: "chief-company",
      },
    ],
  },
  {
    id: "pge-utility",
    country: "US",
    name: "Pacific Gas and Electric Company",
    parentEntityIds: ["pge-corp"],
  },
  {
    id: "pge-corp",
    country: "US",
    name: "PG&E Corporation",
    securities: [
      {
        exchange: "NYSE",
        ticker: "PCG",
        name: "PG&E Corporation",
        currency: "USD",
        relationship: "parent",
        sourceId: "pge-ticker",
      },
    ],
  },
];

const facilities: AtlasFacility[] = [
  {
    id: "kr-kinx-gwacheon",
    country: "KR",
    kind: "data_center",
    name: "KINX Gwacheon Data Center",
    coordinates: [126.9780954, 37.4167643],
    disclosureLevel: "generalized_public",
    locationNote: localized(
      "사업자 공개 주소를 도로 단위로 표시",
      "Shown at street level from the operator-published address",
      "依据运营商公开地址显示至道路级",
      "事業者公開住所を道路レベルで表示",
    ),
    operatorEntityId: "kinx",
    ownerEntityIds: ["kinx"],
    connectionIds: ["kr-kinx-ix"],
    sourceIds: ["kinx-centers", "kinx-ix"],
  },
  {
    id: "kr-kinx-ix",
    country: "KR",
    kind: "network_hub",
    name: "KINX IX · Gwacheon",
    coordinates: [126.9780954, 37.4167643],
    disclosureLevel: "generalized_public",
    locationNote: localized(
      "데이터센터와 같은 공개 주소에 화면상 중첩 표시",
      "Overlaid at the same published address as the data center",
      "与数据中心的同一公开地址重叠显示",
      "データセンターと同じ公開住所に重ねて表示",
    ),
    operatorEntityId: "kinx",
    ownerEntityIds: ["kinx"],
    connectionIds: ["kr-kinx-gwacheon"],
    sourceIds: ["kinx-ix", "kinx-centers"],
  },
  {
    id: "kr-equinix-sl1",
    country: "KR",
    kind: "data_center",
    name: "Equinix SL1",
    coordinates: [126.885587, 37.5821694],
    disclosureLevel: "generalized_public",
    locationNote: localized(
      "사업자 공개 주소를 도로 단위로 표시",
      "Shown at street level from the operator-published address",
      "依据运营商公开地址显示至道路级",
      "事業者公開住所を道路レベルで表示",
    ),
    operatorEntityId: "equinix",
    ownerEntityIds: ["equinix"],
    sourceIds: ["equinix-sl1"],
  },
  {
    id: "kr-ulsan-thermal",
    country: "KR",
    kind: "power_plant",
    name: "울산발전본부",
    coordinates: [129.3816502, 35.4769154],
    disclosureLevel: "exact_public",
    locationNote: localized(
      "운영사 및 OSM 공개 위치",
      "Operator and OSM-published location",
      "运营商与 OSM 公开位置",
      "運営者およびOSM公開位置",
    ),
    operatorEntityId: "ewp",
    ownerEntityIds: ["ewp"],
    sourceIds: ["ewp-ulsan", "osm-atlas-2026-07-23"],
    osmUrl: "https://www.openstreetmap.org/way/640088063",
    capacityMw: 2071.9,
  },
  {
    id: "jp-jera-kashima",
    country: "JP",
    kind: "power_plant",
    name: "JERA Kashima Thermal Power Station",
    coordinates: [140.7021547, 35.9157825],
    disclosureLevel: "exact_public",
    locationNote: localized(
      "운영사 및 OSM 공개 위치",
      "Operator and OSM-published location",
      "运营商与 OSM 公开位置",
      "運営者およびOSM公開位置",
    ),
    operatorEntityId: "jera",
    ownerEntityIds: ["jera"],
    sourceIds: ["jera-kashima", "jera-ownership", "osm-atlas-2026-07-23"],
    osmUrl: "https://www.openstreetmap.org/way/300345952",
    capacityMw: 1260,
  },
  {
    id: "jp-equinix-ty11",
    country: "JP",
    kind: "data_center",
    name: "Equinix TY11",
    coordinates: [139.789578, 35.640906],
    disclosureLevel: "generalized_public",
    locationNote: localized(
      "사업자 공개 주소를 구역 단위로 표시",
      "Shown at district level from the operator-published address",
      "依据运营商公开地址显示至街区级",
      "事業者公開住所を地区レベルで表示",
    ),
    operatorEntityId: "equinix",
    ownerEntityIds: ["equinix"],
    sourceIds: ["equinix-ty11"],
  },
  {
    id: "jp-jpix-otemachi",
    country: "JP",
    kind: "network_hub",
    name: "JPIX Otemachi",
    coordinates: [139.7644019, 35.6877686],
    disclosureLevel: "exact_public",
    locationNote: localized(
      "사업자 및 OSM 공개 건물 위치",
      "Operator and OSM-published building location",
      "运营商与 OSM 公开建筑位置",
      "事業者およびOSM公開建物位置",
    ),
    operatorEntityId: "jpix",
    ownerEntityIds: ["jpix"],
    sourceIds: ["jpix-otemachi", "osm-atlas-2026-07-23"],
    osmUrl: "https://www.openstreetmap.org/way/145397121",
  },
  {
    id: "tw-taichung-power",
    country: "TW",
    kind: "power_plant",
    name: "台中發電廠",
    coordinates: [120.4816226, 24.2157665],
    disclosureLevel: "exact_public",
    locationNote: localized(
      "운영사 및 OSM 공개 위치",
      "Operator and OSM-published location",
      "运营商与 OSM 公开位置",
      "運営者およびOSM公開位置",
    ),
    operatorEntityId: "taipower",
    ownerEntityIds: ["taipower"],
    sourceIds: ["taipower-plants", "osm-atlas-2026-07-23"],
    osmUrl: "https://www.openstreetmap.org/way/200691649",
  },
  {
    id: "tw-chief-ly2",
    country: "TW",
    kind: "data_center",
    name: "Chief Telecom LY2",
    coordinates: [121.575, 25.067],
    disclosureLevel: "generalized_public",
    locationNote: localized(
      "사업자 공개 주소를 네이후 구역 수준으로 일반화",
      "Generalized to Neihu district from the operator-published address",
      "依据运营商公开地址概化至内湖区",
      "事業者公開住所から内湖区レベルに一般化",
    ),
    operatorEntityId: "chief",
    ownerEntityIds: ["chief"],
    connectionIds: ["tw-tpix"],
    sourceIds: ["chief-locations", "chief-company"],
  },
  {
    id: "tw-tpix",
    country: "TW",
    kind: "network_hub",
    name: "TPIX",
    coordinates: [121.575, 25.067],
    disclosureLevel: "generalized_public",
    locationNote: localized(
      "운영사 공개 자료에 따라 타이베이 권역으로 표시",
      "Shown at Taipei-area level from operator materials",
      "依据运营商资料显示至台北区域",
      "運営者資料に基づき台北エリアで表示",
    ),
    operatorEntityId: "chief",
    ownerEntityIds: ["chief"],
    connectionIds: ["tw-chief-ly2"],
    sourceIds: ["chief-company"],
  },
  {
    id: "us-diablo-canyon",
    country: "US",
    kind: "power_plant",
    name: "Diablo Canyon Power Plant",
    coordinates: [-120.8546609, 35.211794],
    disclosureLevel: "exact_public",
    locationNote: localized(
      "운영사 및 OSM 공개 위치",
      "Operator and OSM-published location",
      "运营商与 OSM 公开位置",
      "運営者およびOSM公開位置",
    ),
    operatorEntityId: "pge-utility",
    ownerEntityIds: ["pge-utility"],
    sourceIds: ["pge-diablo", "pge-ticker", "osm-atlas-2026-07-23"],
    osmUrl: "https://www.openstreetmap.org/way/24400930",
  },
  {
    id: "us-equinix-dc4",
    country: "US",
    kind: "data_center",
    name: "Equinix DC4",
    coordinates: [-77.4619027, 39.0163151],
    disclosureLevel: "exact_public",
    locationNote: localized(
      "사업자 및 OSM 공개 건물 위치",
      "Operator and OSM-published building location",
      "运营商与 OSM 公开建筑位置",
      "事業者およびOSM公開建物位置",
    ),
    operatorEntityId: "equinix",
    ownerEntityIds: ["equinix"],
    connectionIds: ["us-equinix-ashburn-hub"],
    sourceIds: ["equinix-dc4", "osm-atlas-2026-07-23"],
    osmUrl: "https://www.openstreetmap.org/way/1309123034",
  },
  {
    id: "us-equinix-ashburn-hub",
    country: "US",
    kind: "network_hub",
    name: "Equinix Internet Exchange · Ashburn",
    coordinates: [-77.4744148, 39.029784],
    disclosureLevel: "generalized_public",
    locationNote: localized(
      "애시번 권역으로 일반화 표시",
      "Generalized to the Ashburn area",
      "概化显示至阿什本区域",
      "アッシュバーン地域に一般化して表示",
    ),
    operatorEntityId: "equinix",
    ownerEntityIds: ["equinix"],
    connectionIds: ["us-equinix-dc4"],
    sourceIds: ["equinix-ix", "equinix-dc4"],
  },
];

const OSM_SNAPSHOTS: {
  file: string;
  country: CountryCode;
  bbox: string;
}[] = [
  { file: "kr-ulsan.osm", country: "KR", bbox: "129.34,35.48,129.38,35.52" },
  { file: "jp-kashima.osm", country: "JP", bbox: "140.685,35.900,140.720,35.932" },
  { file: "tw-taichung.osm", country: "TW", bbox: "120.46,24.20,120.50,24.24" },
  { file: "tw-kaohsiung.osm", country: "TW", bbox: "120.20,22.80,120.22,22.82" },
  { file: "us-ashburn.osm", country: "US", bbox: "-77.49,39.025,-77.475,39.040" },
  { file: "us-baytown.osm", country: "US", bbox: "-95.04,29.73,-95.00,29.77" },
];

function decodeXml(value: string): string {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

async function downloadIfMissing(url: string, target: string): Promise<void> {
  if (fs.existsSync(target) && fs.statSync(target).size > 1000) return;
  const response = await fetch(url, {
    headers: { "User-Agent": "GridOS-public-atlas/0.3 (public-interest research)" },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  fs.writeFileSync(target, Buffer.from(await response.arrayBuffer()));
}

function simplify(points: [number, number][], maxPoints = 140): [number, number][] {
  if (points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  const result = points.filter((_, index) => index === 0 || index === points.length - 1 || index % step === 0);
  return result;
}

function parseOsmWays(xml: string, country: CountryCode): AtlasLinearFeature[] {
  const nodes = new Map<string, [number, number]>();
  for (const match of xml.matchAll(/<node\b([^>]*?)\/?>/g)) {
    const attrs = match[1];
    const id = attrs.match(/\bid="([^"]+)"/)?.[1];
    const lat = Number(attrs.match(/\blat="([^"]+)"/)?.[1]);
    const lon = Number(attrs.match(/\blon="([^"]+)"/)?.[1]);
    if (id && Number.isFinite(lat) && Number.isFinite(lon)) nodes.set(id, [lon, lat]);
  }

  const features: AtlasLinearFeature[] = [];
  for (const match of xml.matchAll(/<way\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/way>/g)) {
    const id = match[1];
    const body = match[2];
    const tags = new Map<string, string>();
    for (const tag of body.matchAll(/<tag\s+k="([^"]+)"\s+v="([^"]*)"\s*\/>/g)) {
      tags.set(decodeXml(tag[1]), decodeXml(tag[2]));
    }
    const power = tags.get("power");
    const manMade = tags.get("man_made");
    const substance = tags.get("substance") ?? tags.get("content");
    const energyPipelineSubstances = new Set([
      "gas",
      "oil",
      "fuel",
      "lpg",
      "ngl",
      "hydrogen",
      "propane",
      "butane",
      "ethane",
      "syngas",
      "y-grade",
    ]);
    const kind =
      power === "line"
        ? "transmission"
        : manMade === "pipeline" && (!substance || energyPipelineSubstances.has(substance))
          ? "pipeline"
          : null;
    if (!kind) continue;

    const coordinates = simplify(
      [...body.matchAll(/<nd\s+ref="([^"]+)"\s*\/>/g)]
        .map((node) => nodes.get(node[1]))
        .filter((point): point is [number, number] => Boolean(point)),
    );
    if (coordinates.length < 2) continue;
    const fallback = kind === "transmission" ? "OSM transmission way" : "OSM pipeline way";
    features.push({
      id: `osm-way-${id}`,
      country,
      kind,
      name: tags.get("name:en") ?? tags.get("name") ?? `${fallback} ${id}`,
      coordinates,
      disclosureLevel: "exact_public",
      operator: tags.get("operator"),
      owner: tags.get("owner"),
      voltage: tags.get("voltage"),
      substance,
      sourceIds: ["osm-atlas-2026-07-23"],
      osmUrl: `https://www.openstreetmap.org/way/${id}`,
    });
  }
  return features;
}

const KR_REGION_NAMES: Record<string, LocalizedText> = {
  seoul: localized("서울", "Seoul", "首尔", "ソウル"),
  busan: localized("부산", "Busan", "釜山", "釜山"),
  daegu: localized("대구", "Daegu", "大邱", "大邱"),
  incheon: localized("인천", "Incheon", "仁川", "仁川"),
  gwangju: localized("광주", "Gwangju", "光州", "光州"),
  daejeon: localized("대전", "Daejeon", "大田", "大田"),
  ulsan: localized("울산", "Ulsan", "蔚山", "蔚山"),
  sejong: localized("세종", "Sejong", "世宗", "世宗"),
  gyeonggi: localized("경기", "Gyeonggi", "京畿", "京畿"),
  gangwon: localized("강원", "Gangwon", "江原", "江原"),
  chungbuk: localized("충북", "North Chungcheong", "忠清北道", "忠清北道"),
  chungnam: localized("충남", "South Chungcheong", "忠清南道", "忠清南道"),
  jeonbuk: localized("전북", "North Jeolla", "全罗北道", "全羅北道"),
  jeonnam: localized("전남", "South Jeolla", "全罗南道", "全羅南道"),
  gyeongbuk: localized("경북", "North Gyeongsang", "庆尚北道", "慶尚北道"),
  gyeongnam: localized("경남", "South Gyeongsang", "庆尚南道", "慶尚南道"),
  jeju: localized("제주", "Jeju", "济州", "済州"),
};

function buildKoreanBalances(): RegionalBalance[] {
  const data = JSON.parse(
    fs.readFileSync(path.join(PROCESSED_DIR, "gridos-data.json"), "utf8"),
  );
  return data.regions.map((region: any) => ({
    id: `KR-${region.regionCode}`,
    country: "KR" as const,
    name: KR_REGION_NAMES[region.regionCode] ?? localized(region.regionName, region.regionName, region.regionName, region.regionName),
    demand: {
      value: region.metrics.electricity_use_mwh?.value ?? null,
      unit: "MWh/year",
      label: localized(
        "에너지다소비사업자 수전전력",
        "Purchased power of large energy users",
        "能源大量使用单位购电量",
        "エネルギー多消費事業者の受電電力量",
      ),
    },
    supply: {
      value: region.metrics.renewable_generation_mwh?.value ?? null,
      unit: "MWh/year",
      label: localized(
        "신·재생에너지 발전량",
        "Renewable generation",
        "可再生能源发电量",
        "再生可能エネルギー発電量",
      ),
    },
    period: "2024",
    sourceIds: ["kr-kea-demand", "kr-knrec-renewable"],
    methodology: localized(
      "수요 모집단은 에너지다소비사업자이며 지역 전체 수요가 아닙니다. 공급은 신·재생에너지 발전량입니다.",
      "Demand covers large energy users, not all regional load. Supply is renewable generation.",
      "需求仅涵盖能源大量使用单位，并非地区总负荷；供应为可再生能源发电量。",
      "需要はエネルギー多消費事業者のみで地域総需要ではありません。供給は再エネ発電量です。",
    ),
    comparableWithinCountry: true,
  }));
}

function buildJapaneseBalances(): RegionalBalance[] {
  const rows = [
    ["hokkaido", "北海道", "Hokkaido", "北海道", "北海道", 5060, 6330],
    ["tohoku", "東北", "Tohoku", "东北", "東北", 13350, 20420],
    ["tokyo", "東京", "Tokyo", "东京", "東京", 55010, 56990],
    ["chubu", "中部", "Chubu", "中部", "中部", 23680, 26760],
    ["hokuriku", "北陸", "Hokuriku", "北陆", "北陸", 4910, 5370],
    ["kansai", "関西", "Kansai", "关西", "関西", 26880, 28150],
    ["chugoku", "中国", "Chugoku", "中国", "中国", 10020, 13260],
    ["shikoku", "四国", "Shikoku", "四国", "四国", 4690, 8640],
    ["kyushu", "九州", "Kyushu", "九州", "九州", 15860, 19180],
    ["okinawa", "沖縄", "Okinawa", "冲绳", "沖縄", 1610, 2020],
  ] as const;
  return rows.map(([id, ko, en, zh, ja, demand, supply]) => ({
    id: `JP-${id}`,
    country: "JP",
    name: localized(ko, en, zh, ja),
    demand: {
      value: demand,
      unit: "MW",
      label: localized("연간 최대수요 전망", "Forecast annual peak demand", "年度峰值需求预测", "年間最大需要想定"),
    },
    supply: {
      value: supply,
      unit: "MW",
      label: localized("동일 피크구간 공급력", "Supply at the same peak interval", "同一峰值时段供给力", "同一ピーク区間の供給力"),
    },
    period: "FY2026",
    sourceIds: ["jp-occto-demand-2026", "jp-occto-supply-2026"],
    methodology: localized(
      "OCCTO 연간 피크 수요 시점과 같은 반월 구간의 공급력을 결합했습니다.",
      "OCCTO supply is matched to the half-month interval containing each area's annual demand peak.",
      "将 OCCTO 年度需求峰值与同一半月时段的供给力配对。",
      "OCCTOの年間需要ピークを含む半月区間の供給力を対応させています。",
    ),
    comparableWithinCountry: true,
  }));
}

async function buildTaiwaneseBalances(): Promise<RegionalBalance[]> {
  const cachePath = path.join(RAW_PUBLIC_DIR, "taipower-regional.csv");
  let text: string;
  if (fs.existsSync(cachePath) && process.env.ATLAS_REFRESH !== "1") {
    text = fs.readFileSync(cachePath, "utf8");
  } else {
    const response = await fetch(
      "https://service.taipower.com.tw/data/opendata/apply/file/d006019/001.csv",
    );
    if (!response.ok) throw new Error(`Taiwan CSV ${response.status}`);
    text = await response.text();
    fs.writeFileSync(cachePath, text);
  }
  text = text.replaceAll("\uFEFF", "").trim();
  const rows = text.split(/\r?\n/).slice(1).filter(Boolean);
  const parsed = rows.map((row) => {
    const [time, region, generation, load] = row.split(",");
    return { time, region, generation: Number(generation), load: Number(load) };
  });
  const latestTime = parsed.map((row) => row.time).sort().at(-1);
  const names: Record<string, LocalizedText> = {
    北部: localized("북부", "North", "北部", "北部"),
    中部: localized("중부", "Central", "中部", "中部"),
    南部: localized("남부", "South", "南部", "南部"),
    東部: localized("동부", "East", "东部", "東部"),
  };
  return parsed
    .filter((row) => row.time === latestTime && names[row.region])
    .map((row) => ({
      id: `TW-${row.region}`,
      country: "TW",
      name: names[row.region],
      demand: {
        value: row.load * 10,
        unit: "MW",
        label: localized("지역 부하", "Regional load", "区域负荷", "地域負荷"),
      },
      supply: {
        value: row.generation * 10,
        unit: "MW",
        label: localized("지역 발전량", "Regional generation", "区域发电量", "地域発電量"),
      },
      period: row.time,
      sourceIds: ["tw-taipower-regional-2026"],
      methodology: localized(
        "대만전력 10분 관측치이며 원 단위 萬瓩를 MW로 환산(×10)했습니다.",
        "Taipower 10-minute observation; the source unit 萬瓩 is converted to MW (×10).",
        "台电十分钟观测值；将原单位“万瓩”换算为 MW（×10）。",
        "台湾電力の10分観測値。原単位「萬瓩」をMWへ換算（×10）しています。",
      ),
      comparableWithinCountry: true,
    }));
}

async function eiaRows(url: string, cacheName: string): Promise<any[]> {
  const cachePath = path.join(RAW_PUBLIC_DIR, cacheName);
  if (fs.existsSync(cachePath) && process.env.ATLAS_REFRESH !== "1") {
    return JSON.parse(fs.readFileSync(cachePath, "utf8"));
  }
  let lastStatus = 0;
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, {
      headers: { "User-Agent": "GridOS-public-atlas/0.3 (public-interest research)" },
    });
    lastStatus = response.status;
    if (response.ok) {
      const json = await response.json();
      const rows = json.response?.data ?? [];
      fs.writeFileSync(cachePath, JSON.stringify(rows, null, 2));
      return rows;
    }
    if (response.status !== 429) break;
    await new Promise((resolve) => setTimeout(resolve, 800 * 2 ** attempt));
  }
  throw new Error(`EIA API ${lastStatus}`);
}

function existingBalances(country: CountryCode): RegionalBalance[] {
  const existingPath = path.join(PROCESSED_DIR, "atlas-public.json");
  if (!fs.existsSync(existingPath)) return [];
  const existing = JSON.parse(fs.readFileSync(existingPath, "utf8")) as PublicAtlas;
  return existing.regions.filter((region) => region.country === country);
}

async function buildAmericanBalances(): Promise<RegionalBalance[]> {
  const retained = existingBalances("US");
  if (
    retained.length &&
    process.env.ATLAS_REFRESH !== "1" &&
    !fs.existsSync(path.join(RAW_PUBLIC_DIR, "eia-generation-2024.json"))
  ) {
    console.warn(`[atlas] retaining ${retained.length} validated US rows; set ATLAS_REFRESH=1 to refresh EIA`);
    return retained;
  }
  const eiaKey = encodeURIComponent(process.env.EIA_API_KEY ?? "DEMO_KEY");
  const generationUrl =
    `https://api.eia.gov/v2/electricity/electric-power-operational-data/data/?api_key=${eiaKey}&frequency=annual&data[0]=generation&facets[sectorid][]=99&facets[fueltypeid][]=ALL&start=2024&end=2024&sort[0][column]=location&sort[0][direction]=asc&length=5000`;
  const salesUrl =
    `https://api.eia.gov/v2/electricity/retail-sales/data/?api_key=${eiaKey}&frequency=annual&data[0]=sales&facets[sectorid][]=ALL&start=2024&end=2024&sort[0][column]=stateid&sort[0][direction]=asc&length=5000`;
  let generation: any[];
  let sales: any[];
  try {
    generation = await eiaRows(generationUrl, "eia-generation-2024.json");
    sales = await eiaRows(salesUrl, "eia-sales-2024.json");
  } catch (error) {
    const previous = existingBalances("US");
    if (previous.length) {
      console.warn(`[atlas] EIA refresh unavailable; retaining ${previous.length} validated US rows`);
      return previous;
    }
    throw error;
  }
  const generationByState = new Map(
    generation
      .filter((row) => /^[A-Z]{2}$/.test(row.location) && row.location !== "US")
      .map((row) => [row.location, row]),
  );
  const salesByState = new Map(
    sales
      .filter((row) => /^[A-Z]{2}$/.test(row.stateid) && row.stateid !== "US")
      .map((row) => [row.stateid, row]),
  );
  return [...generationByState.entries()]
    .filter(([code]) => salesByState.has(code))
    .map(([code, generationRow]) => {
      const salesRow = salesByState.get(code);
      return {
        id: `US-${code}`,
        country: "US" as const,
        name: localized(
          generationRow.stateDescription,
          generationRow.stateDescription,
          generationRow.stateDescription,
          generationRow.stateDescription,
        ),
        demand: {
          value: Number(salesRow.sales) * 1000,
          unit: "MWh/year",
          label: localized("소매 전력판매량", "Retail electricity sales", "零售电力销售量", "小売電力販売量"),
        },
        supply: {
          value: Number(generationRow.generation) * 1000,
          unit: "MWh/year",
          label: localized("총 발전량", "Total generation", "总发电量", "総発電量"),
        },
        period: "2024",
        sourceIds: ["us-eia-generation-2024", "us-eia-sales-2024"],
        methodology: localized(
          "EIA 주별 총 발전량과 최종수요자 소매 판매량을 비교합니다. 주간 송수전은 별도입니다.",
          "Compares EIA state generation with retail sales to ultimate customers; interstate flows are separate.",
          "比较 EIA 各州总发电量与终端用户零售销量；州际电力流动另计。",
          "EIAの州別総発電量と最終需要家向け小売販売量を比較。州間潮流は別です。",
        ),
        comparableWithinCountry: true,
      };
    });
}

function buildChineseBalances(): RegionalBalance[] {
  return [
    {
      id: "CN-national",
      country: "CN",
      name: localized("전국 합계", "National total", "全国合计", "全国合計"),
      demand: {
        value: 9_850_000_000,
        unit: "MWh/year",
        label: localized(
          "전사회 전력사용량",
          "Total electricity consumption",
          "全社会用电量",
          "全社会電力消費量",
        ),
      },
      supply: {
        value: 10_090_000_000,
        unit: "MWh/year",
        label: localized(
          "전국 발전량",
          "National electricity generation",
          "全国发电量",
          "全国発電量",
        ),
      },
      period: "2024",
      sourceIds: ["cn-nea-market-2024"],
      methodology: localized(
        "국가에너지국 공개 보고서의 전국 합계입니다. 성급 수급자료가 아니며 지역값을 추론하지 않습니다.",
        "National totals from the NEA public report. These are not provincial balances, and no regional values are inferred.",
        "数据为国家能源局公开报告中的全国合计，并非省级供需数据；不推算地区数值。",
        "国家能源局の公開報告による全国合計です。省別需給ではなく、地域値は推計しません。",
      ),
      comparableWithinCountry: false,
    },
  ];
}

async function buildBoundaries(): Promise<void> {
  const countryUrl =
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
  const response = await fetch(countryUrl);
  if (!response.ok) throw new Error(`Natural Earth ${response.status}`);
  const geo = await response.json();
  const codeMap: Record<string, CountryCode> = {
    KOR: "KR",
    JPN: "JP",
    TWN: "TW",
    CHN: "CN",
    USA: "US",
  };
  const features = geo.features
    .filter((feature: any) => codeMap[feature.properties.ADM0_A3])
    .map((feature: any) => ({
      country: codeMap[feature.properties.ADM0_A3],
      type: feature.geometry.type,
      coordinates: feature.geometry.coordinates,
    }));
  const admin1Url =
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson";
  const admin1RawPath = path.join(RAW_PUBLIC_DIR, "natural-earth-admin1-10m.geojson");
  await downloadIfMissing(admin1Url, admin1RawPath);
  const admin1Geo = JSON.parse(fs.readFileSync(admin1RawPath, "utf8"));
  const detailBboxes: Record<CountryCode, [number, number, number, number]> = {
    KR: [124.5, 132, 33, 39.3],
    JP: [123, 146, 24, 46],
    TW: [119, 123, 21.5, 25.8],
    CN: [73, 135, 18, 54],
    US: [-126, -65, 24, 50],
  };
  const simplifyGeometry = (
    country: CountryCode,
    type: "Polygon" | "MultiPolygon",
    coordinates: number[][][] | number[][][][],
  ) => {
    const polygons =
      type === "Polygon"
        ? [coordinates as number[][][]]
        : (coordinates as number[][][][]);
    const [minLon, maxLon, minLat, maxLat] = detailBboxes[country];
    const simplified = polygons
      .map((polygon) =>
        polygon
          .filter((ring) =>
            ring.some(
              ([lon, lat]) =>
                lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat,
            ),
          )
          .map((ring) => simplify(ring as [number, number][], 90)),
      )
      .filter((polygon) => polygon.length);
    return type === "Polygon" ? simplified[0] : simplified;
  };
  const admin1 = admin1Geo.features
    .filter((feature: any) => codeMap[feature.properties.adm0_a3])
    .map((feature: any) => {
      const country = codeMap[feature.properties.adm0_a3];
      return {
      country,
      id: feature.properties.adm1_code,
      name: localized(
        feature.properties.name_ko ?? feature.properties.name,
        feature.properties.name_en ?? feature.properties.name,
        feature.properties.name_zh ?? feature.properties.name,
        feature.properties.name_ja ?? feature.properties.name,
      ),
      postal: feature.properties.postal ?? undefined,
      label:
        Number.isFinite(feature.properties.longitude) &&
        Number.isFinite(feature.properties.latitude)
          ? [feature.properties.longitude, feature.properties.latitude]
          : undefined,
      type: feature.geometry.type,
      coordinates: simplifyGeometry(country, feature.geometry.type, feature.geometry.coordinates),
    };
    })
    .filter((feature: any) => feature.coordinates?.length);
  fs.writeFileSync(
    path.join(PROCESSED_DIR, "atlas-boundaries.json"),
    JSON.stringify(
      {
        source: {
          title: "Natural Earth Admin 0 1:110m and Admin 1 1:10m",
          url: countryUrl,
          license: "Public domain",
          retrievedAt: RETRIEVED_AT,
        },
        features,
        admin1,
      },
    ),
  );
}

function validateAtlas(atlas: PublicAtlas): void {
  const unique = (label: string, ids: string[]) => {
    if (new Set(ids).size !== ids.length) throw new Error(`Duplicate ${label} id`);
  };
  unique("source", atlas.sources.map((row) => row.id));
  unique("entity", atlas.entities.map((row) => row.id));
  unique("facility", atlas.facilities.map((row) => row.id));
  unique("linear feature", atlas.linearFeatures.map((row) => row.id));
  unique("region", atlas.regions.map((row) => row.id));

  const sourceIds = new Set(atlas.sources.map((row) => row.id));
  const entityIds = new Set(atlas.entities.map((row) => row.id));
  const facilityIds = new Set(atlas.facilities.map((row) => row.id));
  for (const facility of atlas.facilities) {
    if (!facility.coordinates.every(Number.isFinite)) throw new Error(`Invalid facility coordinates: ${facility.id}`);
    for (const sourceId of facility.sourceIds) {
      if (!sourceIds.has(sourceId)) throw new Error(`Unknown source ${sourceId}: ${facility.id}`);
    }
    if (facility.operatorEntityId && !entityIds.has(facility.operatorEntityId)) {
      throw new Error(`Unknown operator: ${facility.id}`);
    }
    for (const id of facility.ownerEntityIds ?? []) {
      if (!entityIds.has(id)) throw new Error(`Unknown owner ${id}: ${facility.id}`);
    }
    for (const id of facility.connectionIds ?? []) {
      if (!facilityIds.has(id)) throw new Error(`Unknown connection ${id}: ${facility.id}`);
    }
  }
  for (const feature of atlas.linearFeatures) {
    if (feature.coordinates.length < 2 || feature.coordinates.flat().some((value) => !Number.isFinite(value))) {
      throw new Error(`Invalid linear feature: ${feature.id}`);
    }
  }
  for (const region of atlas.regions) {
    if (region.demand.unit !== region.supply.unit) throw new Error(`Unit mismatch: ${region.id}`);
    if (
      (region.demand.value !== null && !Number.isFinite(region.demand.value)) ||
      (region.supply.value !== null && !Number.isFinite(region.supply.value))
    ) {
      throw new Error(`Invalid regional value: ${region.id}`);
    }
  }
}

async function main(): Promise<void> {
  fs.mkdirSync(RAW_OSM_DIR, { recursive: true });
  fs.mkdirSync(RAW_PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });

  const linearFeatures: AtlasLinearFeature[] = [];
  for (const snapshot of OSM_SNAPSHOTS) {
    const target = path.join(RAW_OSM_DIR, snapshot.file);
    await downloadIfMissing(
      `https://api.openstreetmap.org/api/0.6/map?bbox=${snapshot.bbox}`,
      target,
    );
    linearFeatures.push(
      ...parseOsmWays(fs.readFileSync(target, "utf8"), snapshot.country),
    );
  }

  const regions = [
    ...buildKoreanBalances(),
    ...buildJapaneseBalances(),
    ...(await buildTaiwaneseBalances()),
    ...buildChineseBalances(),
    ...(await buildAmericanBalances()),
  ];
  const coverage = COUNTRY_CODES.map((country) => ({
    country,
    facilityCount: facilities.filter((row) => row.country === country).length,
    linearFeatureCount: linearFeatures.filter((row) => row.country === country).length,
    regionCount: regions.filter((row) => row.country === country).length,
    note:
      country === "CN"
        ? localized(
            "시설·선형망은 국가 상세 공개 레이어, 수급은 전국 합계",
            "Country-detail public layers; national electricity balance total",
            "设施与网络为国家详细公开图层；供需为全国合计",
            "施設・線形網は国別詳細公開レイヤー、需給は全国合計",
          )
        : localized(
            "시설·선형망은 대표 공개 레코드, 수급표는 해당 국가 공개지역 전체",
            "Representative facilities/networks; all published regions available to the balance table",
            "设施与网络为代表性公开记录；供需表涵盖该国可用公开地区",
            "施設・線形網は代表公開レコード、需給表は取得可能な公開地域",
          ),
  }));
  const atlas: PublicAtlas = {
    version: "0.3.0",
    generatedAt: RETRIEVED_AT,
    coverageNote: localized(
      "전체 개요는 대표 레코드, 국가 상세 지도는 원천 공개 레이어를 사용합니다. 국가 시설 완전목록이 아닙니다.",
      "The overview uses representative records; country maps use source-published detail layers. This is not a complete national inventory.",
      "总览采用代表性记录，国家详细地图采用来源公开图层；并非国家设施完整清单。",
      "全体概要は代表レコード、国別地図は出典公開の詳細レイヤーを使用します。国の完全台帳ではありません。",
    ),
    sources,
    entities,
    facilities,
    linearFeatures,
    regions,
    coverage,
  };
  validateAtlas(atlas);
  fs.writeFileSync(
    path.join(PROCESSED_DIR, "atlas-public.json"),
    JSON.stringify(atlas, null, 2),
  );
  await buildBoundaries();
  console.log(
    `[atlas] facilities=${facilities.length} ways=${linearFeatures.length} regions=${regions.length} sources=${sources.length}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
