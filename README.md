# スマレジサポート - 商品・部門 端末表示切替アプリ

スマレジAPIを使用して、商品および部門の端末表示・非表示を簡単に切り替えられるWebアプリケーションです。

## 機能

- **商品一覧表示**: 部門ごとに商品を一覧表示し、端末表示のオン・オフを簡単に切り替え
- **部門一覧表示**: 部門の端末表示設定を一覧で確認し、一括で変更
- **検索機能**: 商品名やコードで素早く検索
- **一括更新**: 変更した内容を一括でスマレジに反映

## 技術スタック

- **フロントエンド**: HTML5, CSS3 (TailwindCSS), JavaScript (ES6+)
- **バックエンド**: Netlify Functions (サーバーレス関数)
- **ホスティング**: Netlify
- **API**: スマレジ Platform API

## セットアップ

### 1. 必要なもの

- Node.js (v14以上)
- スマレジの契約ID、クライアントID、クライアントシークレット

### 2. インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd sumaregi-support

# 依存パッケージをインストール
npm install
```

### 3. ローカルで開発

```bash
# Netlify CLIをグローバルインストール（初回のみ）
npm install -g netlify-cli

# ローカルサーバーを起動
npm run dev

# ブラウザで http://localhost:8888 にアクセス
```

### 4. デプロイ

#### Netlifyへのデプロイ

1. [Netlify](https://www.netlify.com/)にログイン
2. 「New site from Git」をクリック
3. GitHubリポジトリを連携
4. ビルド設定:
   - Build command: （空欄）
   - Publish directory: `public`
5. 「Deploy site」をクリック

または、Netlify CLIを使用:

```bash
# Netlifyにログイン
netlify login

# デプロイ
npm run deploy
```

## 使い方

### 1. ログイン

1. アプリにアクセス
2. 契約ID、クライアントID、クライアントシークレットを入力
3. 環境（サンドボックス/本番）を選択
4. 「接続テスト」ボタンをクリック

### 2. 商品の端末表示を変更

1. 商品一覧画面で部門タブを選択
2. 変更したい商品のチェックボックスをオン・オフ
3. 「反映」ボタンをクリック
4. 確認ダイアログで「OK」をクリック

### 3. 部門の端末表示を変更

1. ヘッダーから「部門一覧」をクリック
2. 変更したい部門のチェックボックスをオン・オフ
3. 「反映」ボタンをクリック
4. 確認ダイアログで「OK」をクリック

## ディレクトリ構成

```
sumaregi-support/
├── public/                      # 静的ファイル（公開ディレクトリ）
│   ├── index.html              # ランディングページ
│   ├── pages/
│   │   ├── login.html          # API接続設定画面
│   │   ├── products.html       # 商品一覧画面
│   │   └── categories.html     # 部門一覧画面
│   ├── css/                    # カスタムスタイル
│   └── js/
│       ├── config.js           # 設定・定数定義
│       ├── api.js              # API通信クラス
│       ├── auth.js             # 認証管理
│       ├── storage.js          # LocalStorage管理
│       ├── utils.js            # ユーティリティ関数
│       ├── products-page.js    # 商品一覧ページロジック
│       └── categories-page.js  # 部門一覧ページロジック
├── netlify/
│   └── functions/              # Netlify Functions
│       ├── auth.js             # 認証トークン取得API
│       ├── products.js         # 商品APIプロキシ
│       └── categories.js       # 部門APIプロキシ
├── task/                       # タスク管理ファイル
├── http/                       # API仕様書
├── netlify.toml                # Netlify設定ファイル
├── package.json                # Node.js依存関係
└── README.md                   # このファイル
```

## セキュリティについて

- 認証情報（クライアントIDとクライアントシークレット）はブラウザのLocalStorageに保存されます
- すべての通信はHTTPSで行われます
- Netlify Functionsを使用してCORS問題を解決しています

## トラブルシューティング

### 認証エラーが発生する

- 契約ID、クライアントID、クライアントシークレットが正しいか確認してください
- 環境（サンドボックス/本番）の選択が正しいか確認してください

### 商品が表示されない

- ブラウザのコンソールでエラーを確認してください
- 再度ログインしてみてください

### デプロイ後に動作しない

- Netlifyの設定で「Publish directory」が`public`になっているか確認してください
- Netlify Functionsが正しくデプロイされているか確認してください

## ライセンス

MIT

## 参考資料

- [スマレジAPI公式ドキュメント](https://developers.smaregi.dev/platform-api-reference/apis/pos/)
- [Netlify Functions公式ドキュメント](https://docs.netlify.com/functions/overview/)
- [TailwindCSS公式ドキュメント](https://tailwindcss.com/docs)
