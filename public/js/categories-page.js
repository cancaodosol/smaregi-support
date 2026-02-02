// 部門一覧ページクラス
class CategoriesPage {
  constructor() {
    this.api = new SmaregiAPI();
    this.categories = [];
    this.changedCategories = new Set();
    this.originalCategories = new Map();
    this.searchText = '';
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
    await this.loadCategories();
  }

  /**
   * 部門一覧を読み込み
   */
  async loadCategories() {
    try {
      Utils.showLoading(true);

      this.categories = await this.api.getCategories({ sort: 'displaySequence' });

      // オリジナルの状態を保存
      this.originalCategories.clear();
      this.categories.forEach(category => {
        this.originalCategories.set(category.categoryId, {
          ...category
        });
      });

      // 変更をリセット
      this.changedCategories.clear();

      // 部門一覧を表示
      this.renderCategories();

    } catch (error) {
      console.error('Categories load error:', error);
      Utils.showError('部門一覧の読み込みに失敗しました。' + error.message);
    } finally {
      Utils.showLoading(false);
    }
  }

  /**
   * 部門一覧を表示
   */
  renderCategories() {
    const tbody = document.getElementById('categories-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    let filteredCategories = this.categories;

    // 検索フィルター
    if (this.searchText) {
      filteredCategories = Utils.filterArray(
        this.categories,
        this.searchText,
        ['categoryCode', 'categoryName', 'categoryId']
      );
    }

    if (!filteredCategories || filteredCategories.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="2" class="px-6 py-4 text-center text-gray-500">
            部門が見つかりませんでした
          </td>
        </tr>
      `;
      return;
    }

    filteredCategories.forEach(category => {
      const row = this.createCategoryRow(category);
      tbody.appendChild(row);
    });

    // 変更数を更新
    this.updateChangeCount();
  }

  /**
   * 部門行を作成
   */
  createCategoryRow(category) {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50';
    tr.dataset.categoryId = category.categoryId;

    // 変更されている場合は背景色を変更
    if (this.changedCategories.has(category.categoryId)) {
      tr.classList.add(CONFIG.UI.CHANGED_ROW_CLASS);
    }

    // チェックボックス
    const tdCheckbox = document.createElement('td');
    tdCheckbox.className = 'px-6 py-4';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'w-5 h-5 text-blue-600';
    checkbox.checked = category.displayFlag === '1' || category.displayFlag === 1;
    checkbox.dataset.categoryId = category.categoryId;
    checkbox.addEventListener('change', (e) => {
      this.onCheckboxChange(category.categoryId, e.target.checked);
    });
    tdCheckbox.appendChild(checkbox);
    tr.appendChild(tdCheckbox);

    // 部門名
    const tdName = document.createElement('td');
    tdName.className = 'px-6 py-4 font-medium';
    tdName.textContent = category.categoryName || '-';
    tr.appendChild(tdName);

    return tr;
  }

  /**
   * チェックボックス変更イベント
   */
  onCheckboxChange(categoryId, isChecked) {
    const category = this.categories.find(c => c.categoryId === categoryId);
    if (!category) return;

    const original = this.originalCategories.get(categoryId);
    const originalDisplayFlag = original.displayFlag === '1' || original.displayFlag === 1;

    // displayFlagを更新
    category.displayFlag = isChecked ? '1' : '0';

    // オリジナルと比較
    if (isChecked !== originalDisplayFlag) {
      this.changedCategories.add(categoryId);
    } else {
      this.changedCategories.delete(categoryId);
    }

    // 行のハイライトを更新
    const row = document.querySelector(`tr[data-category-id="${categoryId}"]`);
    if (row) {
      if (this.changedCategories.has(categoryId)) {
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
      const count = this.changedCategories.size;
      countElement.textContent = count > 0 ? `${count}件の変更` : '';
    }

    // 反映ボタンの有効/無効を切り替え
    const applyButton = document.getElementById('apply-button');
    if (applyButton) {
      applyButton.disabled = this.changedCategories.size === 0;
      if (this.changedCategories.size === 0) {
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
    if (this.changedCategories.size === 0) {
      Utils.showError(CONFIG.MESSAGES.NO_CHANGES);
      return;
    }

    const confirmed = confirm(`${this.changedCategories.size}件の部門を更新します。よろしいですか？`);
    if (!confirmed) return;

    try {
      Utils.setButtonDisabled('apply-button', true, CONFIG.MESSAGES.UPDATING);
      Utils.showLoading(true);

      // 変更された部門のデータを作成
      const categoriesToUpdate = [];
      this.changedCategories.forEach(categoryId => {
        const category = this.categories.find(c => c.categoryId === categoryId);
        if (category) {
          categoriesToUpdate.push({
            categoryId: category.categoryId,
            displayFlag: category.displayFlag,
            categoryName: category.categoryName
          });
        }
      });

      // APIに送信
      const result = await this.api.updateCategories(categoriesToUpdate);

      Utils.showSuccess(CONFIG.MESSAGES.UPDATE_SUCCESS, 'success-message');

      // 部門一覧を再読み込み
      await this.loadCategories();

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
        this.renderCategories();
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
        this.loadCategories();
      });
    }
  }
}

// ページロード時に初期化
let categoriesPage;
window.addEventListener('DOMContentLoaded', () => {
  categoriesPage = new CategoriesPage();
  categoriesPage.init();
});
