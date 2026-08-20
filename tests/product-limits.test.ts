// 관리자 화면과 서버가 공유하는 상품 입력 제한과 상품 구성 줄 세기가 정확한지 확인합니다.
import { describe, expect, it } from "vitest";
import { PRODUCT_LIMITS, productIncludeItems } from "../lib/product-limits";

describe("상품 등록 입력 제한", () => {
  it("운영에 적합한 가격·쪽수·글자 수 범위를 제공한다", () => {
    expect(PRODUCT_LIMITS.amountMax).toBe(1_000_000);
    expect(PRODUCT_LIMITS.pagesMax).toBe(10_000);
    expect(PRODUCT_LIMITS.title).toBe(80);
    expect(PRODUCT_LIMITS.description).toBe(160);
  });

  it("빈 줄을 제외하고 실제 상품 구성만 센다", () => {
    expect(productIncludeItems("첫 번째 구성\n\n 두 번째 구성 \n")).toEqual(["첫 번째 구성", "두 번째 구성"]);
  });
});
