// 접근할 수 없는 이유를 주소의 reason 값으로 받아 상황에 맞는 설명과 다음 행동을 보여주는 페이지입니다.
import type { Metadata } from "next";
import { AccessNotice, getAccessReason } from "../../../components/AccessNotice";

export const metadata: Metadata = {
  title: "접근 안내 | PAGEPORT",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ reason?: string }> };

export default async function AccessUnavailablePage({ searchParams }: Props) {
  const params = await searchParams;
  return <AccessNotice reason={getAccessReason(params.reason)} />;
}
