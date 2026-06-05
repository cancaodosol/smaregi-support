class TermsPage {
  constructor() {
    this.api = new SmaregiAPI();
    this.terms = [];
  }

  async init() {
    if (!Auth.requireLogin()) return;
    this.setupEventListeners();
    await this.loadTerms();
  }

  // ターム一覧を取得して表示
  async loadTerms() {
    try {
      Utils.showLoading(true);
      const data = await this.termsRequest('GET');
      this.terms = data.terms || [];
      this.renderTerms();
    } catch (error) {
      Utils.showError('タームの読み込みに失敗しました。' + error.message);
    } finally {
      Utils.showLoading(false);
    }
  }

  // ターム一覧をテーブルに描画
  renderTerms() {
    const tbody = document.getElementById('terms-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (this.terms.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" class="px-4 py-8 text-center text-gray-500 text-sm">
            タームがありません。「新規作成」から追加してください。
          </td>
        </tr>
      `;
      return;
    }

    this.terms.forEach(term => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-gray-50';

      const updatedAt = Utils.formatDate(term.updatedAt, 'YYYY/MM/DD HH:mm');

      tr.innerHTML = `
        <td class="px-4 py-3 text-sm font-medium text-gray-800">${Utils.escapeHtml(term.name)}</td>
        <td class="px-4 py-3 text-sm text-gray-500">${updatedAt}</td>
        <td class="px-4 py-3 text-right">
          <div class="flex items-center justify-end gap-2">
            <button
              data-action="view"
              data-id="${term.id}"
              class="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition"
            >参照</button>
            <button
              data-action="apply"
              data-id="${term.id}"
              class="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition"
            >適用</button>
            <button
              data-action="overwrite"
              data-id="${term.id}"
              class="px-3 py-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded transition"
            >上書き</button>
            <button
              data-action="delete"
              data-id="${term.id}"
              class="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition"
            >削除</button>
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });
  }

  // 新規作成: 現在のスマレジ状況で保存
  async onSaveCurrentState() {
    const nameInput = document.getElementById('new-term-name');
    const name = nameInput?.value.trim();

    if (!name) {
      Utils.showError('ターム名を入力してください。');
      return;
    }

    try {
      Utils.showLoading(true);
      this.closeCreateModal();

      const { categories, products } = await this.fetchCurrentSmaregiState();

      await this.termsRequest('POST', { name, categories, products });

      Utils.showSuccess(`ターム「${name}」を保存しました。`);
      await this.loadTerms();
    } catch (error) {
      Utils.showError('保存に失敗しました。' + error.message);
    } finally {
      Utils.showLoading(false);
    }
  }

  // 参照: 表示ONの部門・商品をテキストで表示
  onViewTerm(termId) {
    const term = this.terms.find(t => t.id === termId);
    if (!term) return;

    const visibleCategories = (term.categories || []).filter(c => c.displayFlag === '1');
    const visibleProducts = (term.products || []).filter(p => p.displayFlag === '1');

    const categoryLines = visibleCategories.map(c => `  ${Utils.escapeHtml(c.categoryName)}`).join('\n');
    const productLines = visibleProducts.map(p => `  ${Utils.escapeHtml(p.productName)}`).join('\n');

    const content = document.getElementById('view-modal-content');
    if (content) {
      content.innerHTML = `
        <div class="mb-4">
          <p class="font-semibold text-gray-700 mb-2">【部門】</p>
          ${visibleCategories.length > 0
            ? visibleCategories.map(c => `<p class="py-0.5 pl-3">${Utils.escapeHtml(c.categoryName)}</p>`).join('')
            : '<p class="pl-3 text-gray-400">なし</p>'
          }
        </div>
        <div>
          <p class="font-semibold text-gray-700 mb-2">【商品】</p>
          ${visibleProducts.length > 0
            ? visibleProducts.map(p => `<p class="py-0.5 pl-3">${Utils.escapeHtml(p.productName)}</p>`).join('')
            : '<p class="pl-3 text-gray-400">なし</p>'
          }
        </div>
      `;
    }

    const title = document.getElementById('view-modal-title');
    if (title) title.textContent = term.name;

    document.getElementById('view-modal')?.classList.remove('hidden');
  }

  // 適用: タームの設定をスマレジに書き込む
  async onApplyTerm(termId) {
    const term = this.terms.find(t => t.id === termId);
    if (!term) return;

    const confirmed = confirm(`ターム「${term.name}」をスマレジに適用します。\n現在のスマレジの表示設定が上書きされます。よろしいですか？`);
    if (!confirmed) return;

    try {
      Utils.showLoading(true);

      const categories = term.categories || [];
      const products = term.products || [];

      await Promise.all([
        categories.length > 0 ? this.api.updateCategories(categories) : Promise.resolve(),
        products.length > 0 ? this.api.updateProducts(products) : Promise.resolve()
      ]);

      Utils.showSuccess(`ターム「${term.name}」を適用しました。`);
    } catch (error) {
      Utils.showError('適用に失敗しました。' + error.message);
    } finally {
      Utils.showLoading(false);
    }
  }

  // 上書き: 現在のスマレジ状況でタームを更新
  async onOverwriteTerm(termId) {
    const term = this.terms.find(t => t.id === termId);
    if (!term) return;

    const confirmed = confirm(`ターム「${term.name}」を現在のスマレジ状況で上書きします。よろしいですか？`);
    if (!confirmed) return;

    try {
      Utils.showLoading(true);

      const { categories, products } = await this.fetchCurrentSmaregiState();

      await this.termsRequest('PUT', { id: termId, categories, products });

      Utils.showSuccess(`ターム「${term.name}」を上書きしました。`);
      await this.loadTerms();
    } catch (error) {
      Utils.showError('上書きに失敗しました。' + error.message);
    } finally {
      Utils.showLoading(false);
    }
  }

  // 削除
  async onDeleteTerm(termId) {
    const term = this.terms.find(t => t.id === termId);
    if (!term) return;

    const confirmed = confirm(`ターム「${term.name}」を削除します。よろしいですか？`);
    if (!confirmed) return;

    try {
      Utils.showLoading(true);
      await this.termsRequest('DELETE', null, `?id=${termId}`);
      Utils.showSuccess(`ターム「${term.name}」を削除しました。`);
      await this.loadTerms();
    } catch (error) {
      Utils.showError('削除に失敗しました。' + error.message);
    } finally {
      Utils.showLoading(false);
    }
  }

  // スマレジから現在の部門・商品の表示状態を取得
  async fetchCurrentSmaregiState() {
    const [categories, products] = await Promise.all([
      this.api.getCategories({ sort: 'displaySequence', limit: 150 }),
      this.api.getProducts({ sort: 'displaySequence', limit: 150 })
    ]);

    const normalizedCategories = (categories || []).map(c => ({
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      displayFlag: String(c.displayFlag ?? '1')
    }));

    const normalizedProducts = (products || []).map(p => ({
      productId: p.productId,
      productName: p.productName,
      categoryId: p.categoryId,
      displayFlag: String(p.displayFlag ?? '1')
    }));

    return { categories: normalizedCategories, products: normalizedProducts };
  }

  // Terms API への共通リクエスト（SmaregiAPI.request() を流用）
  async termsRequest(method, body = null, queryString = '') {
    const url = `${CONFIG.API_ENDPOINTS.TERMS}${queryString}`;
    return await this.api.request(url, method, body);
  }

  openCreateModal() {
    const nameInput = document.getElementById('new-term-name');
    if (nameInput) nameInput.value = '';
    document.getElementById('create-modal')?.classList.remove('hidden');
    nameInput?.focus();
  }

  closeCreateModal() {
    document.getElementById('create-modal')?.classList.add('hidden');
  }

  setupEventListeners() {
    // 新規作成ボタン
    document.getElementById('new-term-button')?.addEventListener('click', () => {
      this.openCreateModal();
    });

    // 保存ボタン
    document.getElementById('save-current-state-button')?.addEventListener('click', () => {
      this.onSaveCurrentState();
    });

    // Enterキーで保存
    document.getElementById('new-term-name')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.onSaveCurrentState();
    });

    // キャンセルボタン
    document.getElementById('cancel-create-button')?.addEventListener('click', () => {
      this.closeCreateModal();
    });

    // 参照モーダルを閉じる
    document.getElementById('close-view-modal')?.addEventListener('click', () => {
      document.getElementById('view-modal')?.classList.add('hidden');
    });

    // テーブル操作ボタン（イベント委譲）
    document.getElementById('terms-tbody')?.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-action]');
      if (!button) return;

      const action = button.dataset.action;
      const id = button.dataset.id;

      if (action === 'view') this.onViewTerm(id);
      if (action === 'apply') this.onApplyTerm(id);
      if (action === 'overwrite') this.onOverwriteTerm(id);
      if (action === 'delete') this.onDeleteTerm(id);
    });

    // ログアウト
    document.getElementById('logout-button')?.addEventListener('click', () => {
      Auth.logout();
    });

    // モーダル外クリックで閉じる
    document.getElementById('create-modal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.closeCreateModal();
    });

    document.getElementById('view-modal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        document.getElementById('view-modal').classList.add('hidden');
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const page = new TermsPage();
  page.init();
});
