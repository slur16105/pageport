import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { products } from "../app/data/products";
import { ProductCatalog } from "../components/ProductCatalog";

// 고객이 카테고리 버튼을 눌렀을 때 알맞은 상품만 남는지 사용자 관점에서 시험합니다.
describe("상품 카테고리 필터", () => {
  it("선택한 카테고리의 상품만 보여주고 전체 목록으로 돌아간다", async () => {
    render(<ProductCatalog products={products} />);

    expect(screen.getAllByRole("link")).toHaveLength(8);

    const workCategory = screen.getByRole("button", { name: "업무·생산성" });
    await userEvent.click(workCategory);

    expect(workCategory).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getByText("한 장으로 끝내는 주간 업무 플래너")).toBeInTheDocument();
    expect(screen.queryByText("30일 영어 공부 기록장")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "전체" }));
    expect(screen.getAllByRole("link")).toHaveLength(8);
  });
});
