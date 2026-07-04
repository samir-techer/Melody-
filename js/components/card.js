/**
 * Melody PWA - Card Component
 * @version 1.0.0
 */

function createCard(options = {}) {
  const {
    title = '',
    subtitle = '',
    cover = '/assets/images/default-cover.svg',
    size = 'medium',
    shape = 'square',
    onClick = null
  } = options;

  const card = document.createElement('div');
  card.className = `card card--${size}`;

  if (shape === 'circle') {
    card.classList.add('card--circle');
  }

  card.innerHTML = `
    <div class="card__cover">
      <img src="${cover}" alt="${title}" loading="lazy">
    </div>
    <div class="card__info">
      <div class="card__title truncate">${title}</div>
      ${subtitle ? `<div class="card__subtitle truncate">${subtitle}</div>` : ''}
    </div>
  `;

  if (onClick) {
    card.addEventListener('click', onClick);
  }

  return card;
}

function createHorizontalCard(options = {}) {
  const {
    title = '',
    subtitle = '',
    cover = '/assets/images/default-cover.svg',
    number = null,
    onClick = null
  } = options;

  const card = document.createElement('div');
  card.className = 'card card--horizontal';

  card.innerHTML = `
    ${number !== null ? `<span class="list-item__number">${number}</span>` : ''}
    <div class="card__cover">
      <img src="${cover}" alt="${title}" loading="lazy">
    </div>
    <div class="card__info">
      <div class="card__title">${title}</div>
      ${subtitle ? `<div class="card__subtitle">${subtitle}</div>` : ''}
    </div>
  `;

  if (onClick) {
    card.addEventListener('click', onClick);
  }

  return card;
}
