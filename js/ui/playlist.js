/**
 * Melody PWA - Playlist UI
 * @version 1.0.0
 */


const playlist = {
  init() {
    this.render();
    this.bindEvents();
  },

  render() {
    const page = document.getElementById('page-playlists');
    if (!page) return;

    page.innerHTML = `
      <div class="page-content">
        <div class="section-header">
          <h1 class="section-title">Playlists</h1>
        </div>
        <div class="playlists__grid" id="playlists-grid">
          <div class="playlist-create" id="create-playlist">
            <div class="playlist-create__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
            <span class="playlist-create__text">New Playlist</span>
          </div>
        </div>
      </div>
    `;

    this.refreshPlaylists();
  },

  bindEvents() {
    document.getElementById('create-playlist')?.addEventListener('click', async () => {
      const name = prompt('Playlist name:');
      if (name?.trim()) {
        await db.createPlaylist(name.trim());
        this.refreshPlaylists();
      }
    });
  },

  async refreshPlaylists() {
    const grid = document.getElementById('playlists-grid');
    if (!grid) return;

    const playlists = await db.getAllPlaylists();
    const existing = grid.querySelectorAll('.card');
    existing.forEach(el => el.remove());

    playlists.forEach(playlist => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card__cover" style="background: linear-gradient(135deg, #232323 0%, #3A3A3A 100%); display: flex; align-items: center; justify-content: center;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#F5F1EC" stroke-width="1.5">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
        </div>
        <div class="card__info">
          <div class="card__title truncate">${playlist.name}</div>
          <div class="card__subtitle truncate">${playlist.songs?.length || 0} songs</div>
        </div>
      `;
      grid.appendChild(card);
    });
  }
};

// Module: playlist
