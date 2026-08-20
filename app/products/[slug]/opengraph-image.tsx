// 상품 주소를 공유할 때 상품명·분류·가격이 자동으로 들어간 전용 대표 이미지를 만듭니다.
import { ImageResponse } from "next/og";
import { getPublishedProduct } from "../../../lib/catalog-products";

export const alt = "PAGEPORT PDF 상품";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

const accentColors: Record<string, string> = {
  mint: "#b8d4bc",
  yellow: "#f4d460",
  blue: "#9cb9d4",
  pink: "#eeaaa7",
  purple: "#b4a5cf",
  orange: "#efb178",
  lime: "#c8d978",
  coral: "#ed8c73",
};

export default async function ProductOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  const color = accentColors[product?.accent ?? "mint"] ?? accentColors.mint;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#f6f1e7",
        color: "#17231d",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ width: "62%", padding: "68px 64px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 28, fontWeight: 900 }}>
          PAGEPORT<span style={{ color: "#ff5c35" }}>.</span>
        </div>
        <div style={{ marginTop: 78, fontSize: 23, fontWeight: 800, color: "#496656" }}>DIGITAL PDF</div>
        <div
          style={{ marginTop: 18, maxWidth: 690, fontSize: 61, fontWeight: 850, lineHeight: 1.08, letterSpacing: -3 }}
        >
          {product?.slug?.replaceAll("-", " ").toUpperCase() ?? "PAGEPORT PDF"}
        </div>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 22, fontSize: 25 }}>
          <span>PAGEPORT CREATOR</span>
          <span style={{ color: "#8b958e" }}>·</span>
          <span style={{ fontWeight: 900 }}>{product ? `${product.price.replace(/[^0-9,]/g, "")} KRW` : ""}</span>
        </div>
      </div>
      <div
        style={{
          width: "38%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: color,
          borderLeft: "2px solid #17231d",
        }}
      >
        <div
          style={{
            width: 280,
            height: 390,
            padding: 28,
            display: "flex",
            flexDirection: "column",
            background: "#fffdf7",
            border: "2px solid #17231d",
            boxShadow: "17px 17px 0 rgba(23,35,29,.18)",
            transform: "rotate(6deg)",
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 800 }}>PAGEPORT PDF</span>
          <span style={{ marginTop: "auto", fontSize: 54, fontWeight: 900, letterSpacing: -3 }}>
            {product?.mark ?? "PDF"}
          </span>
          <span style={{ marginTop: 20, fontSize: 18 }}>
            {product?.pages ? `${product.pages} PAGES` : "DIGITAL DOCUMENT"}
          </span>
        </div>
      </div>
    </div>,
    size,
  );
}
