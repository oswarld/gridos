# GridOS — Public Infrastructure Atlas

GridOS는 대한민국·일본·대만·미국의 산업·에너지·디지털 기반시설을 공개 근거와
함께 탐색하기 위한 공익 오픈 프로젝트입니다.

목표는 발전소, 송전망, 변전소, 배관, 데이터센터, 네트워크 허브를 같은 지도에서
보고 시설의 운영사·소유주·검증된 연결 관계를 확인한 뒤, 지역 수요·공급과
상장기업·티커까지 추적할 수 있는 공간 지식 그래프를 만드는 것입니다.

현재 공개본은 대한민국·일본·대만·미국을 한 화면에서 함께 제공합니다. 지도는
출처가 검증된 대표 시설과 공개 OSM 소구역 스냅샷으로 시작하며 전국 시설의
완전목록이 아닙니다. 지역 수급표는 한국 17개 지역, 일본 10개 공급구역, 대만
4개 권역, 미국 50개 주와 워싱턴 D.C.를 담습니다. 정책 브리프 자동 생성은
제품 범위에 포함하지 않습니다.

## 공개 구조

- **GitHub Pages:** Next.js 정적 내보내기로 만든 전체 공개 프런트엔드
- **Supabase:** Postgres/PostGIS, 출처 버전, 시설·기업 관계, 관측값, 공개수준
- **GitHub Actions:** 비밀키가 필요한 공공 API 수집과 정적 사이트 배포
- **언어:** `/ko/`, `/en/`, `/zh-CN/`, `/ja/`

## 공개 스냅샷

```bash
pnpm data:build:atlas
pnpm data:validate
```

`data:build:atlas`는 다음 자료를 같은 공개 모델로 정규화합니다.

- 시설·운영사·소유주·상장사: 사업자, 공공기관, 거래소의 1차 공개자료
- 선형망: OSM 공개 map API의 제한된 경계상자 스냅샷
- 국가경계: Natural Earth 국가 1:110m 및 행정 1단계 1:10m 공개 도형
- 지역 수급: 한국에너지공단, 일본 OCCTO, 대만전력, 미국 EIA

OSM 원본은 `data/raw/osm-atlas/`에 별도로 수집하고 저장소에는 넣지 않습니다.
정적 배포에는 검증·단순화한 `data/processed/atlas-public.json`과
`atlas-boundaries.json`만 포함합니다. 지도에는 OSM ODbL 귀속을 상시 표시합니다.

국가별 수급 지표는 정의가 다릅니다. 한국은 에너지다소비사업자 수전전력과
재생에너지 발전량, 일본은 연간 피크 수요와 같은 구간의 공급력, 대만은 10분
권역 발전·부하, 미국은 연간 주별 발전·소매판매를 사용합니다. 비율과 순위는
같은 국가·같은 방법 안에서만 해석합니다.

기본 지도는 네 나라를 동시에 보여줍니다. 국가 카드를 선택하면 해당 국가의
행정 1단계 경계와 인프라만 전체 지도 영역에 맞춰 표시하고, 확대·축소 및 확대
후 드래그 이동을 제공합니다.

브라우저 번들에는 `NEXT_PUBLIC_*` 값만 포함합니다. 공공데이터 인증키와 Supabase
service role key는 GitHub Actions secret 또는 로컬 `.env.local`에서만 사용합니다.

## 데이터 경계

`supabase/migrations/202607230001_atlas_core.sql`은 다음 세 경계를 만듭니다.

- `atlas`: 시설, 기업, 운영사, 관계, 관측값, 원천 레코드와 데이터셋 버전
- `osm`: OSM 원본·파생 피처의 독립 저장소와 ODbL 귀속
- `api`: `anon`과 `authenticated`가 읽을 수 있는 명시적 공개 뷰

`atlas`와 `osm`은 Supabase Data API에 직접 노출하지 않습니다. Supabase의
**Exposed schemas**에는 `api`와 기존 집계 테이블을 위한 `public`만 두고,
`atlas` 및 `osm`은 추가하지 않습니다.

모든 시설과 관계는 다음을 함께 보존합니다.

- 원천 데이터셋 및 버전, 기준일, 수집일, 레코드 키
- 공개수준: `exact_public`, `generalized_public`, `admin_area_only`, `withheld`
- 관계 검증방법: 기관 명시, 공시, 운영사 공개, 행정구역 매칭, 근접 추론
- 품질과 신뢰도

기관이 공개하지 않은 송전·배관·변전소 위치는 공간 추론으로 복원하지 않습니다.
근접 추론은 물리적 연결과 같은 의미로 게시할 수 없습니다.

## 로컬 실행

```bash
pnpm install
cp .env.example .env.local
pnpm dev
pnpm build
```

`pnpm build`는 기존 지역자료와 4개국 공개 아틀라스의 무결성을 먼저 검사한 뒤
`out/`에 GitHub Pages용 정적 파일을 만듭니다. GitHub Pages에는 검증된 공개
스냅샷을 포함하고, Supabase는 같은 모델의 버전·관계·관측값을 관리하는
읽기 전용 공개 API 경계로 사용합니다.

주요 환경변수:

| 변수 | 공개 여부 | 용도 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 공개 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개 | RLS 및 공개 뷰에 제한된 읽기 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | 비공개 | 검증 완료 데이터 게시 |
| `PUBLIC_DATA_SERVICE_KEY` | 비공개 | data.go.kr 및 ODCloud 승인 API 수집 |
| `PAGES_BASE_PATH` | 공개 | GitHub project Pages의 `/gridos` 경로 |

## 승인 API 수집

```bash
pnpm data:collect:official
```

현재 수집기는 다음 공식 자료를 병렬로 가져옵니다.

- KPX 전력시장 발전설비:
  `https://apis.data.go.kr/B552115/PowerMarketGenInfo/getPowerMarketGenInfo`
- 한전 지역별 공급가능 변전소:
  `https://api.odcloud.kr/api/15128065/v1/uddi:3a841aea-8d81-499a-a82a-ac6588c35b88`

한전 자료의 비식별 공급변전소 값은 `admin_area_only`로 유지하며 좌표를 만들지
않습니다. 수집 결과는 먼저 CI artifact로 보존되고, 레코드 수·스키마·공개수준
검증이 끝난 버전만 Supabase에 승격하는 2단계 방식입니다.

## GitHub 설정

저장소의 **Settings → Pages → Source**를 `GitHub Actions`로 설정합니다.

Repository variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Repository secrets:

- `PUBLIC_DATA_SERVICE_KEY`
- 데이터 승격 자동화를 활성화할 때만 `SUPABASE_SERVICE_ROLE_KEY`

`deploy-pages.yml`은 `main` 푸시와 수동 실행 시 정적 사이트를 배포합니다.
`collect-official-data.yml`은 매주 승인 API 스냅샷을 수집하고 검토용 artifact로
30일간 보존합니다.

## 기존 연구 모듈

초기 GridOS의 지역 점수·시나리오 계산 코드는 향후 “Scenario Lab” 연구 모듈로
남아 있지만 공개 아틀라스의 기본 화면과 배포 API에서는 분리되어 있습니다.
지도와 표에 표시되는 값은 점수가 아닌 관측값이며, 서로 모집단이 다른 지표를
비교할 때는 방법론 한계를 함께 표시합니다.
