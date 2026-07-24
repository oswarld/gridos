import type { InfrastructureLayer } from "./atlas-types";
import type { Locale } from "./i18n";

type AtlasUiCopy = {
  allCountries: string;
  publicSnapshot: string;
  releaseSummary: string;
  releaseScope: string;
  mapTitle: string;
  mapIntro: string;
  mapAria: string;
  layers: Record<InfrastructureLayer, string>;
  layerScope: string;
  selectedFacility: string;
  selectFacility: string;
  operator: string;
  owner: string;
  connections: string;
  listedCompany: string;
  directListing: string;
  parentListing: string;
  shareholderListing: string;
  capacity: string;
  locationPrecision: string;
  exactPublic: string;
  generalizedPublic: string;
  source: string;
  openOriginal: string;
  noPublicRecord: string;
  balanceTitle: string;
  balanceIntro: string;
  region: string;
  demand: string;
  supply: string;
  ratio: string;
  period: string;
  method: string;
  withinCountryOnly: string;
  countryMethodWarning: string;
  provenanceTitle: string;
  provenanceIntro: string;
  coverage: string;
  retrieved: string;
  currentRelease: string;
  contestEntry: string;
  newsletterEyebrow: string;
  newsletterTitle: string;
  newsletterDescription: string;
  newsletterLanguages: string;
  newsletterCta: string;
  allLayersLive: string;
  mapAttribution: string;
  close: string;
  countryDetail: string;
  allOverview: string;
  zoomIn: string;
  zoomOut: string;
  resetView: string;
  help: {
    demand: string;
    supply: string;
    ratio: string;
    period: string;
    locationPrecision: string;
  };
};

export const ATLAS_UI: Record<Locale, AtlasUiCopy> = {
  ko: {
    allCountries: "전체 5개국",
    publicSnapshot: "공개 자료 요약",
    releaseSummary: "KR · JP · TW · CN · US",
    releaseScope:
      "5개 나라를 한 화면에서 함께 봅니다. 여기 표시된 시설은 공개 자료로 확인된 것만 모은 목록이라서, 한 나라의 ‘전체 시설 목록’은 아닙니다.",
    mapTitle: "산업·에너지 시설 지도",
    mapIntro:
      "지도에서 시설을 누르면 누가 운영하는지, 누구 소유인지, 공개된 연결 정보를 확인할 수 있어요.",
    mapAria: "대한민국, 일본, 대만, 중국, 미국의 공개 인프라 지도",
    layers: {
      power_plant: "발전소",
      data_center: "데이터센터",
      network_hub: "네트워크 허브",
      transmission: "송전망",
      pipeline: "파이프라인",
    },
    layerScope: "표시 중",
    selectedFacility: "선택한 시설 정보",
    selectFacility: "지도에서 시설(또는 선)을 눌러 주세요.",
    operator: "운영하는 곳",
    owner: "소유한 곳",
    connections: "연결 정보(공개)",
    listedCompany: "연결된 상장사",
    directListing: "직접 상장",
    parentListing: "모회사",
    shareholderListing: "주요 주주",
    capacity: "규모(용량)",
    locationPrecision: "위치 표시 수준",
    exactPublic: "정확한 위치(공개 좌표)",
    generalizedPublic: "대략 위치(주소로 표시)",
    source: "출처",
    openOriginal: "출처 열기",
    noPublicRecord: "공개 자료가 아직 없어요",
    balanceTitle: "지역별 수요·공급 비교",
    balanceIntro:
      "나라마다 공개 방식이 달라서, 숫자는 같은 나라 안에서만 비교해 주세요.",
    region: "국가 · 지역",
    demand: "전력 사용(수요)",
    supply: "전력 생산(공급)",
    ratio: "비율(공급/수요)",
    period: "기간",
    method: "설명",
    withinCountryOnly: "국가 내 비교",
    countryMethodWarning:
      "나라마다 기준(기간·집계 방식)이 달라서, 나라끼리 숫자를 바로 비교하면 안 됩니다.",
    provenanceTitle: "출처와 업데이트",
    provenanceIntro:
      "각 숫자와 시설 정보가 ‘어디 자료’에서 왔는지, ‘언제’ 가져왔는지 함께 보여드립니다.",
    coverage: "공개 범위",
    retrieved: "수집일",
    currentRelease: "5개국 동시 공개",
    contestEntry: "제14회 산업통상부 공공데이터 활용 아이디어 공모전 출품작",
    newsletterEyebrow: "더 넓은 관점이 필요하다면",
    newsletterTitle: "오즈의 지식토킹",
    newsletterDescription:
      "기술·경제·사회를 따로 보지 않고, 변화의 이면과 다음 질문까지 연결하는 분석 뉴스레터입니다.",
    newsletterLanguages: "한국어 · English · 简体中文",
    newsletterCta: "다음 분석 받아보기",
    allLayersLive: "5개 레이어 조합 가능",
    mapAttribution: "경계 Natural Earth · 선형망 © OpenStreetMap contributors, ODbL",
    close: "닫기",
    countryDetail: "국가 상세 지도",
    allOverview: "5개국 개요",
    zoomIn: "확대",
    zoomOut: "축소",
    resetView: "지도 초기화",
    help: {
      demand:
        "각 지역의 ‘전력 사용’을 보여주는 공개 지표입니다. 국가별로 기준이 달라서, 전체 전력 사용량과 딱 같지 않을 수 있어요.",
      supply:
        "각 지역의 ‘전력 생산(공급)’을 보여주는 공개 지표입니다. 국가별 공개 범위에 따라 재생에너지 발전량 등으로 표시됩니다.",
      ratio:
        "공급 ÷ 수요로 계산한 값입니다. ‘대략 어느 정도 공급이 따라오는지’ 보는 참고용이며, 같은 나라 안에서만 비교해 주세요.",
      period: "데이터가 어떤 기간을 기준으로 하는지(연도/월 등) 표시합니다. 나라마다 기간이 다를 수 있어요.",
      locationPrecision:
        "지도가 시설 위치를 얼마나 정확하게 보여주는지 뜻해요. 공개 좌표가 있으면 ‘정확한 위치’, 주소만 공개되면 ‘대략 위치’로 표시합니다.",
    },
  },
  en: {
    allCountries: "All five countries",
    publicSnapshot: "Representative public snapshot",
    releaseSummary: "KR · JP · TW · CN · US",
    releaseScope:
      "All five countries are open in one view. Facilities and networks use source-published public records and are not a complete national inventory.",
    mapTitle: "Unified industry and energy infrastructure map",
    mapIntro:
      "Combine layers, then select a facility to inspect its operator, owner, public connections, and linked listed companies.",
    mapAria: "Public infrastructure map of South Korea, Japan, Taiwan, China, and the United States",
    layers: {
      power_plant: "Power plants",
      data_center: "Data centers",
      network_hub: "Network hubs",
      transmission: "Transmission",
      pipeline: "Pipelines",
    },
    layerScope: "Visible",
    selectedFacility: "Selected facility",
    selectFacility: "Select a facility or linear feature on the map.",
    operator: "Operator",
    owner: "Owner",
    connections: "Public connections",
    listedCompany: "Linked listed companies",
    directListing: "Direct listing",
    parentListing: "Parent",
    shareholderListing: "Shareholder",
    capacity: "Capacity",
    locationPrecision: "Location disclosure",
    exactPublic: "Coordinates published by source or OSM",
    generalizedPublic: "Generalized from operator-published address",
    source: "Evidence",
    openOriginal: "Open source",
    noPublicRecord: "No verified public record",
    balanceTitle: "Regional demand and supply",
    balanceIntro:
      "The latest metric available under each country's public reporting system is shown. Ratios and ranks are comparable only within the same country and method.",
    region: "Country · region",
    demand: "Demand",
    supply: "Supply",
    ratio: "Supply ÷ demand",
    period: "Period",
    method: "Definition and caveat",
    withinCountryOnly: "Within-country",
    countryMethodWarning:
      "Time scales and populations differ across the five countries. Values must not be ranked directly across countries.",
    provenanceTitle: "Sources, scope, and updates",
    provenanceIntro:
      "Facility and company relationships use primary public records; linear features use separately stored public OSM snapshots.",
    coverage: "Coverage",
    retrieved: "Retrieved",
    currentRelease: "Five-country release",
    contestEntry: "Entry for the 14th MOTIE Public Data Utilization Idea Contest",
    newsletterEyebrow: "For a wider perspective",
    newsletterTitle: "OZ Talking",
    newsletterDescription:
      "A newsletter connecting technology, economics, and society to explain the structures behind change—and the questions that come next.",
    newsletterLanguages: "한국어 · English · 简体中文",
    newsletterCta: "Get the next analysis",
    allLayersLive: "Five composable layers",
    mapAttribution: "Boundaries: Natural Earth · Networks: © OpenStreetMap contributors, ODbL",
    close: "Close",
    countryDetail: "Country detail map",
    allOverview: "Five-country overview",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    resetView: "Reset map",
    help: {
      demand:
        "A public metric used to represent electricity use (demand) for each region. It may not equal total consumption, and methods differ by country.",
      supply:
        "A public metric for electricity supply (often renewable generation), based on what each country discloses.",
      ratio:
        "Calculated as supply ÷ demand. Use it as a rough indicator and compare only within the same country.",
      period:
        "The reporting period for the metric (year/month, etc.). Periods can differ across countries.",
      locationPrecision:
        "How precisely the map shows a facility location: exact when public coordinates exist, or generalized when only an address is public.",
    },
  },
  "zh-CN": {
    allCountries: "五国全部",
    publicSnapshot: "代表性公开快照",
    releaseSummary: "KR · JP · TW · CN · US",
    releaseScope:
      "韩国、日本、台湾、中国与美国在同一界面开放。设施与网络采用来源公开记录，并非国家设施完整清单。",
    mapTitle: "产业与能源基础设施综合地图",
    mapIntro: "组合图层并选择设施，查看运营商、所有者、公开连接关系及关联上市公司。",
    mapAria: "韩国、日本、台湾、中国和美国的公共基础设施地图",
    layers: {
      power_plant: "发电厂",
      data_center: "数据中心",
      network_hub: "网络枢纽",
      transmission: "输电网",
      pipeline: "管线",
    },
    layerScope: "当前显示",
    selectedFacility: "已选设施",
    selectFacility: "请在地图中选择设施或线性基础设施。",
    operator: "运营商",
    owner: "所有者",
    connections: "公开连接关系",
    listedCompany: "关联上市公司",
    directListing: "直接上市",
    parentListing: "母公司",
    shareholderListing: "股东",
    capacity: "装机容量",
    locationPrecision: "位置公开级别",
    exactPublic: "来源或 OSM 公开坐标",
    generalizedPublic: "依据运营商公开地址概化显示",
    source: "依据",
    openOriginal: "打开原文",
    noPublicRecord: "无已核验公开记录",
    balanceTitle: "区域供需比较",
    balanceIntro:
      "展示各国公开统计体系下可获得的最新指标。比例与排名仅可在同一国家、同一方法内比较。",
    region: "国家 · 地区",
    demand: "需求",
    supply: "供应",
    ratio: "供应 ÷ 需求",
    period: "期间",
    method: "定义与注意事项",
    withinCountryOnly: "仅限国内比较",
    countryMethodWarning:
      "五国指标的时间尺度和统计总体不同，不应直接进行跨国排名。",
    provenanceTitle: "来源、范围与更新",
    provenanceIntro: "设施及企业关系采用一手公开资料；线性基础设施采用独立存储的 OSM 公开快照。",
    coverage: "公开范围",
    retrieved: "采集",
    currentRelease: "五国同步开放",
    contestEntry: "第14届韩国产业通商资源部公共数据应用创意大赛参赛作品",
    newsletterEyebrow: "获得更广阔的视角",
    newsletterTitle: "OZ Talking",
    newsletterDescription:
      "一份交叉解读科技、经济与社会的分析通讯，连接变化背后的结构与下一步问题。",
    newsletterLanguages: "한국어 · English · 简体中文",
    newsletterCta: "接收下一篇分析",
    allLayersLive: "五个图层可组合",
    mapAttribution: "边界 Natural Earth · 网络 © OpenStreetMap contributors, ODbL",
    close: "关闭",
    countryDetail: "国家详细地图",
    allOverview: "五国概览",
    zoomIn: "放大",
    zoomOut: "缩小",
    resetView: "重置地图",
    help: {
      demand:
        "用于表示各地区“用电量（需求）”的公开指标。不同国家的统计口径不同，可能不等于总用电量。",
      supply:
        "用于表示各地区“供给”的公开指标，通常以可再生能源发电量等形式展示，取决于各国公开范围。",
      ratio:
        "按 供给 ÷ 需求 计算，仅作参考。请只在同一国家内比较。",
      period: "数据对应的统计期间（年/月等）。不同国家的期间可能不同。",
      locationPrecision:
        "地图展示设施位置的精确程度：有公开坐标则显示“精确位置”，仅公开地址则显示“大致位置”。",
    },
  },
  ja: {
    allCountries: "5か国すべて",
    publicSnapshot: "代表的な公開スナップショット",
    releaseSummary: "KR · JP · TW · CN · US",
    releaseScope:
      "韓国・日本・台湾・中国・米国を同じ画面で公開します。施設とネットワークは出典公開レコードであり、全国の完全な台帳ではありません。",
    mapTitle: "産業・エネルギーインフラ統合地図",
    mapIntro:
      "レイヤーを組み合わせ、施設を選択して運営者・所有者・公開された接続関係・関連上場企業を確認できます。",
    mapAria: "韓国、日本、台湾、中国、米国の公開インフラ地図",
    layers: {
      power_plant: "発電所",
      data_center: "データセンター",
      network_hub: "ネットワークハブ",
      transmission: "送電網",
      pipeline: "パイプライン",
    },
    layerScope: "表示中",
    selectedFacility: "選択した施設",
    selectFacility: "地図上の施設または線形インフラを選択してください。",
    operator: "運営者",
    owner: "所有者",
    connections: "公開接続関係",
    listedCompany: "関連上場企業",
    directListing: "直接上場",
    parentListing: "親会社",
    shareholderListing: "株主",
    capacity: "設備容量",
    locationPrecision: "位置公開レベル",
    exactPublic: "原典またはOSMの公開座標",
    generalizedPublic: "事業者公開住所を一般化して表示",
    source: "根拠",
    openOriginal: "原典を開く",
    noPublicRecord: "検証済み公開記録なし",
    balanceTitle: "地域別の需要・供給比較",
    balanceIntro:
      "各国の公開制度で得られる最新指標を示します。比率と順位は同じ国・同じ方法の中でのみ比較できます。",
    region: "国・地域",
    demand: "需要",
    supply: "供給",
    ratio: "供給 ÷ 需要",
    period: "期間",
    method: "定義・注意事項",
    withinCountryOnly: "国内比較のみ",
    countryMethodWarning:
      "5か国の指標は時間単位と母集団が異なります。国をまたいだ直接順位には使えません。",
    provenanceTitle: "出典・範囲・更新",
    provenanceIntro:
      "施設・企業関係は一次公開資料、線形インフラは分離保存したOSM公開スナップショットを使用します。",
    coverage: "公開範囲",
    retrieved: "取得",
    currentRelease: "5か国同時公開",
    contestEntry: "第14回 韓国産業通商資源部 公共データ活用アイデア公募展 出品作",
    newsletterEyebrow: "より広い視点を求める方へ",
    newsletterTitle: "OZ Talking",
    newsletterDescription:
      "テクノロジー・経済・社会を横断し、変化の背景にある構造と次の問いをつなぐ分析ニュースレターです。",
    newsletterLanguages: "한국어 · English · 简体中文",
    newsletterCta: "次の分析を受け取る",
    allLayersLive: "5レイヤーを組合せ可能",
    mapAttribution: "境界 Natural Earth · ネットワーク © OpenStreetMap contributors, ODbL",
    close: "閉じる",
    countryDetail: "国別詳細地図",
    allOverview: "5か国概要",
    zoomIn: "拡大",
    zoomOut: "縮小",
    resetView: "地図をリセット",
    help: {
      demand:
        "各地域の「電力使用（需要）」を示す公開指標です。国によって集計方法が異なるため、総使用量と一致しない場合があります。",
      supply:
        "各地域の「供給」を示す公開指標です。国の公開範囲により、再エネ発電量などで表示されます。",
      ratio:
        "供給 ÷ 需要で計算した参考値です。同じ国の中でのみ比較してください。",
      period: "データの対象期間（年/月など）です。国によって期間が異なる場合があります。",
      locationPrecision:
        "地図が施設の位置をどれくらい正確に表示しているかです。公開座標があれば「正確」、住所のみ公開の場合は「概略」で表示します。",
    },
  },
};
