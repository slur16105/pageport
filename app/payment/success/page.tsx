// 토스에서 결제 성공 후 돌아오는 주소로, 받은 결제 정보가 기본 형식에 맞는지 확인해 승인 화면에 전달합니다.
import type { Metadata } from "next";
import { PaymentSuccess } from "./PaymentSuccess";

export const metadata: Metadata = { title: "시험 결제 결과 | PAGEPORT", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ paymentKey?: string; orderId?: string; amount?: string }> };

export default async function PaymentSuccessPage({ searchParams }: Props) {
  // 금액이 숫자가 아니거나 필수 정보가 빠졌다면 잘못된 결제 정보로 처리합니다.
  const params = await searchParams;
  const amount = Number(params.amount);
  const payment =
    params.paymentKey && params.orderId && Number.isInteger(amount)
      ? { paymentKey: params.paymentKey, orderId: params.orderId, amount }
      : null;
  return <PaymentSuccess payment={payment} />;
}
