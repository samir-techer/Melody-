/**
 * Melody PWA - State Manager
 * Central reactive state with pub/sub pattern
 * @version 1.0.0
 */

class StateManager {
  constructor() {
    this.state = {
      // App lifecycle
      isFirstLaunch: true,
      hasSeenGreeting: false,
      nickname: '',

      // Audio
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      playbackSpeed: 1.0,
      isMuted: false,

      // Playback modes
      shuffle: false,
      repeatMode: 'off', // 'off' | 'one' | 'all'

      // Queue
      queue: [],
      queueIndex: -1,
      previousQueue: [],

      // Library
      songs: [],
      albums: [],
      artists: [],
      playlists: [],
      folders: [],
      genres: [],
      favorites: new Set(),

      // Recently played / added
      recentlyPlayed: [],
      recentlyAdded: [],
      mostPlayed: [],

      // Search
      searchQuery: '',
      searchResults: null,
      searchHistory: [],

      // UI
      currentPage: 'home',
      isPlayerOpen: false,
      isLyricsOpen: false,
      isQueueOpen: false,
      isMiniPlayerVisible: false,
      isMenuOpen: false,

      // Settings
      theme: 'light',
      language: 'en',
      notifications: true,
      crossfade: false,
      gapless: false,
      audioQuality: 'high',
      sleepTimer: null,

      // Equalizer
      eqEnabled: false,
      eqPreset: 'flat',
      eqBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

      // Import
      isImporting: false,
      importProgress: 0,

      // Loading
      isLoading: false,
    };

    this.listeners = {};
    this.batch = new Set();
    this.isBatching = false;
  }

  /**
   * Get a state value by path (dot notation)
   */
  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.state);
  }

  /**
   * Set a state value and notify listeners
   */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, this.state);

    const oldValue = target[lastKey];
    if (oldValue === value) return;

    target[lastKey] = value;

    if (this.isBatching) {
      this.batch.add(path);
    } else {
      this._notify(path, value, oldValue);
    }
  }

  /**
   * Update multiple state values at once
   */
  batchUpdate(updates) {
    this.isBatching = true;
    for (const [path, value] of Object.entries(updates)) {
      this.set(path, value);
    }
    this.isBatching = false;

    // Notify all batched paths
    for (const path of this.batch) {
      this._notify(path, this.get(path));
    }
    this.batch.clear();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(path, callback) {
    if (!this.listeners[path]) {
      this.listeners[path] = new Set();
    }
    this.listeners[path].add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[path].delete(callback);
    };
  }

  /**
   * Subscribe to multiple paths
   */
  subscribeMany(paths, callback) {
    const unsubscribes = paths.map(path => this.subscribe(path, callback));
    return () => unsubscribes.forEach(unsub => unsub());
  }

  /**
   * Internal notify
   */
  _notify(path, newValue, oldValue) {
    // Notify exact path listeners
    if (this.listeners[path]) {
      this.listeners[path].forEach(cb => cb(newValue, oldValue, path));
    }

    // Notify wildcard listeners (e.g., 'songs.*')
    const parts = path.split('.');
    for (let i = 1; i < parts.length; i++) {
      const parentPath = parts.slice(0, i).join('.') + '.*';
      if (this.listeners[parentPath]) {
        this.listeners[parentPath].forEach(cb => cb(newValue, oldValue, path));
      }
    }

    // Notify root wildcard
    if (this.listeners['*']) {
      this.listeners['*'].forEach(cb => cb(newValue, oldValue, path));
    }
  }

  /**
   * Toggle a boolean state value
   */
  toggle(path) {
    this.set(path, !this.get(path));
  }

  /**
   * Push to an array
   */
  push(path, value) {
    const arr = this.get(path) || [];
    this.set(path, [...arr, value]);
  }

  /**
   * Remove from an array by predicate
   */
  remove(path, predicate) {
    const arr = this.get(path) || [];
    this.set(path, arr.filter(item => !predicate(item)));
  }

  /**
   * Add to Set
   */
  addToSet(path, value) {
    const set = this.get(path) || new Set();
    const newSet = new Set(set);
    newSet.add(value);
    this.set(path, newSet);
  }

  /**
   * Remove from Set
   */
  removeFromSet(path, value) {
    const set = this.get(path) || new Set();
    const newSet = new Set(set);
    newSet.delete(value);
    this.set(path, newSet);
  }

  /**
   * Get entire state (for debugging)
   */
  getState() {
    return JSON.parse(JSON.stringify(this.state, (key, value) => {
      if (value instanceof Set) return Array.from(value);
      return value;
    }));
  }
}

// Singleton instance
const state = new StateManager();

// Module: state
