# GridOS — 산업 전력 배분 의사결정 서비스

제14회 산업통상부 공공데이터 활용 아이디어 공모전 **제품 및 서비스** 부문 출품작.
산업단지·천연가스·석유·전력·재생에너지 공공데이터 11종을 결합해, 데이터센터·철강·첨단제조
신규 전력수요를 **어느 지역에 어떤 조건으로 배치해야 하는지** 계산하는 웹 대시보드입니다.
정부·지자체·산업단지 운영기관·기업 입지선정팀이 **정책 타당성, 전력 공백 대응, 이해관계자 설득**
근거를 빠르게 확인할 수 있도록 설계했습니다.

- 더미데이터 없음: 모든 점수·차트는 실제 공공데이터에서만 계산 (빌드 시 검증으로 차단)
- 신규 수요 MW 등 입력값은 **사용자 입력 시나리오**로 분리 표기
- 모든 지표에 원천명·기준일·행 수·수집일·접근방식 표시, 원천에 없는 값은 `데이터 부족` 처리

## 기술 스택

Next.js 15 (App Router) + TypeScript + Tailwind CSS 4 + Supabase Postgres(PostgREST) + Vercel.
상세 설계는 [docs/Technical_Architecture.md](docs/Technical_Architecture.md), 제품 요구사항은
[docs/PRD.md](docs/PRD.md), 정책·데이터 제약은 [docs/GridOS Policy and Data Strategy.md](docs/GridOS%20Policy%20and%20Data%20Strategy.md) 참고.

## 실행

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm build          # data:validate(무결성+더미데이터 검사) 후 프로덕션 빌드
```

`.env.local` 필요 키:

| 변수 | 용도 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 런타임 데이터 로드 (없으면 번들 실데이터 스냅샷으로 폴백) |
| `PUBLIC_DATA_SERVICE_KEY` | data.go.kr OpenAPI 수집 (데이터 갱신 시에만) |
| `SUPABASE_SERVICE_ROLE_KEY` | 시드 재실행 시(선택) |
| `ANTHROPIC_API_KEY` | 정책 브리프 LLM 문장 다듬기(선택, 없으면 규칙 기반) |
| `VWORLD_API_KEY` | 지도용 시도 행정경계 1회 수집 (`pnpm map:fetch`, 런타임 미사용) |

## 데이터 파이프라인

```bash
pnpm data:build     # resources/*.xlsx + data/raw/api/*.json → data/processed/gridos-data.json + seed.sql
pnpm data:validate  # 원천 행 수>0, 출처 연결, 더미데이터 키워드 검사 (실패 시 빌드 차단)
pnpm data:seed      # Supabase에 시드 (service role key 또는 시드용 임시 RLS 정책 필요)
pnpm map:fetch      # VWorld 시도 행정경계 수집 → data/processed/sido-geo.json (지도 시각화용)
```

원천 데이터 계층:

| 계층 | 원천 | 방식 |
| --- | --- | --- |
| 산업통상부 핵심 | 산업단지공단 2종(현황통계·산업동향), 가스공사 2종(지역본부 공급량·피크), 석유공사(지역 소비), 가스안전공사(도시가스) | 파일 스냅샷 + odcloud OpenAPI |
| 보조 | 에너지공단 2종(에너지다소비사업자·신재생 보급), 전력거래소(시간별 태양광·풍력 166,440행 집계) | 파일 + OpenAPI |
| 웹 조회 스냅샷 | EPSIS 이용률(태양광/풍력) | 수동 다운로드, `manual_web_download` 표기 |

참고: 한전 시군구별 전력사용량(3069444)은 현재 API 키에 대한 활용신청 미승인(-401) 상태라
에너지다소비사업자 수전 전력(MWh, 시도별)으로 대체했습니다. data.go.kr에서 해당 데이터셋
활용신청 승인 후 `scripts/build-dataset.ts`에 추가할 수 있습니다.

## 점수 엔진

6개 축 × 업종별 가중치(데이터센터/철강/첨단제조/일반제조), 지역 간 min-max 정규화.
기존 부하 압박 축은 `신규수요(유연성 보정) ÷ 지역 수전 전력` 부담률의 절대 스케일
(0%=100점, 50% 이상=0점)로 계산해 MW 입력이 점수에 직접 반영됩니다.
값이 없는 축은 총점에서 제외하고 가중치를 재정규화하며, 누락 3축 이상이면 `데이터 부족` 판정.

## 배포 (Vercel)

1. GitHub 저장소 연결 후 Vercel 프로젝트 생성 (Next.js 자동 감지)
2. 환경변수 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 등록
3. Preview에서 시크릿 브라우저 검증 → Production promote
