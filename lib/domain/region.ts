// 지역명 정규화: 원천별 표기를 표준 광역지자체 17개로 매핑
// docs/Technical_Architecture.md 6.3 기준

export type RegionDef = { code: string; name: string };

export const REGIONS: RegionDef[] = [
  { code: "seoul", name: "서울" },
  { code: "busan", name: "부산" },
  { code: "daegu", name: "대구" },
  { code: "incheon", name: "인천" },
  { code: "gwangju", name: "광주" },
  { code: "daejeon", name: "대전" },
  { code: "ulsan", name: "울산" },
  { code: "sejong", name: "세종" },
  { code: "gyeonggi", name: "경기" },
  { code: "gangwon", name: "강원" },
  { code: "chungbuk", name: "충북" },
  { code: "chungnam", name: "충남" },
  { code: "jeonbuk", name: "전북" },
  { code: "jeonnam", name: "전남" },
  { code: "gyeongbuk", name: "경북" },
  { code: "gyeongnam", name: "경남" },
  { code: "jeju", name: "제주" },
];

const ALIAS_TABLE: Record<string, string> = {
  서울: "seoul", 서울특별시: "seoul", 서울시: "seoul",
  부산: "busan", 부산광역시: "busan", 부산시: "busan",
  대구: "daegu", 대구광역시: "daegu", 대구시: "daegu",
  인천: "incheon", 인천광역시: "incheon", 인천시: "incheon",
  광주: "gwangju", 광주광역시: "gwangju", 광주시: "gwangju",
  대전: "daejeon", 대전광역시: "daejeon", 대전시: "daejeon",
  울산: "ulsan", 울산광역시: "ulsan", 울산시: "ulsan",
  세종: "sejong", 세종특별자치시: "sejong", 세종시: "sejong",
  경기: "gyeonggi", 경기도: "gyeonggi",
  강원: "gangwon", 강원도: "gangwon", 강원특별자치도: "gangwon",
  충북: "chungbuk", 충청북도: "chungbuk",
  충남: "chungnam", 충청남도: "chungnam",
  전북: "jeonbuk", 전라북도: "jeonbuk", 전북특별자치도: "jeonbuk",
  전남: "jeonnam", 전라남도: "jeonnam",
  경북: "gyeongbuk", 경상북도: "gyeongbuk",
  경남: "gyeongnam", 경상남도: "gyeongnam",
  제주: "jeju", 제주도: "jeju", 제주특별자치도: "jeju",
};

/** 원천 표기를 표준 지역코드로 변환. 매핑 불가 시 null */
export function resolveRegionCode(raw: string): string | null {
  const key = raw.replace(/\s+/g, "").trim();
  return ALIAS_TABLE[key] ?? null;
}

export function regionNameOf(code: string): string {
  return REGIONS.find((r) => r.code === code)?.name ?? code;
}

// ─── 국가산업단지 → 광역지자체 매핑 ───
// 한국산업단지공단 국가산업단지 소재지 기준(공개 정보). 2개 시도에 걸친
// 단지(아산: 경기/충남, 빛그린: 광주/전남)는 주 소재지 1곳으로 배분하고
// 해당 지표는 quality='partial'로 표시한다.
export const NATIONAL_COMPLEX_TO_REGION: Record<string, string> = {
  서울: "seoul",
  녹산: "busan",
  대구: "daegu",
  남동: "incheon",
  부평: "incheon",
  주안: "incheon",
  광주첨단: "gwangju",
  빛그린: "gwangju",
  온산: "ulsan",
  "울산ㆍ미포": "ulsan",
  반월: "gyeonggi",
  용인첨단시스템반도체: "gyeonggi",
  시화: "gyeonggi",
  시화MTV: "gyeonggi",
  송산그린시티: "gyeonggi",
  파주탄현: "gyeonggi",
  동두천: "gyeonggi",
  북평: "gangwon",
  오송생명과학: "chungbuk",
  석문: "chungnam",
  아산: "chungnam",
  장항생태: "chungnam",
  국가식품클러스터: "jeonbuk",
  "국가식품클러스터(외)": "jeonbuk",
  군산: "jeonbuk",
  군산2: "jeonbuk",
  익산: "jeonbuk",
  광양: "jeonnam",
  대불: "jeonnam",
  "대불(외)": "jeonnam",
  여수: "jeonnam",
  구미: "gyeongbuk",
  "구미(외)": "gyeongbuk",
  포항: "gyeongbuk",
  포항블루밸리: "gyeongbuk",
  경남항공: "gyeongnam",
  밀양나노: "gyeongnam",
  안정: "gyeongnam",
  진해: "gyeongnam",
  창원: "gyeongnam",
};

// ─── 도시가스사업자 → 주 공급권역 매핑 ───
// 한국가스안전공사 원천에는 지역 컬럼이 없어, 각 사업자의 공개된 주
// 공급권역(도시가스회사 허가권역) 기준으로 배분한다. 복수 시도에 걸친
// 사업자(예: 삼천리 경기·인천)는 주 권역 1곳으로 배분하므로 이 지표는
// 전 지역 quality='partial'이다. 권역 확인이 어려운 사업자는 제외한다.
export const CITYGAS_COMPANY_TO_REGION: Record<string, string> = {
  코원ES: "seoul",
  예스코: "seoul",
  서울: "seoul", // 서울도시가스
  귀뚜라미: "seoul", // 귀뚜라미에너지
  대륜: "seoul", // 대륜E&S
  삼천리: "gyeonggi",
  참빛: "gyeonggi", // 참빛도시가스(경기 포천 등)
  인천: "incheon",
  부산: "busan",
  대성: "daegu", // 대성에너지
  해양: "gwangju", // 해양에너지
  CNCITY: "daejeon",
  경동: "ulsan", // 경동도시가스
  강원: "gangwon",
  참빛원주: "gangwon",
  참빛영동: "gangwon",
  충청ES: "chungnam",
  JB: "chungnam", // JB(구 중부도시가스, 천안·아산 등)
  서해: "chungnam", // 미래엔서해에너지
  참빛충북: "chungbuk",
  전북: "jeonbuk",
  군산: "jeonbuk",
  전북ES: "jeonbuk",
  목포: "jeonnam",
  전남: "jeonnam",
  "영남ES(구미)": "gyeongbuk",
  "영남ES(포항)": "gyeongbuk",
  대성청정: "gyeongbuk",
  서라벌: "gyeongbuk",
  경남: "gyeongnam",
  지에스이: "gyeongnam",
  제주: "jeju",
};

// ─── 한국가스공사 지역본부 → 광역지자체 매핑 ───
// 원천이 지역본부 단위(서울/경기/인천/강원/충청/전북/광주/대구/부산/제주)라
// 광역 17개 전체를 커버하지 못한다. '충청' 본부는 충북·충남에 동일값을
// 배분(partial)하고, 본부가 없는 시도는 quality='missing'으로 남긴다.
export const KOGAS_BRANCH_TO_REGIONS: Record<string, string[]> = {
  서울: ["seoul"],
  경기: ["gyeonggi"],
  인천: ["incheon"],
  강원: ["gangwon"],
  충청: ["chungbuk", "chungnam"],
  전북: ["jeonbuk"],
  광주: ["gwangju"],
  대구: ["daegu"],
  부산: ["busan"],
  제주: ["jeju"],
};
