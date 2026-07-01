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
  document.getElementById('modal-image').src            = bloom.image_url || '';
  document.getElementById('modal-image').alt            = bloom.flower_name || '';
  document.getElementById('modal-flower').textContent   = bloom.flower_name || '';
  document.getElementById('modal-meaning').textContent  = bloom.flower_meaning || '';
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

function renderCard(bloom, index) {
  const card = document.createElement('div');
  card.className = 'garden-card fade-in';
  card.style.animationDelay = `${(index % PAGE_SIZE) * 0.08}s`;
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `${bloom.flower_name} bloom`);

  let imageHtml;
  if (bloom.image_url) {
    // onerror swaps broken/expired images to the placeholder div
    imageHtml = `<img
      class="garden-card-image"
      src="${bloom.image_url}"
      alt="${bloom.flower_name}"
      loading="lazy"
      onerror="this.outerHTML='<div class=\\'garden-card-image-placeholder\\'></div>'"
    />`;
  } else {
    imageHtml = `<div class="garden-card-image-placeholder" aria-hidden="true"></div>`;
  }

  card.innerHTML = `
    ${imageHtml}
    <p class="garden-card-flower">${bloom.flower_name}</p>
    <p class="garden-card-title">${bloom.letter_title || ''}</p>
    <p class="garden-card-date">${formatDate(bloom.created_at)}</p>
  `;

  card.addEventListener('click', () => openModal(bloom));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(bloom); }
  });

  card.style.cursor = 'pointer';
  return card;
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

  btn.addEventListener('click', () => {
    loadMore();
  });

  gridEl.after(btn);
}

function loadMore() {
  const next = garden.slice(showing, showing + PAGE_SIZE);
  next.forEach((bloom, i) => {
    gridEl.appendChild(renderCard(bloom, showing + i));
  });
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

  // Render first page
  loadMore();
}

init();
