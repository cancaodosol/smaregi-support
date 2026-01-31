
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
POST https://id.smaregi.jp/app/sfj222x3/token
Authorization: Basic {{ mainBasic }}
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=pos.customers:read pos.transactions:read pos.products:read pos.products:write pos.customers:write
```

@mainToken = {{ mainLogin.response.body.$.access_token }}

## 商品情報の取得

```http
GET https://api.smaregi.jp/sfj222x3/pos/products?fields=categoryId,productId,productName,displayFlag&category_id=9
Authorization: Bearer {{ mainToken }}
```

## グループ情報の取得

```http
GET https://api.smaregi.jp/sfj222x3/pos/categories
Authorization: Bearer {{ mainToken }}
```

## 商品情報の更新

```http
PATCH https://api.smaregi.jp/sfj222x3/pos/products/bulk
Authorization: Bearer {{ mainToken }}
Content-Type: application/json

{
    "products": [
        {
            "categoryId": "9",
            "productId": "106",
            "productName": "こしあんぱん",
            "displayFlag": "0"
        },
        {
            "categoryId": "9",
            "productId": "70",
            "productName": "米粉クリームパン",
            "displayFlag": "0"
        },
        {
            "categoryId": "9",
            "productId": "72",
            "productName": "米粉カレーパン",
            "displayFlag": "0"
        },
        {
            "categoryId": "9",
            "productId": "79",
            "productName": "米粉つぶあんぱん",
            "displayFlag": "0"
        }
    ],
    "callbackUrl": "https://localhost/pospos"
}
```