/**
 * Melody PWA - Database Manager
 * High-level queries and aggregations over IndexedDB
 * @version 1.0.0
 */


class DatabaseManager {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5000; // 5 second cache
  }

  /**
   * Get all songs with optional filters
   */
  async getSongs(filters = {}) {
    let songs = await storage.getAllSongs();

    if (filters.favorites) {
      songs = songs.filter(s => s.isFavorite);
    }
    if (filters.recent) {
      songs.sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
      songs = songs.slice(0, filters.limit || 20);
    }
    if (filters.mostPlayed) {
      songs.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
      songs = songs.slice(0, filters.limit || 20);
    }
    if (filters.recentlyAdded) {
      songs.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
      songs = songs.slice(0, filters.limit || 20);
    }
    if (filters.genre) {
      songs = songs.filter(s => s.genre === filters.genre);
    }
    if (filters.artist) {
      songs = songs.filter(s => s.artist === filters.artist);
    }
    if (filters.album) {
      songs = songs.filter(s => s.album === filters.album);
    }
    if (filters.search) {
      const query = filters.search.toLowerCase();
      songs = songs.filter(s =>
        s.title?.toLowerCase().includes(query) ||
        s.artist?.toLowerCase().includes(query) ||
        s.album?.toLowerCase().includes(query) ||
        s.genre?.toLowerCase().includes(query)
      );
    }
    if (filters.limit && !filters.recent && !filters.mostPlayed && !filters.recentlyAdded) {
      songs = songs.slice(0, filters.limit);
    }

    return songs;
  }

  /**
   * Get all albums with aggregated data
   */
  async getAlbums() {
    const songs = await storage.getAllSongs();
    const albumMap = new Map();

    for (const song of songs) {
      if (!song.album) continue;
      const key = `${song.album}|${song.albumArtist || song.artist}`;

      if (!albumMap.has(key)) {
        albumMap.set(key, {
          id: key,
          name: song.album,
          artist: song.albumArtist || song.artist,
          coverArt: song.coverArt,
          songCount: 0,
          songs: [],
          year: song.year,
          genre: song.genre
        });
      }

      const album = albumMap.get(key);
      album.songCount++;
      album.songs.push(song);
      if (!album.coverArt && song.coverArt) {
        album.coverArt = song.coverArt;
      }
    }

    return Array.from(albumMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get all artists with aggregated data
   */
  async getArtists() {
    const songs = await storage.getAllSongs();
    const artistMap = new Map();

    for (const song of songs) {
      if (!song.artist) continue;

      if (!artistMap.has(song.artist)) {
        artistMap.set(song.artist, {
          id: song.artist,
          name: song.artist,
          coverArt: song.coverArt,
          songCount: 0,
          albumCount: new Set(),
          genres: new Set()
        });
      }

      const artist = artistMap.get(song.artist);
      artist.songCount++;
      if (song.album) artist.albumCount.add(song.album);
      if (song.genre) artist.genres.add(song.genre);
      if (!artist.coverArt && song.coverArt) {
        artist.coverArt = song.coverArt;
      }
    }

    return Array.from(artistMap.values())
      .map(a => ({ ...a, albumCount: a.albumCount.size }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get all genres
   */
  async getGenres() {
    const songs = await storage.getAllSongs();
    const genreMap = new Map();

    for (const song of songs) {
      if (!song.genre) continue;

      if (!genreMap.has(song.genre)) {
        genreMap.set(song.genre, {
          id: song.genre,
          name: song.genre,
          songCount: 0,
          coverArt: null
        });
      }

      const genre = genreMap.get(song.genre);
      genre.songCount++;
      if (!genre.coverArt && song.coverArt) {
        genre.coverArt = song.coverArt;
      }
    }

    return Array.from(genreMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get all folders (from file paths)
   */
  async getFolders() {
    const songs = await storage.getAllSongs();
    const folderMap = new Map();

    for (const song of songs) {
      if (!song.folderPath) continue;

      if (!folderMap.has(song.folderPath)) {
        folderMap.set(song.folderPath, {
          id: song.folderPath,
          path: song.folderPath,
          name: song.folderPath.split('/').pop() || song.folderPath,
          songCount: 0,
          coverArt: null
        });
      }

      const folder = folderMap.get(song.folderPath);
      folder.songCount++;
      if (!folder.coverArt && song.coverArt) {
        folder.coverArt = song.coverArt;
      }
    }

    return Array.from(folderMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get favorites
   */
  async getFavorites() {
    return this.getSongs({ favorites: true });
  }

  /**
   * Get recently played
   */
  async getRecentlyPlayed(limit = 10) {
    return this.getSongs({ recent: true, limit });
  }

  /**
   * Get most played
   */
  async getMostPlayed(limit = 10) {
    return this.getSongs({ mostPlayed: true, limit });
  }

  /**
   * Get recently added
   */
  async getRecentlyAdded(limit = 10) {
    return this.getSongs({ recentlyAdded: true, limit });
  }

  /**
   * Get a single playlist
   */
  async getPlaylist(id) {
    return storage.get('playlists', id);
  }

  /**
   * Get all playlists
   */
  async getAllPlaylists() {
    const playlists = await storage.getAllPlaylists();
    return playlists.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
  }

  /**
   * Create a new playlist
   */
  async createPlaylist(name, description = '') {
    const id = `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const playlist = {
      id,
      name,
      description,
      songs: [],
      coverArt: null,
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await storage.savePlaylist(playlist);
    return playlist;
  }

  /**
   * Update a playlist
   */
  async updatePlaylist(id, updates) {
    const playlist = await this.getPlaylist(id);
    if (!playlist) return null;

    const updated = { ...playlist, ...updates, updatedAt: Date.now() };
    await storage.savePlaylist(updated);
    return updated;
  }

  /**
   * Delete a playlist
   */
  async deletePlaylist(id) {
    return storage.delete('playlists', id);
  }

  /**
   * Add song to playlist
   */
  async addToPlaylist(playlistId, songId) {
    const playlist = await this.getPlaylist(playlistId);
    if (!playlist) return null;

    if (!playlist.songs.includes(songId)) {
      playlist.songs.push(songId);
      playlist.updatedAt = Date.now();
      await storage.savePlaylist(playlist);
    }
    return playlist;
  }

  /**
   * Remove song from playlist
   */
  async removeFromPlaylist(playlistId, songId) {
    const playlist = await this.getPlaylist(playlistId);
    if (!playlist) return null;

    playlist.songs = playlist.songs.filter(id => id !== songId);
    playlist.updatedAt = Date.now();
    await storage.savePlaylist(playlist);
    return playlist;
  }

  /**
   * Reorder playlist songs
   */
  async reorderPlaylist(playlistId, songIds) {
    return this.updatePlaylist(playlistId, { songs: songIds });
  }

  /**
   * Toggle favorite
   */
  async toggleFavorite(songId) {
    const song = await storage.getSong(songId);
    if (!song) return null;

    song.isFavorite = !song.isFavorite;
    song.updatedAt = Date.now();
    await storage.saveSong(song);
    return song;
  }

  /**
   * Increment play count
   */
  async incrementPlayCount(songId) {
    const song = await storage.getSong(songId);
    if (!song) return;

    song.playCount = (song.playCount || 0) + 1;
    song.lastPlayed = Date.now();
    await storage.saveSong(song);
  }

  /**
   * Search across all content
   */
  async globalSearch(query) {
    if (!query || query.trim().length < 2) {
      return { songs: [], albums: [], artists: [], playlists: [], genres: [] };
    }

    const q = query.toLowerCase().trim();
    const [songs, albums, artists, playlists, genres] = await Promise.all([
      this.getSongs({ search: q }),
      this.getAlbums().then(a => a.filter(al => 
        al.name.toLowerCase().includes(q) || al.artist.toLowerCase().includes(q)
      )),
      this.getArtists().then(a => a.filter(ar => ar.name.toLowerCase().includes(q))),
      this.getAllPlaylists().then(p => p.filter(pl => pl.name.toLowerCase().includes(q))),
      this.getGenres().then(g => g.filter(gr => gr.name.toLowerCase().includes(q)))
    ]);

    return { songs, albums, artists, playlists, genres };
  }

  /**
   * Get recommendations based on listening history
   */
  async getRecommendations() {
    const recentlyPlayed = await this.getRecentlyPlayed(20);
    const mostPlayed = await this.getMostPlayed(20);
    const allSongs = await storage.getAllSongs();

    // Get top genres and artists from history
    const genreCounts = {};
    const artistCounts = {};

    for (const song of [...recentlyPlayed, ...mostPlayed]) {
      if (song.genre) genreCounts[song.genre] = (genreCounts[song.genre] || 0) + 1;
      if (song.artist) artistCounts[song.artist] = (artistCounts[song.artist] || 0) + 1;
    }

    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g]) => g);

    const topArtists = Object.entries(artistCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([a]) => a);

    // Find songs matching top genres/artists that haven't been played recently
    const playedIds = new Set(recentlyPlayed.map(s => s.id));

    const recommendations = allSongs
      .filter(s => !playedIds.has(s.id))
      .filter(s => topGenres.includes(s.genre) || topArtists.includes(s.artist))
      .sort(() => Math.random() - 0.5)
      .slice(0, 15);

    return recommendations;
  }

  /**
   * Get duplicate songs (by title + artist)
   */
  async findDuplicates() {
    const songs = await storage.getAllSongs();
    const groups = {};

    for (const song of songs) {
      const key = `${(song.title || '').toLowerCase().trim()}|${(song.artist || '').toLowerCase().trim()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(song);
    }

    return Object.values(groups).filter(g => g.length > 1);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
const db = new DatabaseManager();

// Module: db
