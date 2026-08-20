"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const purchaseSchema = z.object({ email: z.email("이메일 주소를 다시 확인해 주세요.") });
type PurchaseInput = z.infer<typeof purchaseSchema>;

export function PurchaseForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PurchaseInput>({ resolver: zodResolver(purchaseSchema), defaultValues: { email: "" } });
  function submit(input: PurchaseInput) {
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
