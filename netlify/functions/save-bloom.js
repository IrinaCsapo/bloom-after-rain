/**
 * save-bloom — stores bloom data in Netlify Blobs, returns a short ID.
 * Share URL becomes: bloom.irina.love/share?id=abc12345 (clean & short)
 */

import { getStore } from '@netlify/blobs';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch (_) {
    return new Response(JSON.stringify({ error: 'Invalid body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { flower_name, flower_meaning, image_url, letter_title } = body;

  // Short random ID — 8 hex chars is plenty
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 8);

  try {
    const store = getStore('blooms');
    await store.setJSON(id, {
      flower_name:    flower_name    || '',
      flower_meaning: flower_meaning || '',
      image_url:      image_url      || '',
      letter_title:   letter_title   || ''
    }, { ttl: 60 * 60 * 24 * 90 }); // keep for 90 days

    return new Response(JSON.stringify({ id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  } catch (err) {
    console.error('save-bloom error:', err);
    return new Response(JSON.stringify({ error: 'Failed to save', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
