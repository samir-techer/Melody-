/**
 * Melody PWA - Equalizer UI
 * @version 1.0.0
 */


const EQ_PRESETS = {
  flat: 'Flat',
  bass: 'Bass Boost',
  treble: 'Treble',
  pop: 'Pop',
  rock: 'Rock',
  jazz: 'Jazz',
  electronic: 'Electronic',
  classical: 'Classical'
};

const equalizer = {
  init() {
    this.render();
    this.bindEvents();
  },

  render() {
    const page = document.getElementById('page-equalizer');
    if (!page) return;

    page.innerHTML = `
      <div class="page-content">
        <h1 style="font-size: var(--text-3xl); font-weight: var(--font-bold); margin-bottom: var(--space-6); padding: 0 var(--space-1);">Equalizer</h1>

        <div style="background: var(--color-card); border-radius: var(--radius-xl); padding: var(--space-6); margin-bottom: var(--space-6);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-6);">
            <span style="font-weight: var(--font-semibold);">Enable Equalizer</span>
            <label class="toggle">
              <input type="checkbox" id="eq-toggle">
              <div class="toggle__track"><div class="toggle__thumb"></div></div>
            </label>
          </div>

          <div style="margin-bottom: var(--space-6);">
            <label style="display: block; font-size: var(--text-sm); font-weight: var(--font-medium); margin-bottom: var(--space-3);">Preset</label>
            <div class="library__tabs" id="eq-presets">
              ${Object.entries(EQ_PRESETS).map(([key, label]) => `
                <button class="library__tab ${key === 'flat' ? 'active' : ''}" data-preset="${key}">${label}</button>
              `).join('')}
            </div>
          </div>

          <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-2); height: 160px; padding: var(--space-4) 0;">
            ${[32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000].map((freq, i) => `
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: var(--space-2);">
                <input type="range" class="slider" id="eq-band-${i}" min="-12" max="12" value="0" 
                       style="writing-mode: bt-lr; -webkit-appearance: slider-vertical; width: 24px; height: 120px;"
                       orient="vertical">
                <span style="font-size: 9px; color: var(--color-text-secondary);">${freq >= 1000 ? (freq/1000)+'k' : freq}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <p style="font-size: var(--text-sm); color: var(--color-text-secondary); text-align: center; padding: var(--space-4);">
          Equalizer requires Web Audio API support. Some browsers may have limited functionality.
        </p>
      </div>
    `;
  },

  bindEvents() {
    document.getElementById('eq-toggle')?.addEventListener('change', (e) => {
      equalizerService.toggle();
    });

    document.getElementById('eq-presets')?.addEventListener('click', (e) => {
      const tab = e.target.closest('.library__tab');
      if (tab) {
        document.querySelectorAll('#eq-presets .library__tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        equalizerService.setPreset(tab.dataset.preset);
      }
    });

    for (let i = 0; i < 10; i++) {
      document.getElementById(`eq-band-${i}`)?.addEventListener('input', (e) => {
        equalizerService.setBand(i, parseFloat(e.target.value));
      });
    }
  }
};

// Module: equalizer
