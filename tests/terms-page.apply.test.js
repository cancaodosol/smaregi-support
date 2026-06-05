'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

/**
 * filterApplicableProducts の純粋関数再現。
 * 非表示部門に属する商品を除外し、部門未設定商品は維持する。
 * 商品自身の displayFlag でのフィルタは行わない（適用処理専用）。
 */
function filterApplicableProducts(termCategories, termProducts) {
  const hiddenCategoryIds = new Set(
    (termCategories || [])
      .filter(c => c.displayFlag !== '1')
      .map(c => c.categoryId)
  );
  return (termProducts || []).filter(p => !p.categoryId || !hiddenCategoryIds.has(p.categoryId));
}

/**
 * diffByDisplayFlag の純粋関数再現。
 * termItems のうち currentMap と displayFlag が異なるもの、または currentMap に存在しないものを返す。
 */
function diffByDisplayFlag(termItems, currentMap, idKey) {
  return termItems.filter(item => {
    const current = currentMap.get(item[idKey]);
    return !current || current.displayFlag !== item.displayFlag;
  });
}

// ---------------------------------------------------------------------------
// filterApplicableProducts
// ---------------------------------------------------------------------------

describe('filterApplicableProducts', () => {
  it('should include products in visible categories', () => {
    // Given: 表示ON部門 + その部門の商品
    const categories = [{ categoryId: '10', displayFlag: '1' }];
    const products = [{ productId: '1', categoryId: '10', displayFlag: '1' }];

    // When
    const result = filterApplicableProducts(categories, products);

    // Then
    assert.equal(result.length, 1);
    assert.equal(result[0].productId, '1');
  });

  it('should exclude products in hidden categories', () => {
    // Given: 非表示部門 + その部門の商品
    const categories = [{ categoryId: '10', displayFlag: '0' }];
    const products = [{ productId: '1', categoryId: '10', displayFlag: '1' }];

    // When
    const result = filterApplicableProducts(categories, products);

    // Then: 非表示部門なので除外
    assert.equal(result.length, 0);
  });

  it('should include products with displayFlag off when category is visible', () => {
    // Given: 表示ON部門 + 商品自身は displayFlag: '0'
    // filterApplicableProducts は商品自身の displayFlag でフィルタしない
    const categories = [{ categoryId: '10', displayFlag: '1' }];
    const products = [{ productId: '1', categoryId: '10', displayFlag: '0' }];

    // When
    const result = filterApplicableProducts(categories, products);

    // Then: 商品自身の displayFlag は見ないので含める
    assert.equal(result.length, 1);
  });

  it('should include products with null categoryId (unassigned products)', () => {
    // Given: 部門未設定商品（categoryId が null）
    const categories = [{ categoryId: '10', displayFlag: '0' }];
    const products = [{ productId: '1', categoryId: null, displayFlag: '1' }];

    // When
    const result = filterApplicableProducts(categories, products);

    // Then: 部門未設定商品は除外しない
    assert.equal(result.length, 1);
    assert.equal(result[0].productId, '1');
  });

  it('should include products with empty string categoryId (unassigned products)', () => {
    // Given: categoryId が空文字（falsy）の商品
    const categories = [{ categoryId: '10', displayFlag: '0' }];
    const products = [{ productId: '1', categoryId: '', displayFlag: '1' }];

    // When
    const result = filterApplicableProducts(categories, products);

    // Then: falsy な categoryId は部門未設定として扱い除外しない
    assert.equal(result.length, 1);
  });

  it('should handle mixed visible and hidden categories', () => {
    // Given: 表示ON部門・非表示部門の混在
    const categories = [
      { categoryId: '10', displayFlag: '1' },
      { categoryId: '20', displayFlag: '0' },
    ];
    const products = [
      { productId: '1', categoryId: '10', displayFlag: '1' },
      { productId: '2', categoryId: '20', displayFlag: '1' },
      { productId: '3', categoryId: null, displayFlag: '1' },
    ];

    // When
    const result = filterApplicableProducts(categories, products);

    // Then: 商品1（表示部門）と商品3（部門未設定）を含み、商品2（非表示部門）は除外
    assert.equal(result.length, 2);
    assert.deepEqual(
      result.map(p => p.productId).sort(),
      ['1', '3']
    );
  });

  it('should return all products when no hidden categories exist', () => {
    // Given: 全部門が表示ON
    const categories = [
      { categoryId: '10', displayFlag: '1' },
      { categoryId: '20', displayFlag: '1' },
    ];
    const products = [
      { productId: '1', categoryId: '10', displayFlag: '1' },
      { productId: '2', categoryId: '20', displayFlag: '0' },
    ];

    // When
    const result = filterApplicableProducts(categories, products);

    // Then: 全商品を含む
    assert.equal(result.length, 2);
  });

  it('should handle null termCategories and termProducts', () => {
    // Given: null データ
    const result = filterApplicableProducts(null, null);
    assert.equal(result.length, 0);
  });

  it('should handle empty arrays', () => {
    // Given: 空データ
    const result = filterApplicableProducts([], []);
    assert.equal(result.length, 0);
  });
});

// ---------------------------------------------------------------------------
// diffByDisplayFlag
// ---------------------------------------------------------------------------

describe('diffByDisplayFlag', () => {
  it('should return empty array when all displayFlags match current state', () => {
    // Given: ターム・現在状態が同一
    const termCategories = [
      { categoryId: '10', displayFlag: '1' },
      { categoryId: '20', displayFlag: '0' },
    ];
    const currentMap = new Map([
      ['10', { categoryId: '10', displayFlag: '1' }],
      ['20', { categoryId: '20', displayFlag: '0' }],
    ]);

    // When
    const result = diffByDisplayFlag(termCategories, currentMap, 'categoryId');

    // Then: 差分なし
    assert.equal(result.length, 0);
  });

  it('should return items where displayFlag differs from current state', () => {
    // Given: 1件の displayFlag が異なる
    const termCategories = [
      { categoryId: '10', displayFlag: '0' },
      { categoryId: '20', displayFlag: '1' },
    ];
    const currentMap = new Map([
      ['10', { categoryId: '10', displayFlag: '1' }],
      ['20', { categoryId: '20', displayFlag: '1' }],
    ]);

    // When
    const result = diffByDisplayFlag(termCategories, currentMap, 'categoryId');

    // Then: categoryId '10' のみ差分あり
    assert.equal(result.length, 1);
    assert.equal(result[0].categoryId, '10');
  });

  it('should include items not present in current state', () => {
    // Given: スマレジに存在しない商品
    const termProducts = [
      { productId: 'NEW', displayFlag: '1' },
    ];
    const currentMap = new Map();

    // When
    const result = diffByDisplayFlag(termProducts, currentMap, 'productId');

    // Then: 現在状態に存在しないので更新対象に含める
    assert.equal(result.length, 1);
    assert.equal(result[0].productId, 'NEW');
  });

  it('should handle mixed: some match, some differ, some not in current', () => {
    // Given: 一致・不一致・未登録の混在
    const termProducts = [
      { productId: '1', displayFlag: '1' },  // 一致（スキップ）
      { productId: '2', displayFlag: '0' },  // 不一致（更新対象）
      { productId: '3', displayFlag: '1' },  // 現在状態になし（更新対象）
    ];
    const currentMap = new Map([
      ['1', { productId: '1', displayFlag: '1' }],
      ['2', { productId: '2', displayFlag: '1' }],
    ]);

    // When
    const result = diffByDisplayFlag(termProducts, currentMap, 'productId');

    // Then: 商品2（不一致）と商品3（未登録）が対象
    assert.equal(result.length, 2);
    assert.deepEqual(
      result.map(p => p.productId).sort(),
      ['2', '3']
    );
  });

  it('should return all items when current state is empty', () => {
    // Given: 現在のスマレジ状態が空（初期登録ケース）
    const termProducts = [
      { productId: '1', displayFlag: '1' },
      { productId: '2', displayFlag: '0' },
    ];
    const currentMap = new Map();

    // When
    const result = diffByDisplayFlag(termProducts, currentMap, 'productId');

    // Then: 全件更新対象
    assert.equal(result.length, 2);
  });

  it('should return empty array when termItems is empty', () => {
    // Given: ターム側が空
    const currentMap = new Map([
      ['10', { categoryId: '10', displayFlag: '1' }],
    ]);

    // When
    const result = diffByDisplayFlag([], currentMap, 'categoryId');

    // Then: 更新対象なし
    assert.equal(result.length, 0);
  });
});
