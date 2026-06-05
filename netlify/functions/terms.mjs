import { getStore } from '@netlify/blobs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Access-Token, X-Contract-Id, X-Environment',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: corsHeaders });

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: corsHeaders });
  }

  try {
    const accessToken = request.headers.get('x-access-token');
    const contractId = request.headers.get('x-contract-id');

    if (!accessToken || !contractId) {
      return json({ success: false, error: '認証情報が不足しています。' }, 401);
    }

    const store = getStore('terms');
    const blobKey = `terms-${contractId}`;

    const stored = await store.get(blobKey, { type: 'json' });
    let terms = stored?.terms || [];

    if (request.method === 'GET') {
      return json({ terms });
    }

    if (request.method === 'POST') {
      const body = await request.json();
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
      return json({ success: true, term: newTerm });
    }

    if (request.method === 'PUT') {
      const body = await request.json();
      const idx = terms.findIndex(t => t.id === body.id);
      if (idx === -1) {
        return json({ success: false, error: 'タームが見つかりません。' }, 404);
      }
      terms[idx] = {
        ...terms[idx],
        ...(body.name !== undefined ? { name: body.name } : {}),
        categories: body.categories,
        products: body.products,
        updatedAt: new Date().toISOString()
      };
      await store.set(blobKey, JSON.stringify({ terms }));
      return json({ success: true, term: terms[idx] });
    }

    if (request.method === 'DELETE') {
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      if (!id) {
        return json({ success: false, error: 'IDが指定されていません。' }, 400);
      }
      terms = terms.filter(t => t.id !== id);
      await store.set(blobKey, JSON.stringify({ terms }));
      return json({ success: true });
    }

    return json({ success: false, error: 'Method Not Allowed' }, 405);

  } catch (error) {
    console.error('Terms function error:', error);
    return json({ success: false, error: 'サーバーエラーが発生しました。', message: error.message }, 500);
  }
};
