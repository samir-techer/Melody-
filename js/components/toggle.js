/**
 * Melody PWA - Toggle Component
 * @version 1.0.0
 */

function createToggle(options = {}) {
  const {
    checked = false,
    onChange = null
  } = options;

  const label = document.createElement('label');
  label.className = 'toggle';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;

  const track = document.createElement('div');
  track.className = 'toggle__track';

  const thumb = document.createElement('div');
  thumb.className = 'toggle__thumb';

  track.appendChild(thumb);
  label.appendChild(input);
  label.appendChild(track);

  input.addEventListener('change', (e) => {
    if (onChange) onChange(e.target.checked);
  });

  return { element: label, input };
}
