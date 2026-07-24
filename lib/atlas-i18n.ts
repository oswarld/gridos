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
  allLayersLive: string;
  mapAttribution: string;
  close: string;
  countryDetail: string;
  allOverview: string;
  zoomIn: string;
  zoomOut: string;
  resetView: string;
};

export const ATLAS_UI: Record<Locale, AtlasUiCopy> = {
  ko: {
    allCountries: "전체 5개국",
    publicSnapshot: "대표 공개 스냅샷",
    releaseSummary: "KR · JP · TW · CN · US",
    releaseScope:
      "5개국을 한 화면에서 함께 엽니다. 시설·선형망은 출처가 검증된 공개 레코드이며, 국가 시설 완전목록으로 해석하면 안 됩니다.",
    mapTitle: "산업·에너지 인프라 통합 지도",
    mapIntro:
      "레이어를 조합하고 시설을 선택해 운영사·소유주·공개된 연결 관계와 상장사를 확인하세요.",
    mapAria: "대한민국, 일본, 대만, 중국, 미국의 공개 인프라 지도",
    layers: {
      power_plant: "발전소",
      data_center: "데이터센터",
      network_hub: "네트워크 허브",
      transmission: "송전망",
      pipeline: "파이프라인",
    },
    layerScope: "표시 중",
    selectedFacility: "선택한 시설",
    selectFacility: "지도에서 시설 또는 선형 인프라를 선택하세요.",
    operator: "운영사",
    owner: "소유주",
    connections: "공개 연결 관계",
    listedCompany: "연결된 상장사",
    directListing: "직접 상장",
    parentListing: "모회사",
    shareholderListing: "주요 주주",
    capacity: "설비용량",
    locationPrecision: "위치 공개 수준",
    exactPublic: "원문·OSM 공개 좌표",
    generalizedPublic: "사업자 공개 주소의 일반화 표시",
    source: "근거",
    openOriginal: "원문 열기",
    noPublicRecord: "확인된 공개 기록 없음",
    balanceTitle: "지역별 수요·공급 비교",
    balanceIntro:
      "각 국가의 공개 체계에 맞는 최신 지표를 제공합니다. 비율과 순위는 같은 국가·같은 방법 안에서만 비교할 수 있습니다.",
    region: "국가 · 지역",
    demand: "수요",
    supply: "공급",
    ratio: "공급 ÷ 수요",
    period: "기간",
    method: "정의·주의사항",
    withinCountryOnly: "국가 내 비교",
    countryMethodWarning:
      "한국·일본·대만·중국·미국의 지표는 시간단위와 모집단이 서로 다릅니다. 국가 간 수치를 직접 순위화하지 않습니다.",
    provenanceTitle: "출처·범위·업데이트",
    provenanceIntro:
      "시설과 기업 관계는 1차 공개자료, 선형 인프라는 별도 보관한 OSM 공개 스냅샷을 사용합니다.",
    coverage: "공개 범위",
    retrieved: "수집",
    currentRelease: "5개국 동시 공개",
    allLayersLive: "5개 레이어 조합 가능",
    mapAttribution: "경계 Natural Earth · 선형망 © OpenStreetMap contributors, ODbL",
    close: "닫기",
    countryDetail: "국가 상세 지도",
    allOverview: "5개국 개요",
    zoomIn: "확대",
    zoomOut: "축소",
    resetView: "지도 초기화",
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
    allLayersLive: "Five composable layers",
    mapAttribution: "Boundaries: Natural Earth · Networks: © OpenStreetMap contributors, ODbL",
    close: "Close",
    countryDetail: "Country detail map",
    allOverview: "Five-country overview",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    resetView: "Reset map",
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
    allLayersLive: "五个图层可组合",
    mapAttribution: "边界 Natural Earth · 网络 © OpenStreetMap contributors, ODbL",
    close: "关闭",
    countryDetail: "国家详细地图",
    allOverview: "五国概览",
    zoomIn: "放大",
    zoomOut: "缩小",
    resetView: "重置地图",
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
    allLayersLive: "5レイヤーを組合せ可能",
    mapAttribution: "境界 Natural Earth · ネットワーク © OpenStreetMap contributors, ODbL",
    close: "閉じる",
    countryDetail: "国別詳細地図",
    allOverview: "5か国概要",
    zoomIn: "拡大",
    zoomOut: "縮小",
    resetView: "地図をリセット",
  },
};
