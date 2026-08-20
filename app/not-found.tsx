export default function NotFound() {
  return (
    <main className="status-page">
      <section className="status-card">
        <a className="brand" href="/">
          PAGEPORT<span>.</span>
        </a>
        <p className="eyebrow">404</p>
        <h1>페이지를 찾지 못했어요</h1>
        <p>주소가 바뀌었거나 더 이상 제공하지 않는 페이지입니다.</p>
        <a className="primary-button" href="/">
          상품 보러 가기
        </a>
      </section>
    </main>
  );
}
