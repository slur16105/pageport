// 잘못된 주소나 만료된 인증처럼 페이지를 열 수 없는 이유를 설명하고, 사용자가 다음에 할 일을 안내하는 공통 화면입니다.
import Link from "next/link";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export type AccessReason = "not-found" | "admin" | "session-expired" | "invalid-link" | "forbidden";

type AccessMessage = {
  label: string;
  mark: string;
  title: string;
  description: string;
  steps: string[];
  primaryAction: { label: string; href: string };
  secondaryAction: { label: string; href: string };
};

// 상황별 문구와 이동할 주소를 한곳에 모아, 안내 내용이 화면마다 달라지지 않도록 합니다.
const messages: Record<AccessReason, AccessMessage> = {
  "not-found": {
    label: "WRONG ADDRESS · 404",
    mark: "404",
    title: "찾으시는 페이지가 없어요.",
    description: "주소를 잘못 입력했거나, 페이지 주소가 변경되었을 수 있습니다. 구매 내역과 파일은 그대로 유지됩니다.",
    steps: ["주소에 오타가 없는지 확인해 주세요.", "상품을 찾는 중이었다면 전체 상품에서 다시 선택해 주세요."],
    primaryAction: { label: "상품 둘러보기", href: "/#products" },
    secondaryAction: { label: "페이지포트 홈", href: "/" },
  },
  admin: {
    label: "ADMIN CHECK",
    mark: "ADM",
    title: "관리자 확인이 필요한 화면이에요.",
    description: "상품과 주문 정보를 보호하기 위해 등록된 관리자만 이 화면을 열 수 있습니다.",
    steps: ["관리자 화면으로 이동해 등록된 이메일을 입력해 주세요.", "이메일로 받은 최신 6자리 번호로 인증해 주세요."],
    primaryAction: { label: "관리자 인증하기", href: "/admin" },
    secondaryAction: { label: "페이지포트 홈", href: "/" },
  },
  "session-expired": {
    label: "SESSION EXPIRED",
    mark: "TIME",
    title: "인증 시간이 지나 다시 확인이 필요해요.",
    description: "개인정보와 구매 파일을 보호하기 위해 이메일 인증은 일정 시간이 지나면 자동으로 끝납니다.",
    steps: [
      "구매 파일 다시 받기 화면으로 이동해 주세요.",
      "이메일로 새 인증번호를 받은 뒤 가장 최근 번호를 입력해 주세요.",
    ],
    primaryAction: { label: "다시 인증하기", href: "/downloads/reissue" },
    secondaryAction: { label: "페이지포트 홈", href: "/" },
  },
  "invalid-link": {
    label: "INVALID LINK",
    mark: "LINK",
    title: "사용할 수 없는 주소예요.",
    description: "주소가 일부 잘렸거나 이미 만료된 링크일 수 있습니다. 구매한 파일이 사라진 것은 아닙니다.",
    steps: ["구매할 때 사용한 이메일을 준비해 주세요.", "새 다운로드 주소를 발급받아 다시 시도해 주세요."],
    primaryAction: { label: "새 다운로드 주소 받기", href: "/downloads/reissue" },
    secondaryAction: { label: "상품 둘러보기", href: "/#products" },
  },
  forbidden: {
    label: "ACCESS DENIED",
    mark: "LOCK",
    title: "이 페이지를 볼 수 있는 권한이 없어요.",
    description: "잘못된 접근으로부터 주문과 개인정보를 보호하기 위해 화면을 열지 않았습니다.",
    steps: [
      "구매자라면 구매 파일 다시 받기에서 이메일을 인증해 주세요.",
      "운영자라면 관리자 화면에서 다시 인증해 주세요.",
    ],
    primaryAction: { label: "구매 파일 다시 받기", href: "/downloads/reissue" },
    secondaryAction: { label: "관리자 인증하기", href: "/admin" },
  },
};

export function getAccessReason(reason?: string): AccessReason {
  // 주소에 알 수 없는 이유가 들어오면 가장 안전한 일반 권한 안내를 보여줍니다.
  return reason && reason in messages ? (reason as AccessReason) : "forbidden";
}

export function AccessNotice({ reason }: { reason: AccessReason }) {
  const message = messages[reason];

  return (
    <div className="access-page">
      <SiteHeader />
      <main className="access-shell">
        <div className="access-mark" aria-hidden="true">
          <span>{message.mark}</span>
          <i>↗</i>
        </div>
        <section className="access-copy" aria-labelledby="access-title">
          <p className="eyebrow">{message.label}</p>
          <h1 id="access-title">{message.title}</h1>
          <p className="access-description">{message.description}</p>
          <div className="access-next-step">
            <strong>다음으로 이렇게 해주세요</strong>
            <ol>
              {message.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <div className="access-actions">
            <Link className="primary-button" href={message.primaryAction.href}>
              {message.primaryAction.label}
            </Link>
            <Link href={message.secondaryAction.href}>{message.secondaryAction.label}</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
