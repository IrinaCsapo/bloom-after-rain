/**
 * generate-image — calls OpenAI DALL-E 3 to create a dreamy flower portrait.
 * Matches the aesthetic: extreme soft focus, bokeh, pale periwinkle background,
 * luminous and ethereal — like the reference photographs.
 */

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
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

  // Build the full prompt — base style + flower-specific color
  const prompt = image_prompt || buildPrompt(flower_name, flower_color);

  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model:   'dall-e-2',
        prompt,
        n:       1,
        size:    '512x512'
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI error: ${res.status} ${err}`);
    }

    const data = await res.json();
    const url  = data.data[0].url;

    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });

  } catch (err) {
    console.error('generate-image error:', err);
    return new Response(JSON.stringify({ error: 'Image generation failed', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function buildPrompt(flowerName, flowerColor) {
  return [
    `Macro photograph of a single ${flowerName || 'flower'},`,
    `soft focus, dreamy bokeh, pale periwinkle-lavender background,`,
    `${flowerColor ? flowerColor + ',' : ''}`,
    `ethereal and luminous, tender film photography aesthetic,`,
    `no text, no watermark`
  ].join(' ').replace(/\s+/g, ' ').trim();
}
