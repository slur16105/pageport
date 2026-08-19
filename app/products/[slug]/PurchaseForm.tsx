"use client";

import { FormEvent, useState } from "react";

export function PurchaseForm({ slug }: { slug: string }) {
  const [email, setEmail] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) return;
    sessionStorage.setItem(`pageport:checkout:${slug}:email`, cleanEmail);
    window.location.href = `/checkout/${slug}`;
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="email-field">
        <span>다운로드 받을 이메일</span>
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="name@example.com" aria-label="구매 이메일" autoComplete="email" required />
        <small>결제 안내와 재다운로드 인증에 사용됩니다.</small>
      </label>
      <button className="buy-button" type="submit">주문 확인으로 이동</button>
    </form>
  );
}
