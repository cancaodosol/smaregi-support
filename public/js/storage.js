// LocalStorage管理クラス
class Storage {
  /**
   * データを保存
   * @param {string} key キー
   * @param {*} value 値（オブジェクトは自動的にJSON化）
   */
  static set(key, value) {
    try {
      const stringValue = typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);
      localStorage.setItem(key, stringValue);
    } catch (error) {
      console.error('LocalStorage save error:', error);
    }
  }

  /**
   * データを取得
   * @param {string} key キー
   * @param {*} defaultValue デフォルト値
   * @returns {*} 取得した値
   */
  static get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue;

      // JSON形式の場合はパース
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return defaultValue;
    }
  }

  /**
   * データを削除
   * @param {string} key キー
   */
  static remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('LocalStorage remove error:', error);
    }
  }

  /**
   * 全データをクリア
   */
  static clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('LocalStorage clear error:', error);
    }
  }

  /**
   * スマレジ関連のデータのみをクリア
   */
  static clearSmaregiData() {
    const keys = Object.values(CONFIG.STORAGE_KEYS);
    keys.forEach(key => this.remove(key));
  }
}
