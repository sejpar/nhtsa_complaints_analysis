# Descent — NHTSA Portfolio

SUV 안전 결함 분석 포트폴리오. Next.js 14 App Router + NHTSA 공개 API.

## 프로젝트 구조

```
app/
├── api/nhtsa/route.ts     # 서버사이드 NHTSA API 프록시
├── lib/nhtsa.ts           # 데이터 fetch + 분류 로직 (app.py 포팅)
├── components/
│   ├── Hero.tsx           # 풀스크린 랜딩 (A — Drift)
│   ├── Analysis.tsx       # 사이드바 + 차트 대시보드 (C — Depth)
│   ├── BarChart.tsx       # 부품별 × 위험도 스택 바 차트
│   ├── DonutChart.tsx     # 세부 컴포넌트 도넛 차트
│   ├── ComplaintList.tsx  # 신고 사례 아코디언 목록
│   └── About.tsx          # About + 연락처
└── page.tsx               # SSG 진입점 (RAV4 초기 데이터 pre-fetch)
```

## 로컬 실행

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Vercel 배포

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 프로젝트 루트에서
vercel

# 또는 GitHub에 push → Vercel 대시보드에서 Import
```

환경변수 없음 — NHTSA API는 공개 API라 키 불필요.

## 데이터 흐름

```
page.tsx (서버)
  └─ fetchComplaintData('RAV4', [2022..2025])  ← NHTSA API (SSG, 24h cache)
       └─ 초기 데이터를 Analysis에 props로 전달

클라이언트에서 모델/연도 변경 시
  → fetch('/api/nhtsa?model=CR-V&years=2023,2024')
       └─ route.ts → fetchComplaintData() → NHTSA API (Vercel CDN cache)
```

## 차트 & 분류 로직

`app/lib/nhtsa.ts`의 `classifyComponent()` 와 `classifyCriticality()` 는
`app.py`의 `finalize_categorization()` / `classify_criticality()` 를 1:1 TypeScript 포팅.

## ISR (Incremental Static Regeneration)

`export const revalidate = 86400` — 24시간마다 Vercel이 백그라운드에서
새 데이터로 페이지를 재빌드. 방문자는 항상 캐시된 빠른 응답을 받음.
