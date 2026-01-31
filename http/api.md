
# スマレジAPI

## アクセストークンの取得

```http
# @name devLogin
POST https://id.smaregi.dev/app/sb_skx467b2/token
Authorization: Basic {{ devBasic }}
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=pos.products:read pos.products:write
```

@devToken = {{ devLogin.response.body.$.access_token }}

| キー | 値の説明 |
| :--- | :--- |
| `scope`      | アクセストークンで有効なスコープリスト |
| `token_type` | `Bearer` |
| `expores_in` | アクセストークンの有効期間(秒)<br> *アクセストークン発行時の有効期間は変更になる可能性があります。|
| `access_token` | アクセストークン |
|||

## ------------------------------------------------------------------ ##

まずは、商品情報について。

## 商品情報の取得

```http
GET https://api.smaregi.jp/sup972h3/pos/products
Authorization: Bearer {{ mainToken }}
```

## アクセストークンの取得（本番）

```http
# @name mainLogin
POST https://id.smaregi.jp/app/sup972h3/token
Authorization: Basic {{ mainBasic }}
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=pos.customers:read pos.transactions:read pos.products:read pos.products:write pos.customers:write
```

@mainToken = {{ mainLogin.response.body.$.access_token }}

## 商品情報の取得

```http
GET https://api.smaregi.jp/sup972h3/pos/products?fields=productId,productName,displayFlag
Authorization: Bearer {{ mainToken }}
```

## グループ情報の取得

```http
GET https://api.smaregi.jp/sup972h3/pos/categories
Authorization: Bearer {{ mainToken }}
```

## 商品情報の更新

```http
PATCH https://api.smaregi.jp/sup972h3/pos/products/bulk
Authorization: Bearer {{ mainToken }}
Content-Type: application/json

{
    "products": [
        {
            "productId": "9",
            "productName": "ViVANI(ヴィヴァーニ)　ダークチョコレート オレンジ",
            "displayFlag": "1"
        },
        {
            "productId": "10",
            "productName": "ViVANI(ヴィヴァーニ)　エーデルビター クランベリー",
            "displayFlag": "1"
        },
        {
            "productId": "6",
            "productName": "ゆにわの生はちみつ とち（小）200g（ピッチャー）",
            "displayFlag": "1"
        },
        {
            "productId": "7",
            "productName": "地球家族　マカ 200g",
            "displayFlag": "1"
        },
        {
            "productId": "4",
            "productName": "【コーヒー豆】最澄ブレンド",
            "displayFlag": "1"
        },
        {
            "productId": "2",
            "productName": "【コーヒー豆】最澄ブレンド",
            "displayFlag": "1"
        },
        {
            "productId": "5",
            "productName": "【コーヒー豆】最澄ブレンド",
            "displayFlag": "1"
        },
        {
            "productId": "3",
            "productName": "【コーヒー豆】最澄ブレンド",
            "displayFlag": "1"
        },
        {
            "productId": "8",
            "productName": "ハーブ紅茶　聖バジル紅茶（15g）",
            "displayFlag": "1"
        },
        {
            "productId": "1",
            "productName": "ゆにわの寝具　織温-orion-「ハーフケット」1",
            "displayFlag": "1"
        }
    ],
    "callbackUrl": "https://localhost/pospos"
}
```