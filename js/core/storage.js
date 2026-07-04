/**
 * Melody PWA - Storage Manager
 * LocalStorage for settings, IndexedDB for music data
 * @version 1.0.0
 */

const DB_NAME = 'MelodyDB';
const DB_VERSION = 1;

class StorageManager {
  constructor() {
    this.db = null;
    this.dbReady = this.initDB();
  }

  /**
   * Initialize IndexedDB
   */
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Songs store
        if (!db.objectStoreNames.contains('songs')) {
          const songStore = db.createObjectStore('songs', { keyPath: 'id' });
          songStore.createIndex('title', 'title', { unique: false });
          songStore.createIndex('artist', 'artist', { unique: false });
          songStore.createIndex('album', 'album', { unique: false });
          songStore.createIndex('genre', 'genre', { unique: false });
          songStore.createIndex('playCount', 'playCount', { unique: false });
          songStore.createIndex('dateAdded', 'dateAdded', { unique: false });
        }

        // Albums store
        if (!db.objectStoreNames.contains('albums')) {
          const albumStore = db.createObjectStore('albums', { keyPath: 'id' });
          albumStore.createIndex('name', 'name', { unique: false });
          albumStore.createIndex('artist', 'artist', { unique: false });
        }

        // Artists store
        if (!db.objectStoreNames.contains('artists')) {
          const artistStore = db.createObjectStore('artists', { keyPath: 'id' });
          artistStore.createIndex('name', 'name', { unique: false });
        }

        // Playlists store
        if (!db.objectStoreNames.contains('playlists')) {
          const playlistStore = db.createObjectStore('playlists', { keyPath: 'id' });
          playlistStore.createIndex('name', 'name', { unique: false });
          playlistStore.createIndex('pinned', 'pinned', { unique: false });
        }

        // Cover art store (blobs)
        if (!db.objectStoreNames.contains('coverArt')) {
          db.createObjectStore('coverArt', { keyPath: 'id' });
        }

        // Lyrics store
        if (!db.objectStoreNames.contains('lyrics')) {
          db.createObjectStore('lyrics', { keyPath: 'songId' });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Playback state
        if (!db.objectStoreNames.contains('playbackState')) {
          db.createObjectStore('playbackState', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Wait for DB to be ready
   */
  async ready() {
    return this.dbReady;
  }

  /**
   * Generic get from store
   */
  async get(storeName, key) {
    await this.ready();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic get all from store
   */
  async getAll(storeName) {
    await this.ready();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic put (insert or update)
   */
  async put(storeName, data) {
    await this.ready();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic delete
   */
  async delete(storeName, key) {
    await this.ready();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all by index
   */
  async getByIndex(storeName, indexName, value) {
    await this.ready();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear store
   */
  async clear(storeName) {
    await this.ready();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ═══════════════════════════════════════
  // LOCALSTORAGE WRAPPERS
  // ═══════════════════════════════════════

  getLocal(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(`melody_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  setLocal(key, value) {
    try {
      localStorage.setItem(`melody_${key}`, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[Melody Storage] localStorage set failed:', e);
      return false;
    }
  }

  removeLocal(key) {
    localStorage.removeItem(`melody_${key}`);
  }

  // ═══════════════════════════════════════
  // CONVENIENCE METHODS
  // ═══════════════════════════════════════

  async saveSong(song) {
    return this.put('songs', song);
  }

  async getSong(id) {
    return this.get('songs', id);
  }

  async getAllSongs() {
    return this.getAll('songs');
  }

  async deleteSong(id) {
    await this.delete('songs', id);
    await this.delete('lyrics', id);
    await this.delete('coverArt', id);
  }

  async savePlaylist(playlist) {
    return this.put('playlists', playlist);
  }

  async getAllPlaylists() {
    return this.getAll('playlists');
  }

  async saveCoverArt(id, blob) {
    return this.put('coverArt', { id, blob, timestamp: Date.now() });
  }

  async getCoverArt(id) {
    const result = await this.get('coverArt', id);
    return result?.blob || null;
  }

  async saveLyrics(songId, lyrics) {
    return this.put('lyrics', { songId, lyrics, timestamp: Date.now() });
  }

  async getLyrics(songId) {
    const result = await this.get('lyrics', songId);
    return result?.lyrics || null;
  }

  async saveSetting(key, value) {
    return this.put('settings', { key, value, timestamp: Date.now() });
  }

  async getSetting(key) {
    const result = await this.get('settings', key);
    return result?.value;
  }

  async savePlaybackState(state) {
    return this.put('playbackState', { key: 'current', ...state, timestamp: Date.now() });
  }

  async getPlaybackState() {
    return this.get('playbackState', 'current');
  }

  /**
   * Export all data for backup
   */
  async exportData() {
    const data = {
      version: DB_VERSION,
      timestamp: Date.now(),
      songs: await this.getAll('songs'),
      playlists: await this.getAll('playlists'),
      settings: await this.getAll('settings'),
      localStorage: {}
    };

    // Collect localStorage items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('melody_')) {
        data.localStorage[key] = this.getLocal(key.replace('melody_', ''));
      }
    }

    return data;
  }

  /**
   * Import data from backup
   */
  async importData(data) {
    if (!data.songs || !data.playlists) {
      throw new Error('Invalid backup file');
    }

    // Import songs
    for (const song of data.songs) {
      await this.saveSong(song);
    }

    // Import playlists
    for (const playlist of data.playlists) {
      await this.savePlaylist(playlist);
    }

    // Import settings
    if (data.settings) {
      for (const setting of data.settings) {
        await this.saveSetting(setting.key, setting.value);
      }
    }

    // Import localStorage
    if (data.localStorage) {
      for (const [key, value] of Object.entries(data.localStorage)) {
        this.setLocal(key, value);
      }
    }

    return true;
  }

  /**
   * Get storage usage info
   */
  async getStorageInfo() {
    const songs = await this.getAllSongs();
    const totalSize = songs.reduce((sum, song) => sum + (song.size || 0), 0);
    const songCount = songs.length;

    return {
      songCount,
      totalSize,
      totalSizeFormatted: this.formatBytes(totalSize),
      quota: navigator.storage?.estimate ? await navigator.storage.estimate() : null
    };
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Singleton instance
const storage = new StorageManager();

// Module: storage
