// 검색엔진에는 노출하지 않고 실제 관리자 기능 화면을 불러오는 관리자 페이지 입구입니다.
import type { Metadata } from "next";
import { AdminDashboard } from "./AdminDashboard";

export const metadata: Metadata = { title: "상품 관리 | PAGEPORT", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminDashboard />;
}
