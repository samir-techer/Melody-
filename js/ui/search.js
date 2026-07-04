/**
 * Melody PWA - Search UI
 * @version 1.0.0
 */


const searchUI = {
  init() {
    this.render();
    this.bindEvents();
  },

  render() {
    const page = document.getElementById('page-search');
    if (!page) return;

    page.innerHTML = `
      <div class="page-content">
        <div class="search__header">
          <input type="text" class="input input--search" id="search-input" 
                 placeholder="Search songs, artists, albums..." autocomplete="off">
        </div>
        <div class="search__results" id="search-results">
          <div class="search__history" id="search-history"></div>
        </div>
      </div>
    `;

    this.renderHistory();
  },

  bindEvents() {
    const input = document.getElementById('search-input');
    if (!input) return;

    input.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (query.length >= 2) {
        searchService.debouncedSearch(query, (results) => {
          this.renderResults(results);
        });
      } else if (query.length === 0) {
        this.renderHistory();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = input.value.trim();
        if (query) {
          searchService.globalSearch(query).then(results => {
            this.renderResults(results);
          });
        }
      }
    });

    const results = document.getElementById('search-results');
    if (results) {
      results.addEventListener('click', (e) => {
        const songItem = e.target.closest('[data-song-id]');
        if (songItem) {
          this.playSong(songItem.dataset.songId);
        }

        const historyChip = e.target.closest('.search__history-chip');
        if (historyChip) {
          input.value = historyChip.textContent;
          searchService.globalSearch(historyChip.textContent).then(results => {
            this.renderResults(results);
          });
        }
      });
    }
  },

  renderHistory() {
    const container = document.getElementById('search-results');
    const history = state.get('searchHistory') || [];

    if (history.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <h3 class="empty-state__title">Search your music</h3>
          <p class="empty-state__text">Find songs, artists, albums, and more</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="padding: 0 var(--space-1);">
        <p style="font-size: var(--text-xs); font-weight: var(--font-semibold); color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: var(--space-3);">Recent Searches</p>
        <div class="search__history">
          ${history.map(h => `<span class="search__history-chip">${h}</span>`).join('')}
        </div>
      </div>
    `;
  },

  renderResults(results) {
    const container = document.getElementById('search-results');
    if (!container) return;

    let html = '';

    if (results.songs?.length > 0) {
      html += `
        <div class="search__category">
          <p class="search__category-title">Songs</p>
          ${results.songs.map(song => `
            <div class="list-item" data-song-id="${song.id}">
              <div class="list-item__cover">
                <img src="${song.coverArt || '/assets/images/default-cover.svg'}" alt="" loading="lazy">
              </div>
              <div class="list-item__info">
                <div class="list-item__title truncate">${song.title || 'Unknown'}</div>
                <div class="list-item__subtitle truncate">${song.artist || 'Unknown Artist'}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (results.albums?.length > 0) {
      html += `
        <div class="search__category">
          <p class="search__category-title">Albums</p>
          <div class="scroll-x">
            ${results.albums.map(album => `
              <div class="card album-card">
                <div class="card__cover">
                  <img src="${album.coverArt || '/assets/images/default-cover.svg'}" alt="${album.name}" loading="lazy">
                </div>
                <div class="card__info">
                  <div class="card__title truncate">${album.name}</div>
                  <div class="card__subtitle truncate">${album.artist}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (results.artists?.length > 0) {
      html += `
        <div class="search__category">
          <p class="search__category-title">Artists</p>
          <div class="scroll-x">
            ${results.artists.map(artist => `
              <div class="card artist-card">
                <div class="card__cover">
                  <img src="${artist.coverArt || '/assets/images/default-cover.svg'}" alt="${artist.name}" loading="lazy">
                </div>
                <div class="card__info">
                  <div class="card__title truncate">${artist.name}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (!html) {
      html = `
        <div class="empty-state">
          <svg class="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <h3 class="empty-state__title">No results found</h3>
          <p class="empty-state__text">Try a different search term</p>
        </div>
      `;
    }

    container.innerHTML = html;
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

// Module: searchUI
