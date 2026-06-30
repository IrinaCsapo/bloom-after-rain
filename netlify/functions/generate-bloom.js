/**
 * generate-bloom — calls Anthropic API directly via fetch (no SDK dependency).
 * Selects a flower archetype + writes a tender letter for the person's grief.
 */

const FLOWERS = {
  snowdrop:        { name: 'Snowdrop',        color: 'translucent white petals, soft pale green stem, delicate and barely-there, winter light filtering through' },
  hyacinth:        { name: 'Hyacinth',        color: 'soft lavender and violet cluster, tender purple tones, densely blooming' },
  wild_violet:     { name: 'Wild Violet',     color: 'deep violet purple petals, golden yellow center, delicate and small' },
  peony:           { name: 'Peony',           color: 'soft blush pink to coral, lush many-layered petals, abundant and full' },
  forget_me_not:   { name: 'Forget-Me-Not',  color: 'tiny sky blue petals, pale yellow-white center, in a soft cluster' },
  cherry_blossom:  { name: 'Cherry Blossom', color: 'palest blush pink to white, papery delicate petals, some falling' },
  night_jasmine:   { name: 'Night Jasmine',  color: 'pure white star-shaped petals, ethereal and glowing, moonlit quality' },
  hellebore:       { name: 'Hellebore',      color: 'deep burgundy to dusty dark purple, nodding downward, velvety petals' },
  lotus:           { name: 'Lotus',          color: 'soft pink petals fading to white at tips, golden-yellow center, rising pure and clear' },
  wisteria:        { name: 'Wisteria',       color: 'cascading lilac and soft violet clusters, hanging gently, dreamy and abundant' },
  bleeding_heart:  { name: 'Bleeding Heart', color: 'rose-pink and white heart-shaped flowers hanging from arching stems, delicate and pendulous' },
  iris:            { name: 'Iris',           color: 'deep violet-blue petals with gold veining, upright and regal yet tender, soft purple tones' }
};

const SYSTEM_PROMPT = `You are Bloom after Rain — a tender tool for people moving through grief and renewal. You speak with warmth, care, and quiet wisdom. You never offer false comfort. You witness what is real.`;

const buildUserPrompt = (answers) => `
A person has shared their story with you. Read it with care:

What they lost: "${answers.loss}"
What the absence feels like: "${answers.absence}"
What is starting to return: "${answers.returning}"
What they are ready to let be new: "${answers.new}"

Your task:

1. Choose their flower — the one that resonates most precisely with the nature of their loss and what is returning. Each flower has a specific resonance; choose carefully and avoid defaulting to the same flower repeatedly. Choose from:
   - snowdrop: hope returning after losing safety, certainty, or the familiar world — the first tender sign of light
   - hyacinth: renewal and self-forgiveness specifically after a romantic relationship or close bond has ended
   - wild_violet: grief of honouring someone who has died or is gone forever — faithfulness across loss
   - peony: loss of self through burnout, trauma, or chronic difficulty — the self slowly returning to itself, layer by layer
   - forget_me_not: grief of distance, disconnection, or separation — someone or something held tenderly from far away
   - cherry_blossom: grief over something that ended too soon — a loss felt as beautiful and brief, the ache of impermanence
   - night_jasmine: quiet, private grief that is carried alone — what begins to return when no one is watching
   - hellebore: grief carried for years, old and deep — finding unexpected beauty and resilience inside the darkness
   - lotus: healing after illness, disease, cancer, or a body-level crisis — rising clear from what tried to take you
   - wisteria: grief soaked in longing and nostalgia — mourning a time, a version of life, or a version of yourself that was beautiful and cannot return
   - bleeding_heart: grief where love is at the centre — love given but not received, love lost, love that left a wound still present
   - iris: grief from a major life transition or threshold — crossing from one chapter to another, with real loss on both sides

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
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: buildUserPrompt({ loss, absence, returning, new: newAns }) }
        ]
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic error: ${res.status} ${err}`);
    }

    const message = await res.json();
    const rawText = message.content[0].text.trim();

    // Strip markdown fences if present
    const jsonText = rawText.replace(/^```json?\n?/i, '').replace(/\n?```$/, '').trim();
    const data = JSON.parse(jsonText);

    // Enrich with flower color if missing
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
