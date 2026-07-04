/**
 * Melody PWA - Queue UI
 * @version 1.0.0
 */


const queue = {
  init() {
    this.render();
    this.bindEvents();
    this.subscribeToState();
  },

  render() {
    const page = document.getElementById('page-queue');
    if (!page) return;

    page.innerHTML = `
      <div class="page-content">
        <h1 style="font-size: var(--text-3xl); font-weight: var(--font-bold); margin-bottom: var(--space-6); padding: 0 var(--space-1);">Queue</h1>
        <div id="queue-content"></div>
      </div>
    `;

    this.refreshQueue();
  },

  bindEvents() {
    const page = document.getElementById('page-queue');
    if (!page) return;

    page.addEventListener('click', (e) => {
      const songItem = e.target.closest('[data-song-id]');
      if (songItem) {
        const index = parseInt(songItem.dataset.index, 10);
        state.set('queueIndex', index);
        const queue = state.get('queue') || [];
        if (queue[index]) {
          audioService.loadTrack(queue[index]);
        }
      }
    });
  },

  subscribeToState() {
    state.subscribe('queue', () => this.refreshQueue());
    state.subscribe('queueIndex', () => this.refreshQueue());
    state.subscribe('currentTrack', () => this.refreshQueue());
  },

  refreshQueue() {
    const content = document.getElementById('queue-content');
    if (!content) return;

    const queue = state.get('queue') || [];
    const currentIndex = state.get('queueIndex') || 0;

    if (queue.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          <h3 class="empty-state__title">Queue is empty</h3>
          <p class="empty-state__text">Add songs to your queue</p>
        </div>
      `;
      return;
    }

    content.innerHTML = queue.map((song, index) => `
      <div class="list-item ${index === currentIndex ? 'active' : ''}" data-song-id="${song.id}" data-index="${index}" style="${index === currentIndex ? 'background: var(--color-bg-secondary);' : ''}">
        <span class="list-item__number">${index === currentIndex ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' : index + 1}</span>
        <div class="list-item__cover">
          <img src="${song.coverArt || '/assets/images/default-cover.svg'}" alt="" loading="lazy">
        </div>
        <div class="list-item__info">
          <div class="list-item__title truncate">${song.title || 'Unknown'}</div>
          <div class="list-item__subtitle truncate">${song.artist || 'Unknown Artist'}</div>
        </div>
      </div>
    `).join('');
  }
};

// Module: queue
