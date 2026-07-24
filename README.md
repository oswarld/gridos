# GridOS

대한민국·일본·대만·중국·미국의 에너지·산업·디지털 기반시설을 한 지도에서 탐색하는
공익 공개 프로젝트입니다.

**공개 사이트:** [oswarld.github.io/gridos](https://oswarld.github.io/gridos/)

**현재 공개 버전:** `v1.0.0`

**공모전:** 제14회 산업통상부 공공데이터 활용 아이디어 공모전 출품작

## 무엇을 볼 수 있나요?

- 발전소, 송전망, 에너지 파이프라인, 데이터센터, 네트워크 허브의 조합 지도
- 국가별 상세 보기와 발전 용량·연료·네트워크 연결 조건 필터
- 공개 자료에 명시된 운영사·소유주·시설 관계와 원문 근거
- 지역별 수요·공급 비교
- 시설 운영사와 상장기업·거래소·티커의 식별 연결
- 한국어, 영어, 중국어(간체), 일본어

정책 브리프 생성과 투자 추천은 제품 범위에 포함하지 않습니다. 기업·티커 정보는
공개 식별 관계이며 투자 조언이 아닙니다.

## 데이터 원칙

GridOS는 공개 원천이 직접 제공한 정보만 게시합니다. 공개되지 않은 송전·배관·
변전소 위치를 추론하거나, 제한된 정보를 다른 자료와 결합해 복원하지 않습니다.
OSM 원본은 다른 원천과 분리해 관리하며 공개 배포본에는 필요한 속성만 정규화합니다.

현재 상세 지도는 다음 공개 원천을 바탕으로 생성됩니다.

- [OpenStreetMap](https://www.openstreetmap.org/copyright) 공개 태그와 도형
- [U.S. EIA 발전설비 자료](https://www.eia.gov/electricity/data/eia860/)
- [HIFLD 공개 인프라 자료](https://hifld-geoplatform.hub.arcgis.com/)
- [PeeringDB 공개 API](https://www.peeringdb.com/apidocs/)
- [중국 국가에너지국 전력시장 보고서](https://www.nea.gov.cn/20250717/54ae0fdb11f04b39a5b670999c04ef81/2025071754ae0fdb11f04b39a5b670999c04ef81_19fe782a11f3aa40209907a80e3e692150.pdf)
- 각국 전력기관·사업자·공시·거래소의 공개 자료

지도는 완전한 국가 시설대장이 아닙니다. 자료의 기준일, 공개 범위, 위치 정밀도는
원천마다 다르며 화면에서 원문 출처를 함께 확인해야 합니다. 데이터 오류나 정정
요청은 [Issues](https://github.com/oswarld/gridos/issues)로 알려주세요.

## 로컬 실행

Node.js 20 이상과 pnpm이 필요합니다.

```bash
pnpm install
pnpm dev
```

`http://localhost:3000`에서 확인할 수 있습니다.

```bash
pnpm data:build:atlas
pnpm data:build:detail
pnpm data:validate
pnpm build
```

상세 데이터 생성은 공개 원천을 내려받으므로 시간이 걸릴 수 있습니다. 원천
캐시는 저장소에 포함하지 않습니다. 정적 사이트 빌드는 GitHub Pages의 프로젝트
경로를 지원합니다.

## 보안과 기여

- 비밀키, 관리자 키, 원천 API 인증정보를 커밋하지 마세요.
- 브라우저에 전달되는 설정은 공개 읽기 권한만 가져야 합니다.
- 취약점은 공개 Issue가 아니라 [보안 정책](SECURITY.md)의 비공개 채널로
  신고해 주세요.
- 데이터 추가 시 원문 URL, 기준일, 공개 수준을 함께 기록해야 합니다.

코드와 데이터 기여는 환영합니다. 새 원천은 재배포 권한과 공개 위치 수준을 먼저
확인하고, `pnpm data:validate`와 `pnpm build`를 통과해 주세요.

## License and attribution

개별 데이터는 각 원천의 라이선스와 이용조건을 따르며, OpenStreetMap 데이터에는
ODbL 귀속이 적용됩니다. 별도의 소프트웨어 라이선스 파일이 추가되기 전까지 소스
공개가 코드 재사용 허가를 의미하지는 않습니다.
