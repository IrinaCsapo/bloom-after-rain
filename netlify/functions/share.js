/**
 * share — serves a beautiful OG-tagged page for shared blooms.
 * URL: /share?d=<base64url encoded JSON>
 * OG tags make WhatsApp / iMessage / Twitter show: flower image + meaning + CTA.
 */

export default async function handler(req) {
  const url = new URL(req.url, 'https://bloom.irina.love');
  const raw  = url.searchParams.get('d') || '';

  let flower_name    = 'A Bloom';
  let flower_meaning = '';
  let image_url      = '';
  let letter_title   = '';

  if (raw) {
    try {
      const json    = decodeURIComponent(escape(atob(raw)));
      const decoded = JSON.parse(json);
      flower_name    = decoded.n || flower_name;
      flower_meaning = decoded.m || '';
      image_url      = decoded.i || '';
      letter_title   = decoded.t || '';
    } catch (_) {}
  }

  // First 2 sentences of meaning for OG description
  const shortMeaning = flower_meaning
    .split(/\.\s+/)
    .slice(0, 2)
    .join('. ')
    .trim()
    .replace(/\.?$/, '.');

  const ogDesc = shortMeaning
    ? `${shortMeaning} Bloom yours at bloom.irina.love`
    : 'Something tender is growing. Bloom yours at bloom.irina.love';

  // Escape for HTML attribute use
  const esc = (s) => s
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

  <!-- Open Graph (WhatsApp, iMessage, Telegram, Facebook, LinkedIn) -->
  <meta property="og:type"        content="website" />
  <meta property="og:url"         content="${esc(url.href)}" />
  <meta property="og:title"       content="${esc(flower_name)} — Bloom after Rain" />
  <meta property="og:description" content="${esc(ogDesc)}" />
  ${image_url ? `<meta property="og:image" content="${esc(image_url)}" />
  <meta property="og:image:width"  content="1024" />
  <meta property="og:image:height" content="1024" />` : ''}

  <!-- Twitter / X -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${esc(flower_name)} — Bloom after Rain" />
  <meta name="twitter:description" content="${esc(ogDesc)}" />
  ${image_url ? `<meta name="twitter:image" content="${esc(image_url)}" />` : ''}

  <meta name="theme-color" content="#0B0A10" />

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100dvh;
      background: #0B0A10;
      color: #fff;
      font-family: 'Georgia', serif;
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
      background: ${image_url
        ? `url('${image_url.replace(/'/g, "\\'")}') center/cover no-repeat`
        : 'linear-gradient(135deg, #1a0f2e 0%, #0B0A10 100%)'};
      filter: blur(40px) brightness(0.35) saturate(1.4);
      transform: scale(1.15);
      z-index: 0;
    }

    .card {
      position: relative;
      z-index: 1;
      max-width: 420px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }

    .flower-image {
      width: 220px;
      height: 220px;
      border-radius: 50%;
      object-fit: cover;
      box-shadow: 0 0 60px rgba(255,255,255,0.12);
      display: block;
    }

    .eyebrow {
      font-size: 0.72rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.45);
    }

    .flower-name {
      font-size: clamp(2rem, 8vw, 2.8rem);
      font-weight: 400;
      letter-spacing: 0.01em;
      line-height: 1.1;
      color: #fff;
    }

    .meaning {
      font-size: 1rem;
      line-height: 1.75;
      color: rgba(255,255,255,0.75);
      max-width: 360px;
    }

    .cta {
      display: inline-block;
      margin-top: 0.5rem;
      padding: 0.9rem 2.4rem;
      border: 1px solid rgba(255,255,255,0.35);
      border-radius: 100px;
      color: #fff;
      text-decoration: none;
      font-size: 0.82rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      transition: background 0.2s, border-color 0.2s;
    }
    .cta:hover {
      background: rgba(255,255,255,0.08);
      border-color: rgba(255,255,255,0.6);
    }

    .brand {
      margin-top: 2.5rem;
      font-size: 0.72rem;
      letter-spacing: 0.12em;
      color: rgba(255,255,255,0.3);
      text-decoration: none;
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
