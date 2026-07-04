/**
 * Melody PWA - Library UI
 * Browse songs, albums, artists, genres, folders
 * @version 1.0.0
 */


const library = {
  currentTab: 'songs',

  init() {
    this.render();
    this.bindEvents();
    this.subscribeToState();
  },

  render() {
    const page = document.getElementById('page-library');
    if (!page) return;

    page.innerHTML = `
      <div class="page-content">
        <div class="library__tabs">
          <button class="library__tab active" data-tab="songs">Songs</button>
          <button class="library__tab" data-tab="albums">Albums</button>
          <button class="library__tab" data-tab="artists">Artists</button>
          <button class="library__tab" data-tab="genres">Genres</button>
          <button class="library__tab" data-tab="folders">Folders</button>
        </div>
        <div class="library__content" id="library-content">
          <div class="empty-state">
            <svg class="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
            <h3 class="empty-state__title">No music yet</h3>
            <p class="empty-state__text">Import your music files to get started</p>
          </div>
        </div>
      </div>
    `;
  },

  bindEvents() {
    const page = document.getElementById('page-library');
    if (!page) return;

    page.addEventListener('click', (e) => {
      const tab = e.target.closest('.library__tab');
      if (tab) {
        this.switchTab(tab.dataset.tab);
      }

      const songItem = e.target.closest('[data-song-id]');
      if (songItem) {
        this.playSong(songItem.dataset.songId);
      }
    });
  },

  subscribeToState() {
    state.subscribe('songs', () => this.refreshContent());
    state.subscribe('albums', () => this.refreshContent());
    state.subscribe('artists', () => this.refreshContent());
    state.subscribe('genres', () => this.refreshContent());
    state.subscribe('folders', () => this.refreshContent());
  },

  switchTab(tab) {
    this.currentTab = tab;

    document.querySelectorAll('.library__tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });

    this.refreshContent();
  },

  refreshContent() {
    const content = document.getElementById('library-content');
    if (!content) return;

    const data = state.get(this.currentTab) || [];

    if (data.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
          <h3 class="empty-state__title">No ${this.currentTab} yet</h3>
          <p class="empty-state__text">Import your music files to get started</p>
        </div>
      `;
      return;
    }

    switch (this.currentTab) {
      case 'songs':
        content.innerHTML = this.renderSongList(data);
        break;
      case 'albums':
        content.innerHTML = this.renderAlbumGrid(data);
        break;
      case 'artists':
        content.innerHTML = this.renderArtistGrid(data);
        break;
      case 'genres':
        content.innerHTML = this.renderGenreGrid(data);
        break;
      case 'folders':
        content.innerHTML = this.renderFolderList(data);
        break;
    }
  },

  renderSongList(songs) {
    return songs.map((song, index) => `
      <div class="list-item" data-song-id="${song.id}">
        <span class="list-item__number">${index + 1}</span>
        <div class="list-item__cover">
          <img src="${song.coverArt || '/assets/images/default-cover.svg'}" alt="" loading="lazy">
        </div>
        <div class="list-item__info">
          <div class="list-item__title truncate">${song.title || 'Unknown'}</div>
          <div class="list-item__subtitle truncate">${song.artist || 'Unknown Artist'} · ${song.album || ''}</div>
        </div>
        <span class="list-item__action">${formatDurationCompact(song.duration)}</span>
      </div>
    `).join('');
  },

  renderAlbumGrid(albums) {
    return `<div class="playlists__grid">` + albums.map(album => `
      <div class="card">
        <div class="card__cover">
          <img src="${album.coverArt || '/assets/images/default-cover.svg'}" alt="${album.name}" loading="lazy">
        </div>
        <div class="card__info">
          <div class="card__title truncate">${album.name}</div>
          <div class="card__subtitle truncate">${album.artist} · ${album.songCount} songs</div>
        </div>
      </div>
    `).join('') + `</div>`;
  },

  renderArtistGrid(artists) {
    return `<div class="playlists__grid">` + artists.map(artist => `
      <div class="card artist-card">
        <div class="card__cover">
          <img src="${artist.coverArt || '/assets/images/default-cover.svg'}" alt="${artist.name}" loading="lazy">
        </div>
        <div class="card__info">
          <div class="card__title truncate">${artist.name}</div>
          <div class="card__subtitle truncate">${artist.songCount} songs</div>
        </div>
      </div>
    `).join('') + `</div>`;
  },

  renderGenreGrid(genres) {
    return `<div class="playlists__grid">` + genres.map(genre => `
      <div class="card">
        <div class="card__cover" style="background: linear-gradient(135deg, #232323 0%, #3A3A3A 100%); display: flex; align-items: center; justify-content: center;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#F5F1EC" stroke-width="1.5">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
        </div>
        <div class="card__info">
          <div class="card__title truncate">${genre.name}</div>
          <div class="card__subtitle truncate">${genre.songCount} songs</div>
        </div>
      </div>
    `).join('') + `</div>`;
  },

  renderFolderList(folders) {
    return folders.map(folder => `
      <div class="list-item">
        <div class="list-item__cover" style="background: var(--color-bg-secondary); display: flex; align-items: center; justify-content: center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div class="list-item__info">
          <div class="list-item__title truncate">${folder.name}</div>
          <div class="list-item__subtitle truncate">${folder.songCount} songs</div>
        </div>
      </div>
    `).join('');
  },

  async playSong(songId) {
    const songs = state.get('songs') || [];
    const song = songs.find(s => s.id === songId);
    if (song) {
      state.set('queue', [song]);
      state.set('queueIndex', 0);
      await audioService.loadTrack(song);
    }
  }
};

// Module: library
