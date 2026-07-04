// 표시용 문자열 정리 유틸
// 공공데이터 원천명은 "기관명_데이터명" 형식이라 화면에서는 언더바를 제거하고,
// 기관명이 별도 컬럼에 있을 때는 접두 기관명도 걷어낸다.

/** "한국산업단지공단_전국산업단지현황통계" → "전국산업단지현황통계" */
export function humanizeTitle(title: string): string {
  if (!title.includes("_")) return title;
  const parts = title.split("_");
  return parts.slice(1).join(" ").trim() || title;
}

/** 언더바만 공백으로 (기관명 유지가 필요한 자리) */
export function stripUnderscores(title: string): string {
  return title.replace(/_/g, " ");
}
