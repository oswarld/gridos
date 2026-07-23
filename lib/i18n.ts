export const LOCALES = ["ko", "en", "zh-CN", "ja"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ko";

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

type LayerCopy = {
  name: string;
  detail: string;
  status: string;
};

export type AtlasDictionary = {
  htmlLang: string;
  localeName: string;
  siteName: string;
  publicBadge: string;
  eyebrow: string;
  headline: string;
  intro: string;
  currentRelease: string;
  nav: { map: string; balance: string; sources: string; governance: string };
  countries: Record<"KR" | "JP" | "TW" | "US", string>;
  published: string;
  preparing: string;
  notPublishedTitle: string;
  notPublishedBody: string;
  layerTitle: string;
  layerIntro: string;
  layers: {
    demand: LayerCopy;
    generation: LayerCopy;
    substations: LayerCopy;
    dataCenters: LayerCopy;
    pipelines: LayerCopy;
    transmission: LayerCopy;
    networkHubs: LayerCopy;
  };
  mapTitle: string;
  mapSubtitle: string;
  mapAria: string;
  boundarySource: string;
  lowerDemand: string;
  higherDemand: string;
  selectedRegion: string;
  selectRegion: string;
  demandProxy: string;
  renewableGeneration: string;
  renewableCapacity: string;
  indicativeCoverage: string;
  source: string;
  baseDate: string;
  quality: string;
  qualityLabels: Record<"ok" | "partial" | "missing", string>;
  disclosure: string;
  adminAggregate: string;
  balanceTitle: string;
  balanceIntro: string;
  region: string;
  demandColumn: string;
  supplyColumn: string;
  capacityColumn: string;
  coverageColumn: string;
  methodologyNote: string;
  sourcesTitle: string;
  sourcesIntro: string;
  provider: string;
  dataset: string;
  records: string;
  dataOrigin: string;
  supabase: string;
  bundled: string;
  governanceTitle: string;
  governanceIntro: string;
  governanceItems: string[];
  openSourceNote: string;
  facilityGraphNote: string;
  noValue: string;
};

export const DICTIONARIES: Record<Locale, AtlasDictionary> = {
  ko: {
    htmlLang: "ko",
    localeName: "한국어",
    siteName: "GridOS",
    publicBadge: "공익 공개 프로젝트",
    eyebrow: "산업 · 에너지 · 디지털 인프라",
    headline: "동아시아와 미국의 기반시설을 하나의 근거 지도에서 봅니다.",
    intro:
      "발전소·송전망·변전소·배관·데이터센터·네트워크 허브의 공개 정보를 연결하고, 시설의 운영사·소유주·연결 관계와 지역별 수요·공급을 같은 화면에서 비교합니다.",
    currentRelease:
      "현재 공개본은 대한민국 지역 집계 자료를 우선 제공합니다. 시설 단위 레이어는 공식 출처 검증 후 순차 공개합니다.",
    nav: { map: "지도", balance: "지역 수급", sources: "출처", governance: "공개 원칙" },
    countries: { KR: "대한민국", JP: "일본", TW: "대만", US: "미국" },
    published: "공개됨",
    preparing: "준비 중",
    notPublishedTitle: "검증된 레코드를 준비하고 있습니다.",
    notPublishedBody:
      "이 국가의 자료는 아직 공개 API에 게시하지 않았습니다. 공식 기관 자료의 이용조건·좌표 공개수준·운영사 관계를 확인한 뒤 공개합니다.",
    layerTitle: "인프라 레이어",
    layerIntro: "출처가 확인된 레이어만 활성화됩니다.",
    layers: {
      demand: { name: "지역 전력수요", detail: "에너지다소비사업자 수전전력 집계", status: "공개" },
      generation: { name: "발전소", detail: "KPX 발전설비 API 수집 경계 준비", status: "승인 API" },
      substations: { name: "변전소 여유용량", detail: "한전 공개 수준(지역 집계)만 사용", status: "승인 API" },
      dataCenters: { name: "데이터센터", detail: "사업자·인허가 공개자료 교차검증", status: "출처 검증" },
      pipelines: { name: "배관", detail: "공개된 집계·노선만 표시", status: "공개자료 한정" },
      transmission: { name: "송전망", detail: "기관이 공개한 공간자료만 표시", status: "공개자료 한정" },
      networkHubs: { name: "네트워크 허브", detail: "IXP·사업자 1차 자료로 구축", status: "출처 검증" },
    },
    mapTitle: "지역 전력수요 관측 지도",
    mapSubtitle:
      "현재 레이어: 에너지다소비사업자의 연간 수전전력. 전체 지역 전력수요와 동일하지 않습니다.",
    mapAria: "대한민국 지역별 관측 전력수요 지도",
    boundarySource: "VWorld 디지털트윈국토 시도 행정경계",
    lowerDemand: "낮음",
    higherDemand: "높음",
    selectedRegion: "선택한 지역",
    selectRegion: "지도에서 지역을 선택하면 근거 수치를 확인할 수 있습니다.",
    demandProxy: "관측 전력수요",
    renewableGeneration: "재생에너지 발전량",
    renewableCapacity: "재생에너지 설비용량",
    indicativeCoverage: "참고 공급비율",
    source: "출처",
    baseDate: "기준일",
    quality: "데이터 품질",
    qualityLabels: { ok: "확인", partial: "부분", missing: "없음" },
    disclosure: "공개 수준",
    adminAggregate: "광역자치단체 집계",
    balanceTitle: "지역별 수요·공급 비교",
    balanceIntro: "동일 지역의 관측 수요와 재생에너지 발전량을 나란히 비교합니다.",
    region: "지역",
    demandColumn: "관측 수요 (MWh/년)",
    supplyColumn: "재생 발전량 (MWh/년)",
    capacityColumn: "재생 설비 (kW)",
    coverageColumn: "참고 비율",
    methodologyNote:
      "참고 비율은 재생에너지 발전량 ÷ 에너지다소비사업자 수전전력입니다. 두 지표의 모집단이 달라 전력 자립률이나 계통 여유를 뜻하지 않습니다.",
    sourcesTitle: "출처와 데이터 계보",
    sourcesIntro: "각 수치는 제공기관, 기준일, 수집시점과 원문 링크를 함께 유지합니다.",
    provider: "제공기관",
    dataset: "데이터셋",
    records: "레코드",
    dataOrigin: "현재 데이터 원점",
    supabase: "Supabase 공개 읽기",
    bundled: "검증된 빌드 스냅샷",
    governanceTitle: "공개·보안·추론 원칙",
    governanceIntro:
      "공익성은 더 많은 좌표가 아니라 더 분명한 근거와 공개 경계에서 시작합니다.",
    governanceItems: [
      "OSM 원본과 파생 데이터는 별도 스키마에 저장하고 ODbL 귀속을 유지합니다.",
      "기관이 공개하지 않은 송전·배관·변전소 위치를 공간 추론으로 복원하지 않습니다.",
      "물리적 연결과 단순 근접 추론을 별도 관계로 기록하며, 공개 화면에서 검증 방법을 표시합니다.",
      "IXP와 사업자 관계는 각 기관의 1차 공개자료를 사용하고, 모든 레코드에 기준일과 출처 버전을 연결합니다.",
    ],
    openSourceNote:
      "정적 웹은 GitHub Pages에 공개되고, 읽기 전용 데이터는 Supabase 공개 API로 제공됩니다.",
    facilityGraphNote:
      "시설 클릭 → 운영사·소유주·연결 관계 → 상장사·티커로 이어지는 지식 그래프를 순차 공개합니다.",
    noValue: "자료 없음",
  },
  en: {
    htmlLang: "en",
    localeName: "English",
    siteName: "GridOS",
    publicBadge: "Public-interest open project",
    eyebrow: "Industry · Energy · Digital infrastructure",
    headline: "See East Asian and U.S. infrastructure on one evidence map.",
    intro:
      "GridOS connects public records for power plants, grids, substations, pipelines, data centers, and network hubs so operators, owners, relationships, and regional demand and supply can be examined together.",
    currentRelease:
      "The current release starts with regional aggregates for South Korea. Facility-level layers will be published after source verification.",
    nav: { map: "Map", balance: "Regional balance", sources: "Sources", governance: "Publication policy" },
    countries: { KR: "South Korea", JP: "Japan", TW: "Taiwan", US: "United States" },
    published: "Published",
    preparing: "In preparation",
    notPublishedTitle: "Verified records are being prepared.",
    notPublishedBody:
      "Records for this country have not been published to the public API yet. We first verify official terms of use, permitted location precision, and operator relationships.",
    layerTitle: "Infrastructure layers",
    layerIntro: "Only source-verified layers are enabled.",
    layers: {
      demand: { name: "Regional power demand", detail: "Purchased power reported by large energy users", status: "Published" },
      generation: { name: "Power plants", detail: "KPX generation API ingestion boundary ready", status: "API approved" },
      substations: { name: "Substation headroom", detail: "KEPCO public regional detail only", status: "API approved" },
      dataCenters: { name: "Data centers", detail: "Cross-checking operator and permit records", status: "Verifying" },
      pipelines: { name: "Pipelines", detail: "Published aggregates and routes only", status: "Public only" },
      transmission: { name: "Transmission grids", detail: "Only institution-published geodata", status: "Public only" },
      networkHubs: { name: "Network hubs", detail: "Built from primary IXP/operator sources", status: "Verifying" },
    },
    mapTitle: "Observed regional electricity demand",
    mapSubtitle:
      "Active layer: annual purchased power of large energy users. This is not total regional electricity demand.",
    mapAria: "Map of observed electricity demand by South Korean region",
    boundarySource: "VWorld Digital Twin Korea first-level administrative boundaries",
    lowerDemand: "Lower",
    higherDemand: "Higher",
    selectedRegion: "Selected region",
    selectRegion: "Select a region on the map to inspect its evidence.",
    demandProxy: "Observed demand",
    renewableGeneration: "Renewable generation",
    renewableCapacity: "Renewable capacity",
    indicativeCoverage: "Indicative supply ratio",
    source: "Source",
    baseDate: "As of",
    quality: "Data quality",
    qualityLabels: { ok: "Verified", partial: "Partial", missing: "Missing" },
    disclosure: "Disclosure",
    adminAggregate: "First-level administrative aggregate",
    balanceTitle: "Regional demand and supply comparison",
    balanceIntro: "Compare observed demand and renewable generation reported for the same region.",
    region: "Region",
    demandColumn: "Observed demand (MWh/year)",
    supplyColumn: "Renewable generation (MWh/year)",
    capacityColumn: "Renewable capacity (kW)",
    coverageColumn: "Indicative ratio",
    methodologyNote:
      "The indicative ratio is renewable generation divided by purchased power of large energy users. The populations differ, so it is neither an energy self-sufficiency rate nor available grid capacity.",
    sourcesTitle: "Sources and provenance",
    sourcesIntro:
      "Every value retains its provider, reference date, retrieval time, and original source link.",
    provider: "Provider",
    dataset: "Dataset",
    records: "Records",
    dataOrigin: "Current data origin",
    supabase: "Supabase public read",
    bundled: "Validated build snapshot",
    governanceTitle: "Publication, security, and inference policy",
    governanceIntro:
      "Public value comes from explicit evidence and disclosure boundaries, not from maximizing coordinate detail.",
    governanceItems: [
      "OSM source and derived data remain in a separate schema with ODbL attribution.",
      "We do not reconstruct unpublished transmission, pipeline, or substation locations through spatial inference.",
      "Physical connections and proximity inferences are recorded separately, with verification methods visible.",
      "IXP and operator relationships use primary public materials, and every record links to a dated source version.",
    ],
    openSourceNote:
      "The static site is public on GitHub Pages; read-only records are served by the Supabase public API.",
    facilityGraphNote:
      "The graph from facility → operator/owner/connection → listed company/ticker will be released layer by layer.",
    noValue: "No data",
  },
  "zh-CN": {
    htmlLang: "zh-CN",
    localeName: "简体中文",
    siteName: "GridOS",
    publicBadge: "公益开放项目",
    eyebrow: "产业 · 能源 · 数字基础设施",
    headline: "在一张证据地图上查看东亚与美国的基础设施。",
    intro:
      "GridOS 连接发电厂、输电网、变电站、管线、数据中心和网络枢纽的公开资料，并在同一界面展示运营商、所有者、连接关系及区域供需。",
    currentRelease:
      "当前版本优先提供韩国区域汇总数据。设施级图层将在官方来源核验后逐步发布。",
    nav: { map: "地图", balance: "区域供需", sources: "数据来源", governance: "公开原则" },
    countries: { KR: "韩国", JP: "日本", TW: "台湾", US: "美国" },
    published: "已发布",
    preparing: "准备中",
    notPublishedTitle: "正在准备已核验的记录。",
    notPublishedBody:
      "该国家的数据尚未发布至公共 API。我们会先核验官方使用条件、允许公开的位置精度以及运营关系。",
    layerTitle: "基础设施图层",
    layerIntro: "仅启用来源已核验的图层。",
    layers: {
      demand: { name: "区域电力需求", detail: "高耗能用户购入电量汇总", status: "已发布" },
      generation: { name: "发电厂", detail: "KPX 发电设备 API 采集边界已准备", status: "API 已批准" },
      substations: { name: "变电站余量", detail: "仅使用韩国电力公开的区域级信息", status: "API 已批准" },
      dataCenters: { name: "数据中心", detail: "交叉核验运营商与许可资料", status: "来源核验" },
      pipelines: { name: "管线", detail: "仅显示已公开的汇总与线路", status: "限公开资料" },
      transmission: { name: "输电网", detail: "仅显示机构正式公开的空间数据", status: "限公开资料" },
      networkHubs: { name: "网络枢纽", detail: "依据 IXP 与运营商一手资料构建", status: "来源核验" },
    },
    mapTitle: "区域电力需求观测地图",
    mapSubtitle: "当前图层：高耗能用户年度购入电量，并非区域总用电需求。",
    mapAria: "韩国各地区观测电力需求地图",
    boundarySource: "VWorld 韩国数字孪生国土一级行政区边界",
    lowerDemand: "较低",
    higherDemand: "较高",
    selectedRegion: "已选地区",
    selectRegion: "在地图中选择地区即可查看数据依据。",
    demandProxy: "观测电力需求",
    renewableGeneration: "可再生能源发电量",
    renewableCapacity: "可再生能源装机容量",
    indicativeCoverage: "参考供应比",
    source: "来源",
    baseDate: "基准日期",
    quality: "数据质量",
    qualityLabels: { ok: "已核验", partial: "部分", missing: "缺失" },
    disclosure: "公开级别",
    adminAggregate: "一级行政区汇总",
    balanceTitle: "区域需求与供应比较",
    balanceIntro: "并列比较同一地区的观测需求与可再生能源发电量。",
    region: "地区",
    demandColumn: "观测需求（MWh/年）",
    supplyColumn: "可再生发电量（MWh/年）",
    capacityColumn: "可再生装机（kW）",
    coverageColumn: "参考比率",
    methodologyNote:
      "参考比率为可再生能源发电量除以高耗能用户购入电量。两者统计口径不同，因此不代表能源自给率或电网可用容量。",
    sourcesTitle: "数据来源与沿袭",
    sourcesIntro: "每个数值均保留提供机构、基准日期、采集时间和原始链接。",
    provider: "提供机构",
    dataset: "数据集",
    records: "记录数",
    dataOrigin: "当前数据来源",
    supabase: "Supabase 公共只读",
    bundled: "已验证的构建快照",
    governanceTitle: "公开、安全与推断原则",
    governanceIntro: "公益价值来自清晰的证据和公开边界，而不是尽可能精细的坐标。",
    governanceItems: [
      "OSM 原始及衍生数据存放在独立模式中，并保留 ODbL 署名。",
      "不会通过空间推断还原机构未公开的输电、管线或变电站位置。",
      "物理连接与邻近推断分别记录，并公开其验证方法。",
      "IXP 与运营商关系采用各机构的一手公开资料，每条记录均关联带日期的来源版本。",
    ],
    openSourceNote:
      "静态网站公开部署于 GitHub Pages；只读数据由 Supabase 公共 API 提供。",
    facilityGraphNote:
      "设施 → 运营商/所有者/连接 → 上市公司/股票代码的知识图谱将逐层发布。",
    noValue: "暂无数据",
  },
  ja: {
    htmlLang: "ja",
    localeName: "日本語",
    siteName: "GridOS",
    publicBadge: "公益オープンプロジェクト",
    eyebrow: "産業・エネルギー・デジタルインフラ",
    headline: "東アジアと米国の基盤施設を、一つの根拠地図で見渡します。",
    intro:
      "発電所・送電網・変電所・パイプライン・データセンター・ネットワークハブの公開情報を結び、運営者・所有者・接続関係と地域別需給を同じ画面で比較します。",
    currentRelease:
      "現在の公開版は韓国の地域集計データから開始します。施設単位のレイヤーは公式情報の検証後に順次公開します。",
    nav: { map: "地図", balance: "地域需給", sources: "出典", governance: "公開方針" },
    countries: { KR: "韓国", JP: "日本", TW: "台湾", US: "米国" },
    published: "公開済み",
    preparing: "準備中",
    notPublishedTitle: "検証済みレコードを準備しています。",
    notPublishedBody:
      "この国のデータはまだ公開APIに掲載していません。公式資料の利用条件、公開可能な位置精度、運営関係を確認してから公開します。",
    layerTitle: "インフラレイヤー",
    layerIntro: "出典を検証できたレイヤーのみ有効です。",
    layers: {
      demand: { name: "地域電力需要", detail: "エネルギー多消費事業者の受電量集計", status: "公開" },
      generation: { name: "発電所", detail: "KPX発電設備APIの収集境界を準備", status: "API承認済み" },
      substations: { name: "変電所余力", detail: "韓国電力が公開する地域集計のみ使用", status: "API承認済み" },
      dataCenters: { name: "データセンター", detail: "事業者・許認可の公開資料を照合", status: "出典検証中" },
      pipelines: { name: "パイプライン", detail: "公開済みの集計・路線のみ表示", status: "公開資料のみ" },
      transmission: { name: "送電網", detail: "機関が公開した空間情報のみ表示", status: "公開資料のみ" },
      networkHubs: { name: "ネットワークハブ", detail: "IXP・事業者の一次資料から構築", status: "出典検証中" },
    },
    mapTitle: "地域電力需要の観測地図",
    mapSubtitle:
      "現在のレイヤー：エネルギー多消費事業者の年間受電量。地域全体の電力需要ではありません。",
    mapAria: "韓国の地域別観測電力需要地図",
    boundarySource: "VWorld デジタルツイン国土・広域行政境界",
    lowerDemand: "低い",
    higherDemand: "高い",
    selectedRegion: "選択した地域",
    selectRegion: "地図上の地域を選ぶと根拠となる数値を確認できます。",
    demandProxy: "観測電力需要",
    renewableGeneration: "再生可能エネルギー発電量",
    renewableCapacity: "再生可能エネルギー設備容量",
    indicativeCoverage: "参考供給比率",
    source: "出典",
    baseDate: "基準日",
    quality: "データ品質",
    qualityLabels: { ok: "確認済み", partial: "部分", missing: "欠損" },
    disclosure: "公開レベル",
    adminAggregate: "都道府県相当の集計",
    balanceTitle: "地域別の需要・供給比較",
    balanceIntro: "同じ地域の観測需要と再生可能エネルギー発電量を並べて比較します。",
    region: "地域",
    demandColumn: "観測需要（MWh/年）",
    supplyColumn: "再エネ発電量（MWh/年）",
    capacityColumn: "再エネ設備（kW）",
    coverageColumn: "参考比率",
    methodologyNote:
      "参考比率は再エネ発電量をエネルギー多消費事業者の受電量で割った値です。母集団が異なるため、電力自給率や系統余力を示すものではありません。",
    sourcesTitle: "出典とデータ来歴",
    sourcesIntro: "各数値に提供機関、基準日、取得日時、原文リンクを保持します。",
    provider: "提供機関",
    dataset: "データセット",
    records: "レコード",
    dataOrigin: "現在のデータ原点",
    supabase: "Supabase 公開読み取り",
    bundled: "検証済みビルドスナップショット",
    governanceTitle: "公開・セキュリティ・推論方針",
    governanceIntro:
      "公益性は座標の細かさではなく、明確な根拠と公開境界から生まれます。",
    governanceItems: [
      "OSM原本と派生データは別スキーマに保存し、ODbLの帰属表示を維持します。",
      "機関が非公開としている送電・配管・変電所の位置を空間推論で復元しません。",
      "物理的な接続と近接推論を別の関係として記録し、検証方法を公開します。",
      "IXP・事業者関係は各機関の一次公開資料を使用し、全レコードを日付付き出典版に結びます。",
    ],
    openSourceNote:
      "静的サイトはGitHub Pagesで公開し、読み取り専用データはSupabase公開APIから提供します。",
    facilityGraphNote:
      "施設 → 運営者・所有者・接続 → 上場企業・ティッカーへ続く知識グラフを段階的に公開します。",
    noValue: "データなし",
  },
};

const REGION_NAMES: Record<string, Record<Locale, string>> = {
  seoul: { ko: "서울", en: "Seoul", "zh-CN": "首尔", ja: "ソウル" },
  busan: { ko: "부산", en: "Busan", "zh-CN": "釜山", ja: "釜山" },
  daegu: { ko: "대구", en: "Daegu", "zh-CN": "大邱", ja: "大邱" },
  incheon: { ko: "인천", en: "Incheon", "zh-CN": "仁川", ja: "仁川" },
  gwangju: { ko: "광주", en: "Gwangju", "zh-CN": "光州", ja: "光州" },
  daejeon: { ko: "대전", en: "Daejeon", "zh-CN": "大田", ja: "大田" },
  ulsan: { ko: "울산", en: "Ulsan", "zh-CN": "蔚山", ja: "蔚山" },
  sejong: { ko: "세종", en: "Sejong", "zh-CN": "世宗", ja: "世宗" },
  gyeonggi: { ko: "경기", en: "Gyeonggi", "zh-CN": "京畿", ja: "京畿" },
  gangwon: { ko: "강원", en: "Gangwon", "zh-CN": "江原", ja: "江原" },
  chungbuk: { ko: "충북", en: "North Chungcheong", "zh-CN": "忠清北道", ja: "忠清北道" },
  chungnam: { ko: "충남", en: "South Chungcheong", "zh-CN": "忠清南道", ja: "忠清南道" },
  jeonbuk: { ko: "전북", en: "North Jeolla", "zh-CN": "全罗北道", ja: "全北" },
  jeonnam: { ko: "전남", en: "South Jeolla", "zh-CN": "全罗南道", ja: "全南" },
  gyeongbuk: { ko: "경북", en: "North Gyeongsang", "zh-CN": "庆尚北道", ja: "慶尚北道" },
  gyeongnam: { ko: "경남", en: "South Gyeongsang", "zh-CN": "庆尚南道", ja: "慶尚南道" },
  jeju: { ko: "제주", en: "Jeju", "zh-CN": "济州", ja: "済州" },
};

export function regionName(regionCode: string, fallback: string, locale: Locale): string {
  return REGION_NAMES[regionCode]?.[locale] ?? fallback;
}

export function numberLocale(locale: Locale): string {
  return locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : locale;
}
