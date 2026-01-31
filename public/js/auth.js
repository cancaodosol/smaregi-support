// 認証管理クラス
class Auth {
  /**
   * ログイン（アクセストークン取得）
   * @param {string} contractId 契約ID
   * @param {string} clientId クライアントID
   * @param {string} clientSecret クライアントシークレット
   * @param {string} environment 環境（dev or prod）
   * @returns {Promise<Object>} { success, token, expiresIn, error }
   */
  static async login(contractId, clientId, clientSecret, environment) {
    try {
      const response = await fetch(CONFIG.API_ENDPOINTS.AUTH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contractId,
          clientId,
          clientSecret,
          environment
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || CONFIG.MESSAGES.AUTH_FAILED
        };
      }

      // 認証情報とトークンを保存
      this.saveCredentials(contractId, clientId, clientSecret, environment);
      this.saveToken(data.access_token, data.expires_in);

      return {
        success: true,
        token: data.access_token,
        expiresIn: data.expires_in
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: CONFIG.MESSAGES.API_ERROR
      };
    }
  }

  /**
   * 認証情報を保存
   * @param {string} contractId 契約ID
   * @param {string} clientId クライアントID
   * @param {string} clientSecret クライアントシークレット
   * @param {string} environment 環境
   */
  static saveCredentials(contractId, clientId, clientSecret, environment) {
    Storage.set(CONFIG.STORAGE_KEYS.CONTRACT_ID, contractId);
    Storage.set(CONFIG.STORAGE_KEYS.CLIENT_ID, clientId);
    Storage.set(CONFIG.STORAGE_KEYS.CLIENT_SECRET, clientSecret);
    Storage.set(CONFIG.STORAGE_KEYS.ENVIRONMENT, environment);
  }

  /**
   * トークンを保存
   * @param {string} token アクセストークン
   * @param {number} expiresIn 有効期限（秒）
   */
  static saveToken(token, expiresIn) {
    const expiresAt = Date.now() + (expiresIn * 1000);
    Storage.set(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, token);
    Storage.set(CONFIG.STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt);
  }

  /**
   * トークンを取得
   * @returns {string|null} アクセストークン
   */
  static getToken() {
    return Storage.get(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * トークンの有効期限をチェック
   * @returns {boolean} 有効な場合true
   */
  static isTokenValid() {
    const token = this.getToken();
    if (!token) return false;

    const expiresAt = Storage.get(CONFIG.STORAGE_KEYS.TOKEN_EXPIRES_AT);
    if (!expiresAt) return false;

    // 有効期限の5分前にfalseを返す（余裕を持って再認証）
    const now = Date.now();
    const buffer = 5 * 60 * 1000; // 5分
    return now < (expiresAt - buffer);
  }

  /**
   * 認証情報を取得
   * @returns {Object} { contractId, clientId, clientSecret, environment }
   */
  static getCredentials() {
    return {
      contractId: Storage.get(CONFIG.STORAGE_KEYS.CONTRACT_ID),
      clientId: Storage.get(CONFIG.STORAGE_KEYS.CLIENT_ID),
      clientSecret: Storage.get(CONFIG.STORAGE_KEYS.CLIENT_SECRET),
      environment: Storage.get(CONFIG.STORAGE_KEYS.ENVIRONMENT)
    };
  }

  /**
   * ログイン状態をチェック
   * @returns {boolean} ログイン済みの場合true
   */
  static isLoggedIn() {
    const credentials = this.getCredentials();
    return !!(credentials.contractId && credentials.clientId && credentials.clientSecret && this.isTokenValid());
  }

  /**
   * トークンを再取得
   * @returns {Promise<boolean>} 成功した場合true
   */
  static async refreshToken() {
    const credentials = this.getCredentials();
    if (!credentials.contractId || !credentials.clientId || !credentials.clientSecret) {
      return false;
    }

    const result = await this.login(
      credentials.contractId,
      credentials.clientId,
      credentials.clientSecret,
      credentials.environment
    );

    return result.success;
  }

  /**
   * ログアウト
   */
  static logout() {
    Storage.clearSmaregiData();
    Utils.navigate('/pages/login.html');
  }

  /**
   * ログインページへリダイレクト（ログインしていない場合）
   */
  static requireLogin() {
    if (!this.isLoggedIn()) {
      Utils.navigate('/pages/login.html');
      return false;
    }
    return true;
  }
}
