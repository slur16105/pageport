"use client";

// 상품 상세에서 구매 이메일을 먼저 확인하고, 같은 이메일을 결제 화면으로 안전하게 넘기는 입력창입니다.

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const purchaseSchema = z.object({ email: z.email("이메일 주소를 다시 확인해 주세요.") });
type PurchaseInput = z.infer<typeof purchaseSchema>;

export function PurchaseForm({ slug }: { slug: string }) {
  // 브라우저가 준비된 뒤에만 버튼을 켜서, 화면이 뜨기 전에 잘못 눌리는 일을 막습니다.
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PurchaseInput>({ resolver: zodResolver(purchaseSchema), defaultValues: { email: "" } });
  function submit(input: PurchaseInput) {
    // 이메일은 현재 브라우저에 잠시 보관하고 해당 상품의 결제 확인 화면으로 이동합니다.
    sessionStorage.setItem(`pageport:checkout:${slug}:email`, input.email.trim().toLowerCase());
    router.push(`/checkout/${slug}`);
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <label className="email-field">
        <span>다운로드 받을 이메일</span>
        <input
          {...register("email")}
          type="email"
          placeholder="name@example.com"
          aria-label="구매 이메일"
          autoComplete="email"
          required
        />
        {errors.email && (
          <small className="field-error" role="alert">
            {errors.email.message}
          </small>
        )}
        <small>결제 안내와 재다운로드 인증에 사용됩니다.</small>
      </label>
      <button className="buy-button" type="submit" disabled={!ready}>
        {ready ? "주문 확인으로 이동" : "구매 화면 준비 중…"}
      </button>
    </form>
  );
}
