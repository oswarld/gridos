# GridOS

[한국어](README.md) · [English](README.en.md) · [日本語](README.ja.md) ·
[简体中文](README.zh-CN.md)

![GridOS — Public Infrastructure Atlas](public/og.png)

**공개 근거로 연결한 에너지·산업·디지털 인프라 지도**

대한민국·일본·대만·중국·미국의 발전소, 송전망, 에너지 파이프라인,
데이터센터, 네트워크 허브를 한 화면에서 탐색하는 공익 공개 프로젝트입니다.

[지도 열기](https://oswarld.github.io/gridos/) ·
[영어 UI](https://oswarld.github.io/gridos/en/) ·
[일본어 UI](https://oswarld.github.io/gridos/ja/) ·
[중국어 UI](https://oswarld.github.io/gridos/zh-CN/) ·
[의견 및 오류 제보](https://github.com/oswarld/gridos/issues)

> 현재 공개 버전: `v1.0.0`
>
> 제14회 산업통상부 공공데이터 활용 아이디어 공모전 출품작

## GridOS에서 할 수 있는 일

- 첫 방문 시 접속 지역에 맞는 언어와 국가 상세 지도로 자동 시작
- 5개국의 발전소·송전망·에너지 파이프라인·데이터센터·네트워크 허브를
  레이어로 조합해 탐색
- 국가별 상세 지도에서 발전 용량, 연료, 계획 시설, IX 연결 및 네트워크 수로
  필터링
- 공개 자료에 명시된 시설 운영사·소유주·연결 관계와 원문 근거 확인
- 지역별 관측 전력수요와 재생에너지 발전량 비교
- 시설 운영사와 상장기업·거래소·티커의 공개 식별 관계 확인
- 한국어, 영어, 일본어, 중국어(간체)로 이용

자동 선택은 저장된 사용자 선택을 가장 먼저 존중합니다. 별도 IP 위치 조회
서비스를 사용하거나 위치 권한을 새로 요청하지 않으며, 브라우저에서 위치 권한이
이미 허용된 경우에만 기기 위치를 사용합니다. 그 밖에는 브라우저 시간대와 언어를
사용하고, 지원 범위를 판별할 수 없으면 5개국 전체 지도로 시작합니다.

정책 브리프 생성과 투자 추천은 제품 범위에 포함하지 않습니다. 기업·티커 정보는
공개 식별 관계이며 투자 조언이 아닙니다.

## 현재 데이터 범위

`v1.0.0` 빌드 스냅샷에는 5개국의 상세 포인트 약 5.5만 건과 송전망·배관 등
선형 피처 약 3.6만 건이 포함되어 있습니다. 국가별 대표 시설, 지역 수급,
운영사·소유주·상장사 관계에는 각각 원문 출처를 연결합니다.

이 지도는 완전한 국가 시설대장이 아닙니다. 자료의 기준일, 공개 범위, 위치
정밀도와 집계 기준은 원천마다 다릅니다. 특히 화면의 ‘참고 공급비율’은 서로
모집단이 다른 관측 수요와 재생에너지 발전량을 비교한 값으로, 전력 자립률이나
계통 여유를 뜻하지 않습니다. 판단에 사용하기 전에 화면에 표시된 원문과
방법론을 확인해 주세요.

## 데이터 원칙

GridOS는 공개 원천이 직접 제공한 정보만 게시합니다.

- 공개되지 않은 송전·배관·변전소 위치를 추론하거나 다른 자료로 복원하지 않음
- 일반화된 위치를 임의의 정밀 좌표로 변환하지 않음
- 단순 근접성과 원천이 확인한 물리적 연결 관계를 구분
- 모든 레코드에 가능한 범위에서 원문 URL, 기준일, 수집시점, 공개 수준을 연결
- OpenStreetMap 원본은 다른 원천과 분리하고 필요한 공개 속성만 정규화

주요 원천은 다음과 같습니다.

- [OpenStreetMap](https://www.openstreetmap.org/copyright)의 공개 태그와 도형
- [U.S. EIA Form 860](https://www.eia.gov/electricity/data/eia860/)
- [HIFLD 공개 인프라 자료](https://hifld-geoplatform.hub.arcgis.com/)
- [PeeringDB 공개 API](https://www.peeringdb.com/apidocs/)
- [중국 국가에너지국 전력시장 보고서](https://www.nea.gov.cn/20250717/54ae0fdb11f04b39a5b670999c04ef81/2025071754ae0fdb11f04b39a5b670999c04ef81_19fe782a11f3aa40209907a80e3e692150.pdf)
- 각국 전력기관·사업자·공시·거래소의 공개 자료

## 5분 안에 로컬에서 실행하기

### 준비물

- Node.js 20 이상
- pnpm 10 이상

```bash
git clone https://github.com/oswarld/gridos.git
cd gridos
pnpm install
pnpm dev
```

[http://localhost:3000](http://localhost:3000)을 열면 저장소에 포함된 검증
스냅샷으로 바로 확인할 수 있습니다. 별도의 API 키는 필요하지 않습니다.

### 데이터와 정적 사이트 다시 빌드하기

```bash
pnpm data:build:atlas
pnpm data:build:detail
pnpm data:validate
pnpm build
```

상세 데이터 생성은 공개 원천을 내려받으므로 시간이 걸릴 수 있습니다. 원천 캐시는
저장소에 포함하지 않습니다. 정적 사이트 빌드는 GitHub Pages의 프로젝트 경로를
지원합니다.

## 프로젝트 구조

```text
app/                 Next.js 페이지와 로케일 진입점
components/atlas/    지도·필터·출처·관계 UI
data/processed/      검증된 공개 아틀라스 스냅샷
public/data/detail/  국가별 상세 지도 데이터
lib/                 타입, 다국어 사전, 도메인 로직
scripts/             수집·변환·검증·정적 내보내기
supabase/            공개 읽기 데이터 스키마와 마이그레이션
```

기술 스택은 Next.js 15, React 19, TypeScript, MapLibre GL, Supabase,
Tailwind CSS입니다.

## 기여와 보안

코드와 데이터 기여를 환영합니다.

1. 새 원천의 재배포 조건과 위치 공개 수준을 먼저 확인합니다.
2. 데이터에 원문 URL, 기준일, 수집시점, 공개 수준을 기록합니다.
3. `pnpm data:validate`와 `pnpm build`를 통과시킵니다.
4. 데이터 오류·중복·정정은 [Issues](https://github.com/oswarld/gridos/issues)로
   알려주세요.

비밀키, 관리자 키, 원천 API 인증정보를 커밋하지 마세요. 취약점이나 노출된
인증정보는 공개 Issue 대신
[보안 정책](SECURITY.md)의 비공개 신고 채널을 이용해 주세요.

## 공유용 소개글

GeekNews, 커뮤니티, 블로그에 맞춰 편집할 수 있는 한국어 마크다운 초안은
[GeekNews 소개글](docs/introductions/geeknews-ko.md)에 있습니다.

## 라이선스와 출처 표시

개별 데이터는 각 원천의 라이선스와 이용조건을 따르며, OpenStreetMap 데이터에는
ODbL 귀속이 적용됩니다. 별도의 소프트웨어 라이선스 파일이 추가되기 전까지
소스 공개가 코드 재사용 허가를 의미하지는 않습니다.
