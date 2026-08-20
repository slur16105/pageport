# PAGEPORT

회원가입 없이 이메일을 확인하고 PDF 한 상품씩 바로 구매하는 디지털 문서 마켓입니다. 현재는 운영자 상품만 판매하는 1차 출시 범위입니다.

## 현재 구현

- 8개 샘플 상품, 상품 상세, 이메일 6자리 확인
- Toss Payments 시험 결제·환불과 Webhook V2 수신
- 구매 완료 화면·구매 이메일·24시간 또는 5회 다운로드 링크
- 이메일 확인 후 구매 목록 조회와 다운로드 링크 재발급
- Supabase 비공개 PDF, 약 1분 Signed URL, 원자적 다운로드 횟수 기록
- Resend + React Email 인증·구매·재발급·환불 이메일
- 관리자 이메일 OTP, 상품·TUS PDF 업로드·주문·다운로드·환불 관리
- Supabase PostgreSQL, Prisma, SQL Migration, RLS, RPC
- 요청 제한, 선택형 Turnstile, 보안 헤더, 선택형 Sentry·Analytics
- Vercel Cron 작업 장부, GitHub Actions, Dependabot

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

## 검사

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

운영 배포는 GitHub Pull Request 검사와 Vercel Preview를 확인한 뒤 사용자가 직접 `main`에 병합하는 방식입니다.
