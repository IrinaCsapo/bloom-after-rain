/**
 * share — serves a beautiful OG-tagged page for shared blooms.
 * URL: /share?id=<8-char id>
 * Reads bloom data from Netlify Blobs — clean short URL, full OG preview.
 */

import { getStore } from '@netlify/blobs';

export default async function handler(req) {
  const url = new URL(req.url, 'https://bloom.irina.love');
  const id  = url.searchParams.get('id') || '';

  let flower_name    = 'A Bloom';
  let flower_meaning = '';
  let image_url      = '';
  let letter_title   = '';

  if (id) {
    try {
      const store = getStore('blooms');
      const data  = await store.get(id, { type: 'json' });
      if (data) {
        flower_name    = data.flower_name    || flower_name;
        flower_meaning = data.flower_meaning || '';
        image_url      = data.image_url      || '';
        letter_title   = data.letter_title   || '';
      }
    } catch (err) {
      console.error('share: blob read error', err);
    }
  }

  // 2 sentences max for OG description
  const shortMeaning = flower_meaning
    .split(/\.\s+/)
    .slice(0, 2)
    .join('. ')
    .trim()
    .replace(/\.?$/, '.');

  const ogDesc = shortMeaning
    ? `${shortMeaning} Bloom yours at bloom.irina.love`
    : 'Something tender is growing. Where grief becomes a flower. Bloom yours at bloom.irina.love';

  const esc = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(flower_name)} — Bloom after Rain</title>

  <!-- Open Graph -->
  <meta property="og:type"        content="website" />
  <meta property="og:url"         content="${esc(url.href)}" />
  <meta property="og:title"       content="${esc(flower_name)} — Bloom after Rain" />
  <meta property="og:description" content="${esc(ogDesc)}" />
  ${image_url ? `<meta property="og:image"        content="${esc(image_url)}" />
  <meta property="og:image:width"  content="1024" />
  <meta property="og:image:height" content="1024" />` : `<meta property="og:image" content="https://bloom.irina.love/assets/og-image.jpg" />`}

  <!-- Twitter / X -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${esc(flower_name)} — Bloom after Rain" />
  <meta name="twitter:description" content="${esc(ogDesc)}" />
  <meta name="twitter:image"       content="${image_url ? esc(image_url) : 'https://bloom.irina.love/assets/og-image.jpg'}" />

  <meta name="theme-color" content="#0B0A10" />

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,300&display=swap');

    body {
      min-height: 100dvh;
      background: #0B0A10;
      color: #fff;
      font-family: 'Fraunces', Georgia, serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1.5rem;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .bg {
      position: fixed;
      inset: 0;
      ${image_url
        ? `background: url('${image_url.replace(/'/g, "\\'")}') center/cover no-repeat;`
        : `background: url('https://bloom.irina.love/assets/hero-bg.webp') center/cover no-repeat;`}
      filter: blur(48px) brightness(0.3) saturate(1.4);
      transform: scale(1.15);
      z-index: 0;
    }

    .card {
      position: relative;
      z-index: 1;
      max-width: 440px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }

    .flower-image {
      width: 200px;
      height: 200px;
      border-radius: 50%;
      object-fit: cover;
      box-shadow: 0 0 80px rgba(255,255,255,0.1);
    }

    .eyebrow {
      font-size: 0.72rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.4);
      font-style: italic;
    }

    .flower-name {
      font-size: clamp(2.2rem, 8vw, 3rem);
      font-weight: 300;
      font-style: italic;
      line-height: 1.1;
      color: #fff;
    }

    .meaning {
      font-size: 1rem;
      font-style: italic;
      line-height: 1.8;
      color: rgba(255,255,255,0.72);
      max-width: 360px;
    }

    .cta {
      display: inline-block;
      margin-top: 0.25rem;
      padding: 0.85rem 2.2rem;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 100px;
      color: #fff;
      text-decoration: none;
      font-size: 0.8rem;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      font-style: normal;
      transition: background 0.2s, border-color 0.2s;
    }
    .cta:hover {
      background: rgba(255,255,255,0.08);
      border-color: rgba(255,255,255,0.55);
    }

    .brand {
      margin-top: 2rem;
      font-size: 0.7rem;
      letter-spacing: 0.14em;
      color: rgba(255,255,255,0.25);
      text-decoration: none;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="bg" aria-hidden="true"></div>

  <div class="card">
    ${image_url ? `<img class="flower-image" src="${esc(image_url)}" alt="${esc(flower_name)}" />` : ''}
    <p class="eyebrow">Your bloom is</p>
    <h1 class="flower-name">${esc(flower_name)}</h1>
    ${shortMeaning ? `<p class="meaning">${esc(shortMeaning)}</p>` : ''}
    <a href="https://bloom.irina.love/questions" class="cta">Bloom Yours</a>
    <a href="https://bloom.irina.love" class="brand">Bloom after Rain · irina.love</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=86400'
    }
  });
}
