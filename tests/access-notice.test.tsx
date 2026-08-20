// 접근 오류의 종류에 따라 사용자에게 맞는 설명과 안전한 다음 이동 버튼이 표시되는지 확인합니다.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AccessNotice, getAccessReason } from "../components/AccessNotice";

describe("잘못된 접근 안내", () => {
  it("존재하지 않는 주소에서는 상품 목록으로 안내한다", () => {
    render(<AccessNotice reason="not-found" />);

    expect(screen.getByRole("heading", { name: "찾으시는 페이지가 없어요." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "상품 둘러보기" })).toHaveAttribute("href", "/#products");
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("만료된 인증에서는 새 인증을 받도록 안내한다", () => {
    render(<AccessNotice reason="session-expired" />);

    expect(screen.getByText("인증 시간이 지나 다시 확인이 필요해요.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "다시 인증하기" })).toHaveAttribute("href", "/downloads/reissue");
  });

  it("알 수 없는 이유는 일반 권한 안내로 안전하게 처리한다", () => {
    expect(getAccessReason("unknown-reason")).toBe("forbidden");
  });
});
