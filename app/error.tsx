"use client";

// 예상하지 못한 화면 오류가 생겼을 때 사용자가 다시 시도하거나 홈으로 돌아갈 수 있게 하는 공통 오류 화면입니다.

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="status-page">
      <section className="status-card">
        <a className="brand" href="/">
          PAGEPORT<span>.</span>
        </a>
        <p className="eyebrow">잠시 문제가 생겼어요</p>
        <h1>화면을 불러오지 못했습니다</h1>
        <p>결제나 주문 상태가 자동으로 사라지지는 않습니다. 잠시 후 다시 시도해 주세요.</p>
        <div className="status-actions">
          <button className="primary-button" type="button" onClick={reset}>
            다시 시도
          </button>
          <a className="text-link" href="/">
            홈으로 이동
          </a>
        </div>
      </section>
    </main>
  );
}
