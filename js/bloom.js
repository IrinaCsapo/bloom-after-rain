const loadingEl = document.getElementById('bloom-loading');
const resultEl  = document.getElementById('bloom-result');

// Retrieve data from sessionStorage
const raw = sessionStorage.getItem('bloomData');
if (!raw) {
  // No data — redirect home
  window.location.href = '/';
}

const bloomData = JSON.parse(raw);

// Populate text content immediately (no waiting for image)
function populate(data) {
  document.getElementById('flower-name').textContent    = data.flower_name;
  document.getElementById('flower-meaning').textContent = data.flower_meaning;
  document.getElementById('letter-title').textContent   = data.letter_title;

  // Letter body — split paragraphs on double newline
  const letterBodyEl = document.getElementById('letter-body');
  const paragraphs = data.letter_body.split(/\n\n+/);
  letterBodyEl.innerHTML = paragraphs
    .filter(p => p.trim())
    .map(p => `<p>${p.trim()}</p>`)
    .join('');

  // Update page title
  document.title = `${data.flower_name} — Bloom after Rain`;

  // Save to localStorage garden
  saveToGarden(data);
}

function saveToGarden(data) {
  try {
    const garden = JSON.parse(localStorage.getItem('bloomGarden') || '[]');
    // Avoid duplicates (by created_at)
    const exists = garden.some(b => b.created_at === data.created_at);
    if (!exists) {
      garden.unshift(data);
      // Keep last 20 blooms
      if (garden.length > 20) garden.length = 20;
      localStorage.setItem('bloomGarden', JSON.stringify(garden));
    }
  } catch (_) {
    // localStorage unavailable — silent fail
  }
}

async function loadImage(data) {
  try {
    const res = await fetch('/.netlify/functions/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flower_name:  data.flower_name,
        flower_color: data.flower_color,
        image_prompt: data.image_prompt
      })
    });

    if (!res.ok) throw new Error('Image generation failed');
    const { url } = await res.json();

    const imgEl = document.getElementById('bloom-image');
    const placeholder = document.getElementById('image-placeholder');

    imgEl.src = url;
    imgEl.alt = `A dreamy, ethereal ${data.flower_name}`;

    imgEl.onload = () => {
      imgEl.classList.add('loaded');
      placeholder.style.display = 'none';

      // Update garden entry with image
      updateGardenImage(data.created_at, url);
    };
  } catch (err) {
    console.error('Image load failed:', err);
    // Leave placeholder — the letter is still shown
  }
}

function updateGardenImage(createdAt, imageUrl) {
  try {
    const garden = JSON.parse(localStorage.getItem('bloomGarden') || '[]');
    const entry = garden.find(b => b.created_at === createdAt);
    if (entry) {
      entry.image_url = imageUrl;
      localStorage.setItem('bloomGarden', JSON.stringify(garden));
    }
  } catch (_) {}
}

async function shareBloom() {
  const shareText = `My bloom is a ${bloomData.flower_name}. "${bloomData.letter_title}" — from Bloom after Rain`;
  const shareUrl  = 'https://bloom.irina.love';

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Bloom after Rain',
        text:  shareText,
        url:   shareUrl
      });
    } catch (_) {}
  } else {
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      const btn = document.querySelector('button[onclick="shareBloom()"]');
      btn.textContent = 'copied ✓';
      setTimeout(() => { btn.textContent = 'share'; }, 2500);
    } catch (_) {}
  }
}

// Init: show result, then load image
async function init() {
  populate(bloomData);

  // Show result immediately
  loadingEl.style.display = 'none';
  resultEl.style.display  = 'flex';

  // Then fetch the image (async, non-blocking for the letter)
  await loadImage(bloomData);
}

init();
