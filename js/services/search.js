/**
 * Melody PWA - Search Service
 * Fast local search with fuzzy matching and history
 * @version 1.0.0
 */


class SearchService {
  constructor() {
    this.searchIndex = new Map();
    this.debounceTimer = null;
    this.maxHistory = 20;
  }

  /**
   * Build search index from all songs
   */
  async buildIndex() {
    const songs = await storage.getAllSongs();
    this.searchIndex.clear();

    for (const song of songs) {
      const terms = this.extractTerms(song);
      for (const term of terms) {
        if (!this.searchIndex.has(term)) {
          this.searchIndex.set(term, new Set());
        }
        this.searchIndex.get(term).add(song.id);
      }
    }
  }

  /**
   * Extract searchable terms from a song
   */
  extractTerms(song) {
    const terms = new Set();
    const fields = ['title', 'artist', 'album', 'albumArtist', 'genre', 'composer'];

    for (const field of fields) {
      const value = song[field];
      if (value) {
        const words = value.toLowerCase().split(/\s+/);
        for (const word of words) {
          if (word.length > 1) {
            terms.add(word);
            // Add prefix for partial matching
            for (let i = 2; i <= word.length; i++) {
              terms.add(word.substring(0, i));
            }
          }
        }
      }
    }

    return Array.from(terms);
  }

  /**
   * Search songs
   */
  async searchSongs(query, options = {}) {
    if (!query || query.trim().length < 1) return [];

    const q = query.toLowerCase().trim();
    const songs = await storage.getAllSongs();

    const results = songs.map(song => {
      const score = this.calculateSearchScore(song, q);
      return { song, score };
    }).filter(r => r.score > 0);

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    const limit = options.limit || 50;
    return results.slice(0, limit).map(r => r.song);
  }

  /**
   * Calculate search relevance score
   */
  calculateSearchScore(song, query) {
    let score = 0;
    const q = query.toLowerCase();

    // Title match (highest weight)
    if (song.title) {
      const title = song.title.toLowerCase();
      if (title === q) score += 100;
      else if (title.startsWith(q)) score += 80;
      else if (title.includes(q)) score += 60;
    }

    // Artist match
    if (song.artist) {
      const artist = song.artist.toLowerCase();
      if (artist === q) score += 70;
      else if (artist.startsWith(q)) score += 50;
      else if (artist.includes(q)) score += 40;
    }

    // Album match
    if (song.album) {
      const album = song.album.toLowerCase();
      if (album === q) score += 50;
      else if (album.startsWith(q)) score += 35;
      else if (album.includes(q)) score += 25;
    }

    // Genre match
    if (song.genre) {
      const genre = song.genre.toLowerCase();
      if (genre === q) score += 40;
      else if (genre.includes(q)) score += 20;
    }

    // Fuzzy match for partial words
    const allText = `${song.title || ''} ${song.artist || ''} ${song.album || ''}`.toLowerCase();
    const words = q.split(/\s+/);
    let wordMatches = 0;
    for (const word of words) {
      if (allText.includes(word)) wordMatches++;
    }
    score += wordMatches * 10;

    return score;
  }

  /**
   * Global search across all content types
   */
  async globalSearch(query) {
    if (!query || query.trim().length < 2) {
      return { songs: [], albums: [], artists: [], playlists: [], genres: [] };
    }

    const q = query.toLowerCase().trim();

    const [songs, albums, artists, playlists, genres] = await Promise.all([
      this.searchSongs(q, { limit: 20 }),
      db.getAlbums().then(a => a.filter(al => 
        al.name.toLowerCase().includes(q) || al.artist.toLowerCase().includes(q)
      ).slice(0, 10)),
      db.getArtists().then(a => a.filter(ar => ar.name.toLowerCase().includes(q)).slice(0, 10)),
      db.getAllPlaylists().then(p => p.filter(pl => pl.name.toLowerCase().includes(q)).slice(0, 10)),
      db.getGenres().then(g => g.filter(gr => gr.name.toLowerCase().includes(q)).slice(0, 10))
    ]);

    // Save to search history
    this.addToHistory(query);

    return { songs, albums, artists, playlists, genres };
  }

  /**
   * Add to search history
   */
  addToHistory(query) {
    const history = state.get('searchHistory') || [];
    const trimmed = query.trim();

    // Remove if already exists
    const filtered = history.filter(h => h.toLowerCase() !== trimmed.toLowerCase());

    // Add to front
    filtered.unshift(trimmed);

    // Limit size
    const limited = filtered.slice(0, this.maxHistory);

    state.set('searchHistory', limited);
    storage.setLocal('searchHistory', limited);
  }

  /**
   * Get search history
   */
  getHistory() {
    return state.get('searchHistory') || [];
  }

  /**
   * Clear search history
   */
  clearHistory() {
    state.set('searchHistory', []);
    storage.setLocal('searchHistory', []);
  }

  /**
   * Remove from history
   */
  removeFromHistory(query) {
    const history = state.get('searchHistory') || [];
    const filtered = history.filter(h => h !== query);
    state.set('searchHistory', filtered);
    storage.setLocal('searchHistory', filtered);
  }

  /**
   * Debounced search
   */
  debouncedSearch(query, callback, delay = 200) {
    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout(async () => {
      const results = await this.globalSearch(query);
      callback(results);
    }, delay);
  }
}

// Singleton instance
const searchService = new SearchService();

// Module: searchService
