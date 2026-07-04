/**
 * Melody PWA - Favorites UI
 * @version 1.0.0
 */


const favorites = {
  init() {
    this.render();
    this.bindEvents();
    this.subscribeToState();
  },

  render() {
    const page = document.getElementById('page-favorites');
    if (!page) return;

    page.innerHTML = `
      <div class="page-content">
        <div class="favorites__header">
          <div class="favorites__cover">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div class="favorites__info">
            <h1 class="favorites__title">Favorites</h1>
            <p class="favorites__count" id="favorites-count">0 songs</p>
            <div class="favorites__actions">
              <button class="btn btn--primary" id="fav-play-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Play All
              </button>
            </div>
          </div>
        </div>
        <div id="favorites-list"></div>
      </div>
    `;

    this.refreshFavorites();
  },

  bindEvents() {
    const page = document.getElementById('page-favorites');
    if (!page) return;

    page.addEventListener('click', (e) => {
      const songItem = e.target.closest('[data-song-id]');
      if (songItem) {
        this.playSong(songItem.dataset.songId);
      }
    });

    document.getElementById('fav-play-all')?.addEventListener('click', () => {
      const favs = this.getFavoriteSongs();
      if (favs.length > 0) {
        state.set('queue', favs);
        state.set('queueIndex', 0);
        audioService.loadTrack(favs[0]);
      }
    });
  },

  subscribeToState() {
    state.subscribe('favorites', () => this.refreshFavorites());
    state.subscribe('songs', () => this.refreshFavorites());
  },

  getFavoriteSongs() {
    const favSet = state.get('favorites') || new Set();
    const songs = state.get('songs') || [];
    return songs.filter(s => favSet.has(s.id));
  },

  refreshFavorites() {
    const list = document.getElementById('favorites-list');
    const count = document.getElementById('favorites-count');
    if (!list) return;

    const favs = this.getFavoriteSongs();
    if (count) count.textContent = `${favs.length} songs`;

    if (favs.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <h3 class="empty-state__title">No favorites yet</h3>
          <p class="empty-state__text">Tap the heart on any song to add it here</p>
        </div>
      `;
      return;
    }

    list.innerHTML = favs.map((song, index) => `
      <div class="list-item" data-song-id="${song.id}">
        <span class="list-item__number">${index + 1}</span>
        <div class="list-item__cover">
          <img src="${song.coverArt || '/assets/images/default-cover.svg'}" alt="" loading="lazy">
        </div>
        <div class="list-item__info">
          <div class="list-item__title truncate">${song.title || 'Unknown'}</div>
          <div class="list-item__subtitle truncate">${song.artist || 'Unknown Artist'}</div>
        </div>
      </div>
    `).join('');
  },

  async playSong(songId) {
    const favs = this.getFavoriteSongs();
    const index = favs.findIndex(s => s.id === songId);
    if (index >= 0) {
      state.set('queue', favs);
      state.set('queueIndex', index);
      await audioService.loadTrack(favs[index]);
    }
  }
};

// Module: favorites
