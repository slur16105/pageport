// 화면마다 버튼 모양이 달라지지 않도록 색상과 크기 규칙을 모아둔 공통 버튼 부품입니다.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

export const buttonVariants = cva(
  // 기본 버튼 모양에 '진한 버튼/테두리 버튼'과 '기본/작은 크기' 조합을 선택할 수 있게 합니다.
  "inline-flex items-center justify-center gap-2 rounded-sm font-extrabold transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5c35]",
  {
    variants: {
      variant: {
        primary: "bg-[#17231d] text-white hover:bg-[#2a3a32]",
        outline: "border border-[#17231d] bg-transparent text-[#17231d]",
      },
      size: { default: "px-6 py-4", small: "px-4 py-2 text-sm" },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
