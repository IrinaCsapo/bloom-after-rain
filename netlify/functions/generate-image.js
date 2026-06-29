/**
 * generate-image — uses Replicate FLUX Schnell for dreamy flower portraits.
 * Fast (1–4s), beautiful quality, no OpenAI dependency.
 * Aesthetic: soft focus, bokeh, pale periwinkle background, luminous & ethereal.
 */

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
  const prompt = image_prompt || buildPrompt(flower_name, flower_color);

  try {
    // FLUX Schnell via Replicate — prefer=wait returns result synchronously (no polling)
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
    const url = prediction.output?.[0];
    if (!url) throw new Error('No output from Replicate');

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
    `extreme close-up macro photograph of a single ${flowerName || 'flower'},`,
    `ultra soft focus, dreamy bokeh throughout,`,
    `pale periwinkle-lavender blue background, ethereal and luminous,`,
    `${flowerColor ? flowerColor + ',' : ''}`,
    `petals dissolving into soft blurred light,`,
    `tender emotional quality, film photography aesthetic,`,
    `one blossom centered, dreamlike, glowing softly`
  ].join(' ').replace(/\s+/g, ' ').trim();
}
