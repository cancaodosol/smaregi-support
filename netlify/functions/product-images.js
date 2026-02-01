const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // CORSヘッダー
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Access-Token, X-Contract-Id, X-Environment',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONSリクエスト(プリフライト)対応
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // ヘッダーからトークンと設定を取得
    const accessToken = event.headers['x-access-token'];
    const contractId = event.headers['x-contract-id'];
    const environment = event.headers['x-environment'];

    // バリデーション
    if (!accessToken || !contractId || !environment) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          error: '認証情報が不足しています。'
        })
      };
    }

    // GETメソッドのみ許可
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Method Not Allowed'
        })
      };
    }

    // スマレジAPIのベースURL
    const apiBase = environment === 'dev'
      ? `https://api.smaregi.dev/${contractId}`
      : `https://api.smaregi.jp/${contractId}`;

    // クエリパラメータを構築
    const queryString = event.queryStringParameters
      ? '?' + new URLSearchParams(event.queryStringParameters).toString()
      : '';

    // スマレジAPIにリクエスト
    const apiUrl = `${apiBase}/pos/products/images${queryString}`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          success: false,
          error: data.detail || data.title || 'APIエラーが発生しました。',
          data
        })
      };
    }

    // 成功レスポンス
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Product images function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'サーバーエラーが発生しました。',
        message: error.message
      })
    };
  }
};
