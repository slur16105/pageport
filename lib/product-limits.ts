// 관리자와 서버가 같은 상품 입력 제한을 사용하도록 숫자와 기본 카테고리를 한곳에 모아둡니다.
export const PRODUCT_LIMITS = {
  title: 80,
  sellerName: 50,
  category: 30,
  description: 160,
  summary: 2000,
  mark: 12,
  amountMin: 100,
  amountMax: 1_000_000,
  pagesMin: 1,
  pagesMax: 10_000,
  includesCount: 20,
  includeItem: 100,
  includesText: 20 * 100 + 19,
} as const;

export const PRODUCT_CATEGORIES = ["업무·생산성", "공부·교육", "돈관리", "생활", "디자인", "취미"] as const;

// 빈 줄은 제외하고 실제 상품 구성으로 저장될 줄만 셉니다.
export function productIncludeItems(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
