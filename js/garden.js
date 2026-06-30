const gridEl  = document.getElementById('garden-grid');
const emptyEl = document.getElementById('garden-empty');
const modal   = document.getElementById('bloom-modal');

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
  document.getElementById('modal-image').src   = bloom.image_url || '';
  document.getElementById('modal-image').alt   = bloom.flower_name || '';
  document.getElementById('modal-flower').textContent  = bloom.flower_name || '';
  document.getElementById('modal-meaning').textContent = bloom.flower_meaning || '';
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

// Close on backdrop click
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

function renderCard(bloom, index) {
  const card = document.createElement('div');
  card.className = 'garden-card fade-in';
  card.style.animationDelay = `${index * 0.08}s`;
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `${bloom.flower_name} bloom`);

  const imageHtml = bloom.image_url
    ? `<img class="garden-card-image" src="${bloom.image_url}" alt="${bloom.flower_name}" loading="lazy" />`
    : `<div class="garden-card-image-placeholder" aria-hidden="true"></div>`;

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

function init() {
  let garden = [];
  try {
    garden = JSON.parse(localStorage.getItem('bloomGarden') || '[]');
  } catch (_) {}

  if (garden.length === 0) {
    gridEl.style.display  = 'none';
    emptyEl.style.display = 'flex';
    return;
  }

  garden.forEach((bloom, i) => {
    gridEl.appendChild(renderCard(bloom, i));
  });
}

init();
