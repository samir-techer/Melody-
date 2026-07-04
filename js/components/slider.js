/**
 * Melody PWA - Slider Component
 * @version 1.0.0
 */

function createSlider(options = {}) {
  const {
    min = 0,
    max = 100,
    value = 50,
    onChange = null,
    variant = 'default'
  } = options;

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = min;
  slider.max = max;
  slider.value = value;
  slider.className = `slider ${variant === 'progress' ? 'slider--progress' : ''}`;

  if (variant === 'progress') {
    const percent = ((value - min) / (max - min)) * 100;
    slider.style.background = `linear-gradient(to right, var(--color-accent) ${percent}%, var(--color-bg-secondary) ${percent}%)`;
  }

  slider.addEventListener('input', (e) => {
    if (variant === 'progress') {
      const percent = ((e.target.value - min) / (max - min)) * 100;
      e.target.style.background = `linear-gradient(to right, var(--color-accent) ${percent}%, var(--color-bg-secondary) ${percent}%)`;
    }
    if (onChange) onChange(parseFloat(e.target.value));
  });

  return slider;
}
