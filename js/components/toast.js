/**
 * Melody PWA - Toast Component
 * @version 1.0.0
 */

let toastContainer = null;

function getContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

function showToast(message, type = 'default', duration = 3000) {
  const container = getContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.animation = 'slideDown 300ms ease forwards reverse';
  });

  setTimeout(() => {
    toast.style.animation = 'fadeOut 300ms forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);

  return toast;
}

function showSuccess(message) {
  return showToast(message, 'success');
}

function showError(message) {
  return showToast(message, 'error');
}

function showWarning(message) {
  return showToast(message, 'warning');
}
