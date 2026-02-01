// アプリケーション設定・定数定義
const CONFIG = {
  // LocalStorageキー
  STORAGE_KEYS: {
    CONTRACT_ID: 'smaregi_contract_id',
    CLIENT_ID: 'smaregi_client_id',
    CLIENT_SECRET: 'smaregi_client_secret',
    ENVIRONMENT: 'smaregi_environment',
    ACCESS_TOKEN: 'smaregi_access_token',
    TOKEN_EXPIRES_AT: 'smaregi_token_expires_at'
  },

  // 環境設定
  ENVIRONMENTS: {
    DEV: 'dev',
    PROD: 'prod'
  },

  // APIエンドポイント（Netlify Functions）
  API_ENDPOINTS: {
    AUTH: '/.netlify/functions/auth',
    PRODUCTS: '/.netlify/functions/products',
    PRODUCT_IMAGES: '/.netlify/functions/product-images',
    CATEGORIES: '/.netlify/functions/categories'
  },

  // スマレジAPI URL
  SMAREGI_API: {
    DEV: {
      ID_BASE: 'https://id.smaregi.dev/app',
      API_BASE: 'https://api.smaregi.dev'
    },
    PROD: {
      ID_BASE: 'https://id.smaregi.jp/app',
      API_BASE: 'https://api.smaregi.jp'
    }
  },

  // APIスコープ
  API_SCOPE: 'pos.products:read pos.products:write pos.categories:read pos.categories:write',

  // UI設定
  UI: {
    CHANGED_ROW_CLASS: 'bg-yellow-100',
    LOADING_CLASS: 'opacity-50 pointer-events-none'
  },

  // メッセージ
  MESSAGES: {
    AUTH_FAILED: '認証に失敗しました。契約ID、クライアントID、クライアントシークレットを確認してください。',
    TOKEN_EXPIRED: 'セッションが切れました。再度ログインしてください。',
    API_ERROR: 'スマレジAPIとの通信に失敗しました。しばらくしてから再度お試しください。',
    UPDATE_SUCCESS: '更新が完了しました。',
    UPDATE_FAILED: '更新に失敗しました。',
    NO_CHANGES: '変更がありません。',
    LOADING: '読み込み中...',
    UPDATING: '更新中...'
  }
};
