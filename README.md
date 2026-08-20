# PAGEPORT

회원가입 없이 이메일을 확인하고 PDF 한 상품씩 바로 구매하는 디지털 문서 마켓입니다. 현재는 운영자 상품만 판매하는 1차 출시 범위입니다.

## 현재 구현

- 8개 샘플 상품, 상품 상세, 이메일 6자리 확인
- 서비스 운영 원칙, 구매자·관리자 흐름과 각 화면 입구를 설명하는 소개 페이지
- Toss Payments 시험 결제·환불과 Webhook V2 수신
- 구매 완료 화면·구매 이메일·24시간 또는 5회 다운로드 링크
- 이메일 확인 후 구매 목록 조회와 다운로드 링크 재발급
- Supabase 비공개 PDF, 약 1분 Signed URL, 원자적 다운로드 횟수 기록
- Resend + React Email 인증·구매·재발급·환불 이메일
- 관리자 이메일 OTP, 모든 원본 PDF의 TUS 업로드, 주문·다운로드·환불 관리
- Supabase PostgreSQL, Prisma, SQL Migration, RLS, 다운로드·요청 제한 RPC
- 요청 제한, 선택형 Turnstile, 보안 헤더, 선택형 Sentry·Analytics
- 실패 이메일 재처리·만료 자료 정리용 Vercel Cron 작업 장부, GitHub Actions, Dependabot

## 로컬 실행

Node.js 24와 pnpm 11을 사용합니다.

```bash
cp .env.example .env.local
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

환경변수의 뜻은 `.env.example`을 참고합니다. 비밀값이 든 `.env.local`은 Git에 올라가지 않습니다.

## SNS 공유와 검색 노출

- 홈과 각 상품에는 카카오톡·SNS 공유용 대표 이미지와 제목·설명이 자동으로 만들어집니다.
- 화면의 상품·가격·FAQ와 같은 내용을 검색엔진과 AI가 이해할 수 있는 구조화 데이터로도 제공합니다.
- 지금은 `ENABLE_SEARCH_INDEXING`을 설정하지 않아도 기본값이 꺼짐이므로 검색 결과 등록은 보류됩니다. SNS 미리보기에는 영향을 주지 않습니다.
- 실제 상품·사업자 정보·약관·실결제 준비가 끝난 뒤 운영 환경에서만 값을 `true`로 바꾸면 sitemap이 함께 공개됩니다.

## 검사

현재 자동검사는 다운로드·환불 정책, 공통 버튼, 상품 상세·재다운로드·관리자 화면의 기본 이동과 코드 품질을 확인합니다. 이메일 인증부터 시험 결제·다운로드·환불까지의 전체 연결 검사는 정식 오픈 전 확대합니다.

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

## 문서 기준

- [PRD](./PRD.md): 무엇을 만들고 어떻게 운영하는지
- [기술 선택서](./기술선택.md): 기술 구성의 쉬운 요약
- [확정 기술 스택](./기술스택_재검토_초안.md): 기술별 상세 이유와 보안 기준
- [코드 읽기 안내](./코드_읽기_안내.md): 비개발자를 위한 폴더·기능별 코드 지도
- [사이트 리뷰 순서](./사이트_리뷰_순서.md): 시험 사이트를 고객·운영자 관점에서 확인하는 순서

운영 배포는 GitHub Pull Request 검사와 Vercel Preview를 확인한 뒤 사용자가 직접 `main`에 병합하는 방식입니다.

현재 코드는 공개 GitHub 저장소의 `codex/full-rebuild` 브랜치에 있으며, Vercel 시험 배포와 자동검사가 연결되어 있습니다. 실제 운영에는 시험 결제 키를 사용하지 않습니다.

## 구축 후 체크리스트

- Vercel Preview 환경변수와 시험 주소 확인
- 토스 시험 웹훅 주소와 Vercel Cron 실행 확인
- 필요 시 Turnstile·Sentry·Vercel WAF·Analytics·GA4 연결
- 실제 도메인·고객지원 이메일 결정과 Resend 발신 도메인 인증
- 정식 오픈용 토스 계약·라이브 키, 운영 Supabase와 백업·복구 준비
- 실제 상품·미리보기와 사업자·법률 정보 확정
- 정식 오픈 승인 뒤에만 `ENABLE_SEARCH_INDEXING=true`로 변경
