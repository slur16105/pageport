import type { Metadata } from "next";
import { AdminDashboard } from "./AdminDashboard";

export const metadata: Metadata = { title: "상품 관리 | PAGEPORT", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminDashboard />;
}
