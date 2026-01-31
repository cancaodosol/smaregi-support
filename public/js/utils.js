// ユーティリティ関数
const Utils = {
  /**
   * エラーメッセージを表示
   * @param {string} message メッセージ
   * @param {string} elementId 表示先の要素ID
   */
  showError(message, elementId = 'error-message') {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = message;
      element.classList.remove('hidden');
      element.classList.add('block', 'bg-red-100', 'border', 'border-red-400', 'text-red-700', 'px-4', 'py-3', 'rounded', 'mb-4');
    } else {
      alert(message);
    }
  },

  /**
   * 成功メッセージを表示
   * @param {string} message メッセージ
   * @param {string} elementId 表示先の要素ID
   */
  showSuccess(message, elementId = 'success-message') {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = message;
      element.classList.remove('hidden');
      element.classList.add('block', 'bg-green-100', 'border', 'border-green-400', 'text-green-700', 'px-4', 'py-3', 'rounded', 'mb-4');

      // 3秒後に自動で非表示
      setTimeout(() => {
        element.classList.add('hidden');
      }, 3000);
    }
  },

  /**
   * メッセージを非表示
   * @param {string} elementId 非表示にする要素ID
   */
  hideMessage(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.add('hidden');
    }
  },

  /**
   * ローディング表示
   * @param {boolean} show 表示/非表示
   * @param {string} elementId ローディング表示する要素ID
   */
  showLoading(show, elementId = 'loading') {
    const element = document.getElementById(elementId);
    if (element) {
      if (show) {
        element.classList.remove('hidden');
      } else {
        element.classList.add('hidden');
      }
    }
  },

  /**
   * ボタンを無効化/有効化
   * @param {string} buttonId ボタンの要素ID
   * @param {boolean} disabled 無効化する場合true
   * @param {string} text ボタンのテキスト（省略可）
   */
  setButtonDisabled(buttonId, disabled, text = null) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.disabled = disabled;
      if (disabled) {
        button.classList.add('opacity-50', 'cursor-not-allowed');
      } else {
        button.classList.remove('opacity-50', 'cursor-not-allowed');
      }
      if (text) {
        button.textContent = text;
      }
    }
  },

  /**
   * 日付をフォーマット
   * @param {Date|string|number} date 日付
   * @param {string} format フォーマット（デフォルト: 'YYYY-MM-DD HH:mm:ss'）
   * @returns {string} フォーマット済み日付文字列
   */
  formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },

  /**
   * 数値をカンマ区切りにフォーマット
   * @param {number} num 数値
   * @returns {string} カンマ区切りの文字列
   */
  formatNumber(num) {
    if (num === null || num === undefined) return '';
    return Number(num).toLocaleString('ja-JP');
  },

  /**
   * HTMLエスケープ（XSS対策）
   * @param {string} str 文字列
   * @returns {string} エスケープされた文字列
   */
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * クエリパラメータを取得
   * @param {string} name パラメータ名
   * @returns {string|null} パラメータ値
   */
  getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  },

  /**
   * ページ遷移
   * @param {string} url 遷移先URL
   */
  navigate(url) {
    window.location.href = url;
  },

  /**
   * 配列をフィルタリング（検索）
   * @param {Array} array 配列
   * @param {string} searchText 検索テキスト
   * @param {Array<string>} fields 検索対象のフィールド名
   * @returns {Array} フィルタリングされた配列
   */
  filterArray(array, searchText, fields) {
    if (!searchText) return array;

    const lowerSearchText = searchText.toLowerCase();
    return array.filter(item => {
      return fields.some(field => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lowerSearchText);
      });
    });
  },

  /**
   * ディープコピー
   * @param {*} obj オブジェクト
   * @returns {*} コピーされたオブジェクト
   */
  deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
};
