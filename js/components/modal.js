/**
 * Melody PWA - Modal Component
 * @version 1.0.0
 */

function createModal(options = {}) {
  const {
    title = '',
    content = '',
    actions = [],
    onClose = null
  } = options;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal__handle"></div>
    <div class="modal__header">
      <h3 class="modal__title">${title}</h3>
      <button class="modal__close" id="modal-close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="modal__content">${content}</div>
    ${actions.length > 0 ? `
      <div style="display: flex; gap: var(--space-3); margin-top: var(--space-6);">
        ${actions.map(action => `
          <button class="btn ${action.primary ? 'btn--primary' : 'btn--secondary'} btn--full" data-action="${action.id}">
            ${action.label}
          </button>
        `).join('')}
      </div>
    ` : ''}
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  // Show animation
  requestAnimationFrame(() => {
    overlay.classList.add('active');
    modal.classList.add('active');
  });

  // Close handler
  const close = () => {
    overlay.classList.remove('active');
    modal.classList.remove('active');
    setTimeout(() => {
      overlay.remove();
      modal.remove();
      if (onClose) onClose();
    }, 300);
  };

  overlay.addEventListener('click', close);
  modal.querySelector('#modal-close')?.addEventListener('click', close);

  // Action handlers
  modal.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const actionId = btn.dataset.action;
      const action = actions.find(a => a.id === actionId);
      if (action?.onClick) {
        action.onClick();
      }
      close();
    });
  });

  return { close, modal, overlay };
}
