// 商品一覧ページクラス
class ProductsPage {
  constructor() {
    this.api = new SmaregiAPI();
    this.allProducts = [];      // 全商品データ（一括取得）
    this.products = [];         // 表示用商品（フィルタリング結果）
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

      // 部門一覧、商品画像、全商品を並列取得
      await Promise.all([
        this.api.getCategories({ sort: 'displaySequence' }).then(categories => {
          this.categories = categories;
        }),
        this.loadProductImages(),
        this.loadAllProducts()
      ]);

      this.renderCategoryTabs();

      // 最初の部門または全商品を表示
      if (this.categories && this.categories.length > 0) {
        this.selectedCategoryId = this.categories[0].categoryId;
      }

      // 部門でフィルタリングして表示
      this.filterAndDisplayProducts();

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
   * 全商品を一括で読み込み（API呼び出しは初回のみ）
   */
  async loadAllProducts() {
    try {
      // 全商品を取得（category_idは指定しない）
      this.allProducts = await this.api.getProducts({ sort: 'displaySequence' });

      // オリジナルの状態を保存
      this.originalProducts.clear();
      this.allProducts.forEach(product => {
        this.originalProducts.set(product.productId, {
          ...product
        });
      });

      // 変更をリセット
      this.changedProducts.clear();

    } catch (error) {
      console.error('Products load error:', error);
      Utils.showError('商品一覧の読み込みに失敗しました。' + error.message);
      throw error;
    }
  }

  /**
   * 選択中の部門でフィルタリングして表示（API呼び出しなし）
   */
  filterAndDisplayProducts() {
    // 部門でフィルタリング
    if (this.selectedCategoryId === null) {
      // 全商品表示
      this.products = [...this.allProducts];
    } else {
      // 選択された部門の商品のみ
      this.products = this.allProducts.filter(
        product => product.categoryId === this.selectedCategoryId
      );
    }

    // 商品一覧を表示
    this.renderProducts();
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
    tab.textContent = name;
    tab.dataset.categoryId = categoryId;

    const isActive = (categoryId === null && this.selectedCategoryId === null) ||
                     (categoryId === this.selectedCategoryId);

    // ベーススタイル
    const baseClass = 'px-5 py-3 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap';

    if (isActive) {
      tab.className = `${baseClass} text-blue-600 border-blue-600`;
    } else {
      tab.className = `${baseClass} text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300`;
    }

    tab.addEventListener('click', () => {
      this.selectedCategoryId = categoryId;
      this.renderCategoryTabs();
      this.filterAndDisplayProducts();  // API呼び出しなしでフィルタリング
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
          <td colspan="4" class="px-4 py-8 text-center text-gray-500 text-sm
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
    tdCheckbox.className = 'px-4 py-2';
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

    // アイコン
    const tdIcon = document.createElement('td');
    tdIcon.className = 'px-4 py-2';
    const imageUrl = this.productImages.get(product.productId);
    if (imageUrl) {
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = product.productName || '商品画像';
      img.className = 'w-10 h-10 object-cover rounded';
      img.loading = 'lazy';
      img.onerror = () => {
        img.style.display = 'none';
      };
      tdIcon.appendChild(img);
    }
    tr.appendChild(tdIcon);

    // 商品名
    const tdName = document.createElement('td');
    tdName.className = 'px-4 py-2 text-sm';
    tdName.textContent = product.productName || '-';
    tr.appendChild(tdName);

    // 価格
    const tdPrice = document.createElement('td');
    tdPrice.className = 'px-4 py-2 text-right text-sm';
    tdPrice.textContent = product.price ? `¥${Utils.formatNumber(product.price)}` : '-';
    tr.appendChild(tdPrice);

    return tr;
  }

  /**
   * チェックボックス変更イベント
   */
  onCheckboxChange(productId, isChecked) {
    const product = this.products.find(p => p.productId === productId);
    const allProduct = this.allProducts.find(p => p.productId === productId);
    if (!product || !allProduct) return;

    const original = this.originalProducts.get(productId);
    const originalDisplayFlag = original.displayFlag === '1' || original.displayFlag === 1;

    // displayFlagを更新（表示用とマスターデータの両方）
    const newDisplayFlag = isChecked ? '1' : '0';
    product.displayFlag = newDisplayFlag;
    allProduct.displayFlag = newDisplayFlag;

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
      await this.api.updateProducts(productsToUpdate);

      Utils.showSuccess(CONFIG.MESSAGES.UPDATE_SUCCESS, 'success-message');

      // ローカルで状態を更新（API再取得なし）
      this.changedProducts.forEach(productId => {
        const product = this.allProducts.find(p => p.productId === productId);
        if (product) {
          // オリジナルの状態を現在の値で更新
          this.originalProducts.set(productId, { ...product });
        }
      });

      // 変更をクリア
      this.changedProducts.clear();

      // 表示を更新
      this.filterAndDisplayProducts();

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
      reloadButton.addEventListener('click', async () => {
        try {
          Utils.showLoading(true);
          await this.loadAllProducts();
          this.filterAndDisplayProducts();
        } catch (error) {
          console.error('Reload error:', error);
        } finally {
          Utils.showLoading(false);
        }
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
