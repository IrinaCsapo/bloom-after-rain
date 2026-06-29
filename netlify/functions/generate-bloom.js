import Anthropic from '@anthropic-ai/sdk';

export const config = { timeout: 26 };

const FLOWERS = {
  snowdrop: {
    name: 'Snowdrop',
    color: 'translucent white petals, soft pale green stem, delicate and barely-there, winter light filtering through',
  },
  hyacinth: {
    name: 'Hyacinth',
    color: 'soft lavender and violet cluster, tender purple tones, densely blooming',
  },
  wild_violet: {
    name: 'Wild Violet',
    color: 'deep violet purple petals, golden yellow center, delicate and small',
  },
  peony: {
    name: 'Peony',
    color: 'soft blush pink to coral, lush many-layered petals, abundant and full',
  },
  forget_me_not: {
    name: 'Forget-Me-Not',
    color: 'tiny sky blue petals, pale yellow-white center, in a soft cluster',
  },
  cherry_blossom: {
    name: 'Cherry Blossom',
    color: 'palest blush pink to white, papery delicate petals, some falling',
  },
  night_jasmine: {
    name: 'Night Jasmine',
    color: 'pure white star-shaped petals, ethereal and glowing, moonlit quality',
  },
  hellebore: {
    name: 'Hellebore',
    color: 'deep burgundy to dusty dark purple, nodding downward, velvety petals',
  },
  lotus: {
    name: 'Lotus',
    color: 'soft pink petals fading to white at tips, golden-yellow center, rising pure and clear',
  }
};

const SYSTEM_PROMPT = `You are Bloom after Rain — a tender tool for people moving through grief and renewal. You speak with warmth, care, and quiet wisdom. You never offer false comfort. You witness what is real.`;

const USER_PROMPT = (answers) => `
A person has shared their story with you. Read it with care:

What they lost: "${answers.loss}"
What the absence feels like: "${answers.absence}"
What is starting to return: "${answers.returning}"
What they are ready to let be new: "${answers.new}"

Your task:

1. Choose their flower — the one that resonates most with the nature of their loss and what is returning. Choose from:
   - snowdrop: hope after losing safety, certainty, or the familiar world
   - hyacinth: renewal and self-forgiveness after a relationship has ended
   - wild_violet: honouring someone who is gone, faithfulness across loss
   - peony: loss of self or identity, soft healing and abundance returning
   - forget_me_not: distance, disconnection, the tenderness of what you hold onto
   - cherry_blossom: any kind of ending, beauty in impermanence, beginning again
   - night_jasmine: quiet private grief, what returns when no one is watching
   - hellebore: grief carried a long time, finding beauty and strength in darkness
   - lotus: healing from illness, disease, or cancer — rising clear and untouched from what tried to take you

2. Write them a letter from renewal itself — two paragraphs only. Speak directly to this person. Reference the specific words and feelings they shared. Be tender, not clinical. Do not offer easy comfort. Let them feel seen. End with something that leaves space for hope without forcing it.

3. Write a letter title — 3 to 7 words, lowercase, poetic. Not a summary. A tone.

4. Write 2–3 sentences explaining why this flower chose them. Speak of the flower and the person together. Gentle, not botanical.

Respond ONLY with valid JSON in exactly this structure, no other text:
{
  "flower": "flower_id_from_list",
  "flower_name": "Display Name",
  "flower_color": "color description for image generation",
  "letter_title": "the title here",
  "letter_body": "First paragraph.\\n\\nSecond paragraph.",
  "flower_meaning": "2-3 sentences about why this flower.",
  "image_prompt": "A photographic image generation prompt for this flower in the style of dreamy, ultra soft focus macro photography"
}
`.trim();

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let answers;
  try {
    answers = await req.json();
  } catch (_) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { loss, absence, returning, new: newAns } = answers;
  if (!loss || !absence || !returning || !newAns) {
    return new Response(JSON.stringify({ error: 'All four answers are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: USER_PROMPT({ loss, absence, returning, new: newAns })
        }
      ]
    });

    const rawText = message.content[0].text.trim();

    // Parse JSON — strip any markdown fences if present
    const jsonText = rawText.replace(/^```json?\n?/i, '').replace(/\n?```$/,'').trim();
    const data = JSON.parse(jsonText);

    // Enrich with flower color from our vocab if needed
    const flowerMeta = FLOWERS[data.flower];
    if (flowerMeta && !data.flower_color) {
      data.flower_color = flowerMeta.color;
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });

  } catch (err) {
    console.error('generate-bloom error:', err);
    return new Response(JSON.stringify({ error: 'Generation failed', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
