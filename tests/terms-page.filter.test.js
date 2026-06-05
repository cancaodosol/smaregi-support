'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

/**
 * onViewTerm の visibleProducts フィルタロジックを純粋関数として再現する。
 * DOM に依存しない部分だけを抽出して仕様を検証する。
 */
function filterVisibleProducts(categories, products) {
  const visibleCategories = (categories || []).filter(c => c.displayFlag === '1');
  const visibleCategoryIds = new Set(visibleCategories.map(c => c.categoryId));
  return (products || [])
    .filter(p => p.displayFlag === '1')
    .filter(p => !p.categoryId || visibleCategoryIds.has(p.categoryId));
}

describe('filterVisibleProducts', () => {
  it('should include products in visible categories', () => {
    // Given: 表示ON部門 + その部門に属する表示ON商品
    const categories = [{ categoryId: '10', displayFlag: '1', categoryName: '食品' }];
    const products = [{ productId: '1', categoryId: '10', displayFlag: '1', productName: '商品A' }];

    // When
    const result = filterVisibleProducts(categories, products);

    // Then
    assert.equal(result.length, 1);
    assert.equal(result[0].productId, '1');
  });

  it('should exclude products in hidden categories', () => {
    // Given: 非表示部門 + その部門に属する表示ON商品
    const categories = [{ categoryId: '10', displayFlag: '0', categoryName: '非表示部門' }];
    const products = [{ productId: '1', categoryId: '10', displayFlag: '1', productName: '商品A' }];

    // When
    const result = filterVisibleProducts(categories, products);

    // Then: 部門が非表示なので商品も除外される
    assert.equal(result.length, 0);
  });

  it('should exclude products with displayFlag off regardless of category', () => {
    // Given: 表示ON部門 + 表示OFF商品
    const categories = [{ categoryId: '10', displayFlag: '1', categoryName: '食品' }];
    const products = [{ productId: '1', categoryId: '10', displayFlag: '0', productName: '商品A' }];

    // When
    const result = filterVisibleProducts(categories, products);

    // Then: 商品自身の displayFlag が '0' なので除外
    assert.equal(result.length, 0);
  });

  it('should include products with no categoryId (unassigned products)', () => {
    // Given: 部門なし（categoryId が null）の表示ON商品
    const categories = [];
    const products = [{ productId: '1', categoryId: null, displayFlag: '1', productName: '商品A' }];

    // When
    const result = filterVisibleProducts(categories, products);

    // Then: 部門未設定商品は除外しない
    assert.equal(result.length, 1);
    assert.equal(result[0].productId, '1');
  });

  it('should include products with falsy categoryId (empty string)', () => {
    // Given: categoryId が空文字の表示ON商品
    const categories = [];
    const products = [{ productId: '1', categoryId: '', displayFlag: '1', productName: '商品A' }];

    // When
    const result = filterVisibleProducts(categories, products);

    // Then: falsy な categoryId は部門未設定として扱い除外しない
    assert.equal(result.length, 1);
  });

  it('should include products in visible categories and exclude products in hidden categories simultaneously', () => {
    // Given: 表示ON部門・非表示部門の混在
    const categories = [
      { categoryId: '10', displayFlag: '1', categoryName: '表示部門' },
      { categoryId: '20', displayFlag: '0', categoryName: '非表示部門' },
    ];
    const products = [
      { productId: '1', categoryId: '10', displayFlag: '1', productName: '表示部門の商品' },
      { productId: '2', categoryId: '20', displayFlag: '1', productName: '非表示部門の商品' },
      { productId: '3', categoryId: null, displayFlag: '1', productName: '部門未設定の商品' },
    ];

    // When
    const result = filterVisibleProducts(categories, products);

    // Then: 商品1（表示部門）と商品3（部門未設定）が含まれ、商品2（非表示部門）は除外
    assert.equal(result.length, 2);
    assert.deepEqual(
      result.map(p => p.productId).sort(),
      ['1', '3']
    );
  });

  it('should handle empty categories and products arrays', () => {
    // Given: 空のデータ
    const result = filterVisibleProducts([], []);
    assert.equal(result.length, 0);
  });

  it('should handle null categories and products', () => {
    // Given: null データ（API 未取得時を想定）
    const result = filterVisibleProducts(null, null);
    assert.equal(result.length, 0);
  });
});
