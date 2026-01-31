// スマレジAPI通信クラス
class SmaregiAPI {
  constructor() {
    this.accessToken = Auth.getToken();
    const credentials = Auth.getCredentials();
    this.contractId = credentials.contractId;
    this.environment = credentials.environment;
  }

  /**
   * 商品一覧を取得
   * @param {Object} params クエリパラメータ
   * @returns {Promise<Array>} 商品一覧
   */
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${CONFIG.API_ENDPOINTS.PRODUCTS}${queryString ? '?' + queryString : ''}`;

    const response = await this.request(url, 'GET');
    return response;
  }

  /**
   * 商品を一括更新
   * @param {Array} products 商品リスト
   * @returns {Promise<Object>} レスポンス
   */
  async updateProducts(products) {
    const response = await this.request(CONFIG.API_ENDPOINTS.PRODUCTS, 'PATCH', {
      products
    });
    return response;
  }

  /**
   * 部門（カテゴリ）一覧を取得
   * @param {Object} params クエリパラメータ
   * @returns {Promise<Array>} 部門一覧
   */
  async getCategories(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${CONFIG.API_ENDPOINTS.CATEGORIES}${queryString ? '?' + queryString : ''}`;

    const response = await this.request(url, 'GET');
    return response;
  }

  /**
   * 部門を一括更新
   * @param {Array} categories 部門リスト
   * @returns {Promise<Object>} レスポンス
   */
  async updateCategories(categories) {
    const response = await this.request(CONFIG.API_ENDPOINTS.CATEGORIES, 'PATCH', {
      categories
    });
    return response;
  }

  /**
   * 共通リクエスト処理
   * @param {string} url URL
   * @param {string} method HTTPメソッド
   * @param {Object} body リクエストボディ
   * @returns {Promise<Object>} レスポンスデータ
   */
  async request(url, method = 'GET', body = null) {
    // トークンの有効期限チェック
    if (!Auth.isTokenValid()) {
      // トークンを再取得
      const refreshed = await Auth.refreshToken();
      if (!refreshed) {
        Utils.showError(CONFIG.MESSAGES.TOKEN_EXPIRED);
        Auth.logout();
        throw new Error('Token expired');
      }
      // 再取得したトークンを設定
      this.accessToken = Auth.getToken();
    }

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Token': this.accessToken,
        'X-Contract-Id': this.contractId,
        'X-Environment': this.environment
      }
    };

    if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        // 401エラー（認証エラー）の場合
        if (response.status === 401) {
          Utils.showError(CONFIG.MESSAGES.TOKEN_EXPIRED);
          Auth.logout();
          throw new Error('Unauthorized');
        }

        throw new Error(data.error || data.message || CONFIG.MESSAGES.API_ERROR);
      }

      return data;

    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }
}
