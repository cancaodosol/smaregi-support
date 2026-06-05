const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Access-Token, X-Contract-Id, X-Environment',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const accessToken = event.headers['x-access-token'];
    const contractId = event.headers['x-contract-id'];

    if (!accessToken || !contractId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, error: '認証情報が不足しています。' })
      };
    }

    const store = getStore('terms');
    const blobKey = `terms-${contractId}`;

    const stored = await store.get(blobKey, { type: 'json' });
    let terms = stored?.terms || [];

    if (event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ terms })
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const newTerm = {
        id: Date.now().toString(),
        name: body.name,
        categories: body.categories || [],
        products: body.products || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      terms.push(newTerm);
      await store.set(blobKey, JSON.stringify({ terms }));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, term: newTerm })
      };
    }

    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body);
      const idx = terms.findIndex(t => t.id === body.id);
      if (idx === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, error: 'タームが見つかりません。' })
        };
      }
      terms[idx] = {
        ...terms[idx],
        ...(body.name !== undefined ? { name: body.name } : {}),
        categories: body.categories,
        products: body.products,
        updatedAt: new Date().toISOString()
      };
      await store.set(blobKey, JSON.stringify({ terms }));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, term: terms[idx] })
      };
    }

    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id;
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'IDが指定されていません。' })
        };
      }
      terms = terms.filter(t => t.id !== id);
      await store.set(blobKey, JSON.stringify({ terms }));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
    };

  } catch (error) {
    console.error('Terms function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'サーバーエラーが発生しました。', message: error.message })
    };
  }
};
