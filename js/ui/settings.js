/**
 * Melody PWA - Settings UI
 * @version 1.0.0
 */


const settings = {
  init() {
    this.render();
    this.bindEvents();
    this.subscribeToState();
  },

  render() {
    const page = document.getElementById('page-settings');
    if (!page) return;

    page.innerHTML = `
      <div class="page-content">
        <h1 style="font-size: var(--text-3xl); font-weight: var(--font-bold); margin-bottom: var(--space-6); padding: 0 var(--space-1);">Settings</h1>

        <div class="settings__group">
          <p class="settings__group-title">Account</p>
          <div class="settings__list">
            <div class="settings__item" id="setting-nickname">
              <div class="settings__item-left">
                <div class="settings__item-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div class="settings__item-info">
                  <div class="settings__item-title">Nickname</div>
                  <div class="settings__item-subtitle" id="nickname-value">Not set</div>
                </div>
              </div>
              <svg class="settings__item-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </div>
        </div>

        <div class="settings__group">
          <p class="settings__group-title">Playback</p>
          <div class="settings__list">
            <div class="settings__item">
              <div class="settings__item-left">
                <div class="settings__item-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                </div>
                <div class="settings__item-info">
                  <div class="settings__item-title">Crossfade</div>
                  <div class="settings__item-subtitle">Smooth transitions between songs</div>
                </div>
              </div>
              <label class="toggle">
                <input type="checkbox" id="toggle-crossfade">
                <div class="toggle__track"><div class="toggle__thumb"></div></div>
              </label>
            </div>
            <div class="settings__item">
              <div class="settings__item-left">
                <div class="settings__item-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                </div>
                <div class="settings__item-info">
                  <div class="settings__item-title">Gapless Playback</div>
                  <div class="settings__item-subtitle">Remove silence between tracks</div>
                </div>
              </div>
              <label class="toggle">
                <input type="checkbox" id="toggle-gapless">
                <div class="toggle__track"><div class="toggle__thumb"></div></div>
              </label>
            </div>
          </div>
        </div>

        <div class="settings__group">
          <p class="settings__group-title">Storage</p>
          <div class="settings__list">
            <div class="settings__item" id="setting-storage">
              <div class="settings__item-left">
                <div class="settings__item-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </div>
                <div class="settings__item-info">
                  <div class="settings__item-title">Import Music</div>
                  <div class="settings__item-subtitle">Add songs from your device</div>
                </div>
              </div>
              <svg class="settings__item-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
            <div class="settings__item" id="setting-backup">
              <div class="settings__item-left">
                <div class="settings__item-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                </div>
                <div class="settings__item-info">
                  <div class="settings__item-title">Backup Data</div>
                  <div class="settings__item-subtitle">Export your library and settings</div>
                </div>
              </div>
              <svg class="settings__item-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
            <div class="settings__item" id="setting-restore">
              <div class="settings__item-left">
                <div class="settings__item-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"/></svg>
                </div>
                <div class="settings__item-info">
                  <div class="settings__item-title">Restore Data</div>
                  <div class="settings__item-subtitle">Import from a backup file</div>
                </div>
              </div>
              <svg class="settings__item-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </div>
        </div>

        <div class="settings__group">
          <p class="settings__group-title">About</p>
          <div class="settings__list">
            <div class="settings__item">
              <div class="settings__item-left">
                <div class="settings__item-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                </div>
                <div class="settings__item-info">
                  <div class="settings__item-title">Version</div>
                </div>
              </div>
              <span class="settings__item-value">1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    `;

    this.updateValues();
  },

  bindEvents() {
    const page = document.getElementById('page-settings');
    if (!page) return;

    page.addEventListener('click', (e) => {
      const item = e.target.closest('.settings__item');
      if (!item) return;

      if (item.id === 'setting-nickname') {
        this.editNickname();
      } else if (item.id === 'setting-storage') {
        importService.triggerFileInput();
      } else if (item.id === 'setting-backup') {
        this.backupData();
      } else if (item.id === 'setting-restore') {
        this.restoreData();
      }
    });

    document.getElementById('toggle-crossfade')?.addEventListener('change', (e) => {
      state.set('crossfade', e.target.checked);
    });

    document.getElementById('toggle-gapless')?.addEventListener('change', (e) => {
      state.set('gapless', e.target.checked);
    });
  },

  subscribeToState() {
    state.subscribe('nickname', () => this.updateValues());
    state.subscribe('crossfade', (val) => {
      const cb = document.getElementById('toggle-crossfade');
      if (cb) cb.checked = val;
    });
    state.subscribe('gapless', (val) => {
      const cb = document.getElementById('toggle-gapless');
      if (cb) cb.checked = val;
    });
  },

  updateValues() {
    const nickname = state.get('nickname');
    const el = document.getElementById('nickname-value');
    if (el) el.textContent = nickname || 'Not set';
  },

  editNickname() {
    const current = state.get('nickname') || '';
    const newName = prompt('What should we call you?', current);
    if (newName && newName.trim()) {
      storage.setLocal('nickname', newName.trim());
      state.set('nickname', newName.trim());
    }
  },

  async backupData() {
    try {
      const data = await storage.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `melody-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Backup failed: ' + err.message);
    }
  },

  restoreData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      if (!input.files?.[0]) return;
      try {
        const text = await input.files[0].text();
        const data = JSON.parse(text);
        await storage.importData(data);
        alert('Data restored successfully!');
        window.location.reload();
      } catch (err) {
        alert('Restore failed: ' + err.message);
      }
    };
    input.click();
  }
};

// Module: settings
