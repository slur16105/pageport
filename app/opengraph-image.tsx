// PAGEPORT 주소를 카카오톡·SNS에 공유할 때 기본으로 보이는 1200×630 대표 이미지를 만듭니다.
import { ImageResponse } from "next/og";

export const alt = "PAGEPORT — 전문 지식이 오가는 디지털 문서 마켓";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#f6f1e7",
        color: "#17231d",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ width: "58%", padding: "72px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 30, fontWeight: 900, letterSpacing: -1 }}>
          PAGEPORT<span style={{ color: "#ff5c35" }}>.</span>
        </div>
        <div
          style={{
            marginTop: 78,
            display: "flex",
            flexDirection: "column",
            fontSize: 70,
            fontWeight: 800,
            lineHeight: 1.04,
            letterSpacing: -4,
          }}
        >
          <span>KNOWLEDGE,</span>
          <span style={{ color: "#ff5c35" }}>READY TO USE.</span>
        </div>
        <div style={{ marginTop: 32, fontSize: 25, color: "#536158" }}>Practical PDFs. No signup required.</div>
      </div>
      <div
        style={{
          width: "42%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#b8d4bc",
          borderLeft: "2px solid #17231d",
        }}
      >
        <div
          style={{
            width: 270,
            height: 380,
            padding: 30,
            display: "flex",
            flexDirection: "column",
            background: "#fffdf7",
            border: "2px solid #17231d",
            boxShadow: "18px 18px 0 rgba(23,35,29,.18)",
            transform: "rotate(7deg)",
          }}
        >
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: 2 }}>PAGEPORT</span>
          <span
            style={{
              marginTop: 75,
              display: "flex",
              flexDirection: "column",
              fontSize: 54,
              fontWeight: 900,
              lineHeight: 0.98,
            }}
          >
            <span>WEEKLY</span>
            <span>FOCUS</span>
          </span>
          <span style={{ marginTop: "auto", display: "flex", flexDirection: "column", fontSize: 18, color: "#536158" }}>
            <span>Made by creators.</span>
            <span>Ready for you.</span>
          </span>
        </div>
      </div>
    </div>,
    size,
  );
}
