import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../components/ui/button";

describe("공통 버튼", () => {
  it("키보드·클릭 사용자에게 같은 이름과 동작을 제공한다", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>다시 시도</Button>);
    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
  it("비활성 버튼은 실행되지 않는다", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        처리 중
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "처리 중" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
