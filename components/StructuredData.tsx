// 화면에 보이는 정보를 검색엔진과 AI가 오해하지 않도록 기계가 읽는 JSON-LD 형식으로 함께 전달합니다.
export function StructuredData({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  // 상품명 등에 '<' 문자가 들어와도 스크립트 태그로 해석되지 않도록 안전한 문자로 바꿉니다.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
