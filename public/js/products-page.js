// 商品一覧ページクラス
class ProductsPage {
  constructor() {
    this.api = new SmaregiAPI();
    this.products = [];
    this.categories = [];
    this.selectedCategoryId = null;
    this.changedProducts = new Set();
    this.originalProducts = new Map();
    this.searchText = '';
    this.productImages = new Map(); // productId → 画像URLのマッピング
  }

  /**
   * 初期化
   */
  async init() {
    // ログインチェック
    if (!Auth.requireLogin()) return;

    // イベントリスナーを設定
    this.setupEventListeners();

    // データを取得
    await this.loadData();
  }

  /**
   * データ取得
   */
  async loadData() {
    try {
      Utils.showLoading(true);

      // 部門一覧と商品画像を並列取得
      await Promise.all([
        this.api.getCategories().then(categories => {
          this.categories = categories;
        }),
        this.loadProductImages()
      ]);

      this.renderCategoryTabs();

      // 最初の部門または全商品を表示
      if (this.categories && this.categories.length > 0) {
        this.selectedCategoryId = this.categories[0].categoryId;
      }

      // 商品一覧を取得
      await this.loadProducts();

    } catch (error) {
      console.error('Data load error:', error);
      Utils.showError('データの読み込みに失敗しました。' + error.message);
    } finally {
      Utils.showLoading(false);
    }
  }

  /**
   * 商品画像一覧を読み込み
   */
  async loadProductImages() {
    try {
      const images = await this.api.getProductImages();
      this.productImages.clear();
      if (images && Array.isArray(images)) {
        images.forEach(image => {
          this.productImages.set(image.productId, image.url);
        });
      }
    } catch (error) {
      console.error('Product images load error:', error);
      // エラーが発生しても画像なしで続行
    }
  }

  /**
   * 商品一覧を読み込み
   */
  async loadProducts() {
    try {
      Utils.showLoading(true);

      const params = {};
      params.sort = 'displaySequence';
      if (this.selectedCategoryId) {
        params.category_id = this.selectedCategoryId;
      }

      this.products = await this.api.getProducts(params);

      // オリジナルの状態を保存
      this.originalProducts.clear();
      this.products.forEach(product => {
        this.originalProducts.set(product.productId, {
          ...product
        });
      });

      // 変更をリセット
      this.changedProducts.clear();

      // 商品一覧を表示
      this.renderProducts();

    } catch (error) {
      console.error('Products load error:', error);
      Utils.showError('商品一覧の読み込みに失敗しました。' + error.message);
    } finally {
      Utils.showLoading(false);
    }
  }

  /**
   * 部門タブを表示
   */
  renderCategoryTabs() {
    const container = document.getElementById('category-tabs');
    if (!container) return;

    container.innerHTML = '';

    // 全商品タブ
    const allTab = this.createTab('all', '全商品', null);
    container.appendChild(allTab);

    // 各部門タブ
    if (this.categories && this.categories.length > 0) {
      this.categories.forEach(category => {
        const tab = this.createTab(
          category.categoryId,
          category.categoryName,
          category.categoryId
        );
        container.appendChild(tab);
      });
    }
  }

  /**
   * タブ要素を作成
   */
  createTab(id, name, categoryId) {
    const tab = document.createElement('button');
    tab.className = 'px-4 py-2 rounded-t-lg font-medium transition-colors';
    tab.textContent = name;
    tab.dataset.categoryId = categoryId;

    const isActive = (categoryId === null && this.selectedCategoryId === null) ||
                     (categoryId === this.selectedCategoryId);

    if (isActive) {
      tab.classList.add('bg-blue-600', 'text-white');
    } else {
      tab.classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
    }

    tab.addEventListener('click', () => {
      this.selectedCategoryId = categoryId;
      this.renderCategoryTabs();
      this.loadProducts();
    });

    return tab;
  }

  /**
   * 商品一覧を表示
   */
  renderProducts() {
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    let filteredProducts = this.products;

    // 検索フィルター
    if (this.searchText) {
      filteredProducts = Utils.filterArray(
        this.products,
        this.searchText,
        ['productCode', 'productName', 'productId']
      );
    }

    if (!filteredProducts || filteredProducts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="px-6 py-4 text-center text-gray-500">
            商品が見つかりませんでした
          </td>
        </tr>
      `;
      return;
    }

    filteredProducts.forEach(product => {
      const row = this.createProductRow(product);
      tbody.appendChild(row);
    });

    // 変更数を更新
    this.updateChangeCount();
  }

  /**
   * 商品行を作成
   */
  createProductRow(product) {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50';
    tr.dataset.productId = product.productId;

    // 変更されている場合は背景色を変更
    if (this.changedProducts.has(product.productId)) {
      tr.classList.add(CONFIG.UI.CHANGED_ROW_CLASS);
    }

    // チェックボックス
    const tdCheckbox = document.createElement('td');
    tdCheckbox.className = 'px-6 py-4';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'w-5 h-5 text-blue-600';
    checkbox.checked = product.displayFlag === '1' || product.displayFlag === 1;
    checkbox.dataset.productId = product.productId;
    checkbox.addEventListener('change', (e) => {
      this.onCheckboxChange(product.productId, e.target.checked);
    });
    tdCheckbox.appendChild(checkbox);
    tr.appendChild(tdCheckbox);

    // 商品コード
    const tdCode = document.createElement('td');
    tdCode.className = 'px-6 py-4 font-mono text-sm';
    tdCode.textContent = product.productCode || '-';
    tr.appendChild(tdCode);

    // 商品ID
    const tdId = document.createElement('td');
    tdId.className = 'px-6 py-4 text-sm text-gray-600';
    tdId.textContent = product.productId || '-';
    tr.appendChild(tdId);

    // アイコン
    const tdIcon = document.createElement('td');
    tdIcon.className = 'px-6 py-4';
    const imageUrl = this.productImages.get(product.productId);
    if (imageUrl) {
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = product.productName || '商品画像';
      img.className = 'w-12 h-12 object-cover rounded';
      img.loading = 'lazy';
      img.onerror = () => {
        img.style.display = 'none';
      };
      tdIcon.appendChild(img);
    }
    tr.appendChild(tdIcon);

    // 商品名
    const tdName = document.createElement('td');
    tdName.className = 'px-6 py-4 font-medium';
    tdName.textContent = product.productName || '-';
    tr.appendChild(tdName);

    // 価格
    const tdPrice = document.createElement('td');
    tdPrice.className = 'px-6 py-4 text-right';
    tdPrice.textContent = product.price ? `¥${Utils.formatNumber(product.price)}` : '-';
    tr.appendChild(tdPrice);

    return tr;
  }

  /**
   * チェックボックス変更イベント
   */
  onCheckboxChange(productId, isChecked) {
    const product = this.products.find(p => p.productId === productId);
    if (!product) return;

    const original = this.originalProducts.get(productId);
    const originalDisplayFlag = original.displayFlag === '1' || original.displayFlag === 1;

    // displayFlagを更新
    product.displayFlag = isChecked ? '1' : '0';

    // オリジナルと比較
    if (isChecked !== originalDisplayFlag) {
      this.changedProducts.add(productId);
    } else {
      this.changedProducts.delete(productId);
    }

    // 行のハイライトを更新
    const row = document.querySelector(`tr[data-product-id="${productId}"]`);
    if (row) {
      if (this.changedProducts.has(productId)) {
        row.classList.add(CONFIG.UI.CHANGED_ROW_CLASS);
      } else {
        row.classList.remove(CONFIG.UI.CHANGED_ROW_CLASS);
      }
    }

    // 変更数を更新
    this.updateChangeCount();
  }

  /**
   * 変更数を更新
   */
  updateChangeCount() {
    const countElement = document.getElementById('change-count');
    if (countElement) {
      const count = this.changedProducts.size;
      countElement.textContent = count > 0 ? `${count}件の変更` : '';
    }

    // 反映ボタンの有効/無効を切り替え
    const applyButton = document.getElementById('apply-button');
    if (applyButton) {
      applyButton.disabled = this.changedProducts.size === 0;
      if (this.changedProducts.size === 0) {
        applyButton.classList.add('opacity-50', 'cursor-not-allowed');
      } else {
        applyButton.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    }
  }

  /**
   * 反映ボタンクリックイベント
   */
  async onApplyClick() {
    if (this.changedProducts.size === 0) {
      Utils.showError(CONFIG.MESSAGES.NO_CHANGES);
      return;
    }

    const confirmed = confirm(`${this.changedProducts.size}件の商品を更新します。よろしいですか？`);
    if (!confirmed) return;

    try {
      Utils.setButtonDisabled('apply-button', true, CONFIG.MESSAGES.UPDATING);
      Utils.showLoading(true);

      // 変更された商品のデータを作成
      const productsToUpdate = [];
      this.changedProducts.forEach(productId => {
        const product = this.products.find(p => p.productId === productId);
        if (product) {
          productsToUpdate.push({
            productId: product.productId,
            displayFlag: product.displayFlag,
            productName: product.productName,
            categoryId: product.categoryId
          });
        }
      });

      // APIに送信
      const result = await this.api.updateProducts(productsToUpdate);

      Utils.showSuccess(CONFIG.MESSAGES.UPDATE_SUCCESS, 'success-message');

      // 商品一覧を再読み込み
      await this.loadProducts();

    } catch (error) {
      console.error('Update error:', error);
      Utils.showError(CONFIG.MESSAGES.UPDATE_FAILED + ' ' + error.message);
    } finally {
      Utils.setButtonDisabled('apply-button', false, '反映');
      Utils.showLoading(false);
    }
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    // 検索フィルター
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchText = e.target.value;
        this.renderProducts();
      });
    }

    // 反映ボタン
    const applyButton = document.getElementById('apply-button');
    if (applyButton) {
      applyButton.addEventListener('click', () => {
        this.onApplyClick();
      });
    }

    // ログアウトボタン
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        Auth.logout();
      });
    }

    // リロードボタン
    const reloadButton = document.getElementById('reload-button');
    if (reloadButton) {
      reloadButton.addEventListener('click', () => {
        this.loadProducts();
      });
    }
  }
}

// ページロード時に初期化
let productsPage;
window.addEventListener('DOMContentLoaded', () => {
  productsPage = new ProductsPage();
  productsPage.init();
});
