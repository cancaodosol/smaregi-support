const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // デバッグログ
  console.log('Auth function called');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Request body:', event.body);

  // CORSヘッダー
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONSリクエスト（プリフライト）対応
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // POSTメソッドのみ許可
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Method Not Allowed'
      })
    };
  }

  try {
    // リクエストボディをパース
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'リクエストボディのパースに失敗しました: ' + parseError.message
        })
      };
    }

    const { contractId, clientId, clientSecret, environment } = body;

    // バリデーション
    if (!contractId || !clientId || !clientSecret || !environment) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: '契約ID、クライアントID、クライアントシークレット、環境を入力してください。',
          received: {
            contractId: !!contractId,
            clientId: !!clientId,
            clientSecret: !!clientSecret,
            environment: !!environment
          }
        })
      };
    }

    if (environment !== 'dev' && environment !== 'prod') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: '環境は dev または prod を指定してください。'
        })
      };
    }

    // スマレジAPIのトークンエンドポイント
    const tokenUrl = environment === 'dev'
      ? `https://id.smaregi.dev/app/${contractId}/token`
      : `https://id.smaregi.jp/app/${contractId}/token`;

    // Basic認証のエンコード
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    // スマレジAPIにトークン取得リクエスト
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials&scope=pos.products:read pos.products:write pos.categories:read pos.categories:write'
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          success: false,
          error: data.error_description || data.error || '認証に失敗しました。'
        })
      };
    }

    // 成功レスポンス
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        access_token: data.access_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
        scope: data.scope
      })
    };

  } catch (error) {
    console.error('Auth function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'サーバーエラーが発生しました。',
        details: error.message
      })
    };
  }
};
