const gridEl  = document.getElementById('garden-grid');
const emptyEl = document.getElementById('garden-empty');
const modal   = document.getElementById('bloom-modal');

const PAGE_SIZE = 6;
let garden  = [];
let showing = 0;

function formatDate(isoString) {
  try {
    return new Date(isoString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch (_) {
    return '';
  }
}

function openModal(bloom) {
  document.getElementById('modal-image').src           = bloom.image_url || '';
  document.getElementById('modal-image').alt           = bloom.flower_name || '';
  document.getElementById('modal-flower').textContent  = bloom.flower_name || '';
  document.getElementById('modal-meaning').textContent = bloom.flower_meaning || '';
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// Re-generate a single card's image (for expired / missing URLs)
async function repairImage(bloom, cardEl) {
  const imageWrap = cardEl.querySelector('.garden-card-image-wrap');
  if (!imageWrap) return;

  // Show spinner state
  imageWrap.innerHTML = `<div class="garden-card-image-placeholder loading" aria-hidden="true"></div>`;

  try {
    const res = await fetch('/.netlify/functions/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flower_name:  bloom.flower_name  || '',
        flower_color: bloom.flower_color || '',
        image_prompt: bloom.image_prompt || ''
      })
    });

    if (!res.ok) throw new Error('Generation failed');
    const { url } = await res.json();

    // Show new image
    imageWrap.innerHTML = `<img class="garden-card-image" src="${url}" alt="${bloom.flower_name}" loading="lazy" />`;

    // Persist to localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('bloomGarden') || '[]');
      const entry  = stored.find(b => b.created_at === bloom.created_at);
      if (entry) { entry.image_url = url; localStorage.setItem('bloomGarden', JSON.stringify(stored)); }
    } catch (_) {}

    bloom.image_url = url;

  } catch (err) {
    console.error('Image repair failed:', err);
    imageWrap.innerHTML = buildPlaceholder(bloom, true); // restore with retry
  }
}

function buildPlaceholder(bloom, withRetry = true) {
  if (!withRetry) return `<div class="garden-card-image-placeholder" aria-hidden="true"></div>`;
  return `
    <div class="garden-card-image-placeholder" aria-hidden="true">
      <button class="garden-repair-btn" title="Regenerate image" aria-label="Regenerate image for ${bloom.flower_name}">↻</button>
    </div>`;
}

function renderCard(bloom, index) {
  const card = document.createElement('div');
  card.className = 'garden-card fade-in';
  card.style.animationDelay = `${(index % PAGE_SIZE) * 0.08}s`;
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `${bloom.flower_name} bloom`);

  // Decide image content
  const isExpiredOrMissing = !bloom.image_url || bloom.image_url.includes('replicate.delivery');
  let imageContent;

  if (bloom.image_url && !isExpiredOrMissing) {
    imageContent = `<img
      class="garden-card-image"
      src="${bloom.image_url}"
      alt="${bloom.flower_name}"
      loading="lazy"
    />`;
  } else {
    imageContent = buildPlaceholder(bloom, true);
  }

  card.innerHTML = `
    <div class="garden-card-image-wrap">${imageContent}</div>
    <p class="garden-card-flower">${bloom.flower_name}</p>
    <p class="garden-card-title">${bloom.letter_title || ''}</p>
    <p class="garden-card-date">${formatDate(bloom.created_at)}</p>
  `;

  // Handle broken images that slip through (onerror)
  const img = card.querySelector('img');
  if (img) {
    img.addEventListener('error', () => {
      card.querySelector('.garden-card-image-wrap').innerHTML = buildPlaceholder(bloom, true);
      wireRepairBtn(card, bloom);
    });
  }

  // Wire repair button if placeholder shown
  wireRepairBtn(card, bloom);

  // Card click → modal (ignore repair button clicks)
  card.addEventListener('click', (e) => {
    if (e.target.classList.contains('garden-repair-btn')) return;
    openModal(bloom);
  });
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(bloom); }
  });
  card.style.cursor = 'pointer';

  return card;
}

function wireRepairBtn(card, bloom) {
  const btn = card.querySelector('.garden-repair-btn');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      repairImage(bloom, card);
    });
  }
}

function removeViewMore() {
  const existing = document.getElementById('view-more-btn');
  if (existing) existing.remove();
}

function addViewMore() {
  removeViewMore();
  if (showing >= garden.length) return;

  const btn = document.createElement('button');
  btn.id = 'view-more-btn';
  btn.className = 'btn btn-ghost';
  btn.textContent = `View More (${garden.length - showing} remaining)`;
  btn.style.cssText = 'display:block; margin: 2rem auto 0; letter-spacing:0.1em; font-size:0.8rem;';
  btn.addEventListener('click', loadMore);
  gridEl.after(btn);
}

function loadMore() {
  const next = garden.slice(showing, showing + PAGE_SIZE);
  next.forEach((bloom, i) => gridEl.appendChild(renderCard(bloom, showing + i)));
  showing += next.length;
  addViewMore();
}

function init() {
  try {
    garden = JSON.parse(localStorage.getItem('bloomGarden') || '[]');
  } catch (_) {}

  if (garden.length === 0) {
    gridEl.style.display  = 'none';
    emptyEl.style.display = 'flex';
    return;
  }

  loadMore();
}

init();
