import type { Metadata } from "next";
import { PaymentSuccess } from "./PaymentSuccess";

export const metadata: Metadata = { title: "시험 결제 결과 | PAGEPORT", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ paymentKey?: string; orderId?: string; amount?: string }> };

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const amount = Number(params.amount);
  const payment = params.paymentKey && params.orderId && Number.isInteger(amount)
    ? { paymentKey: params.paymentKey, orderId: params.orderId, amount }
    : null;
  return <PaymentSuccess payment={payment} />;
}
