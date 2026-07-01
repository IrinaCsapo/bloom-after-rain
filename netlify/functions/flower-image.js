/**
 * flower-image — serves permanently stored flower images from Netlify Blobs.
 * URL: /.netlify/functions/flower-image?id=<12-char id>
 */

import { getStore } from '@netlify/blobs';

export default async function handler(req) {
  const url = new URL(req.url, 'https://bloom.irina.love');
  const id  = url.searchParams.get('id') || '';

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  try {
    const store      = getStore('flower-images');
    const { data, metadata } = await store.getWithMetadata(id, { type: 'arrayBuffer' });

    if (!data) {
      return new Response('Not found', { status: 404 });
    }

    const contentType = metadata?.contentType || 'image/webp';

    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });

  } catch (err) {
    console.error('flower-image error:', err);
    return new Response('Error retrieving image', { status: 500 });
  }
}
