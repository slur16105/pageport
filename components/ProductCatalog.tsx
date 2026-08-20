"use client";

import { useMemo, useState } from "react";
import type { Product } from "../app/data/products";

const categories = ["전체", "업무·생산성", "공부·교육", "디자인", "돈관리", "생활", "취미"];

export function ProductCatalog({ products }: { products: Product[] }) {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const filteredProducts = useMemo(
    () =>
      selectedCategory === "전체" ? products : products.filter((product) => product.category === selectedCategory),
    [products, selectedCategory],
  );

  return (
    <>
      <section className="category-bar" aria-label="상품 카테고리">
        {categories.map((category) => {
          const selected = category === selectedCategory;
          return (
            <button
              className={selected ? "active" : ""}
              type="button"
              key={category}
              aria-pressed={selected}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          );
        })}
      </section>

      <section className="products-section" id="products" aria-live="polite">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PAGEPORT의 첫 컬렉션</p>
            <h2>{selectedCategory === "전체" ? "업무와 생활을 가볍게" : selectedCategory}</h2>
          </div>
          <span>{filteredProducts.length}개의 상품 · 상품 하나씩 바로 구매</span>
        </div>
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <a className="product-card" href={`/products/${product.slug}`} key={product.slug}>
              <div className={`product-cover ${product.accent}`}>
                <span>{product.category}</span>
                <b>{product.mark}</b>
                <div className="cover-lines" />
              </div>
              <div className="product-info">
                <small>
                  {product.seller} · {product.pages}쪽
                </small>
                <h3>{product.title}</h3>
                <p>{product.description}</p>
                <div className="price-row">
                  <strong>{product.price}</strong>
                  <span aria-hidden="true">→</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
