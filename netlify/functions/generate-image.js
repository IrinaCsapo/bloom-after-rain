/**
 * generate-image — FLUX Schnell via Replicate, image proxied to Netlify Blobs.
 * Replicate output URLs expire in ~1h. We fetch the bytes immediately and store
 * them permanently in Netlify Blobs, returning a stable /flower-image?id=... URL.
 */

import { getStore } from '@netlify/blobs';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    return new Response(JSON.stringify({ error: 'Replicate API token not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch (_) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { flower_name, flower_color, image_prompt } = body;
  const base   = image_prompt || buildPrompt(flower_name, flower_color);
  const prompt = `${base}, ${STYLE_SUFFIX}`;

  try {
    // 1. Generate via Replicate FLUX Schnell
    const res = await fetch(
      'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait'
        },
        body: JSON.stringify({
          input: {
            prompt,
            num_outputs: 1,
            aspect_ratio: '1:1',
            output_format: 'webp',
            output_quality: 90,
            num_inference_steps: 4
          }
        })
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Replicate error: ${res.status} ${err}`);
    }

    const prediction = await res.json();
    const replicateUrl = prediction.output?.[0];
    if (!replicateUrl) throw new Error('No output from Replicate');

    // 2. Fetch image bytes from Replicate (URL expires in ~1h)
    const imgRes = await fetch(replicateUrl);
    if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);
    const imgBytes = await imgRes.arrayBuffer();

    // 3. Store permanently in Netlify Blobs
    const id    = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const store = getStore('flower-images');
    await store.set(id, imgBytes, { metadata: { contentType: 'image/webp' } });

    // 4. Return stable URL via our serve function
    const url = `/.netlify/functions/flower-image?id=${id}`;

    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });

  } catch (err) {
    console.error('generate-image error:', err);
    return new Response(JSON.stringify({ error: 'Image generation failed', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Locked aesthetic — appended to every prompt so the look is always consistent
const STYLE_SUFFIX = [
  'extreme soft focus, painterly blur, impressionistic macro photography,',
  'soft periwinkle-lavender blue background, uniform and pale,',
  'pastel color palette, high key light, gentle luminous glow,',
  'through-glass diffusion effect, no sharp edges anywhere,',
  'single stem centered, flower dissolving into soft light,',
  'analog film grain, tender emotional quality, dreamlike and abstract,',
  'photographic, not illustration'
].join(' ');

function buildPrompt(flowerName, flowerColor) {
  return [
    `a single ${flowerName || 'flower'}`,
    flowerColor ? `with ${flowerColor}` : '',
    `on a soft pale periwinkle-blue background`
  ].filter(Boolean).join(' ');
}
