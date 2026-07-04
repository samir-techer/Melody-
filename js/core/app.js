/**
 * Melody PWA - Main Application
 * Bootstrap, service worker registration, global event handling
 * @version 1.0.0
 */

// All modules are loaded via script tags in index.html
// This file acts as the orchestrator

class MelodyApp {
  constructor() {
    this.initialized = false;
    this.version = '1.0.0';
  }

  async init() {
    if (this.initialized) return;
    console.log('Melody v' + this.version + ' initializing...');

    // Register service worker
    await this.registerServiceWorker();

    // Initialize storage
    await storage.ready();

    // Load settings
    await this.loadSettings();

    // Check first launch
    await this.checkFirstLaunch();

    // Initialize router
    router.init();

    // Initialize UI modules
    firstLaunch.init();
    greeting.init();
    home.init();
    player.init();
    miniPlayer.init();
    library.init();
    searchUI.init();
    settings.init();
    playlist.init();
    favorites.init();
    queue.init();
    equalizer.init();

    // Initialize audio service
    audioService.init();

    // Initialize media session
    mediaSession.init();

    // Setup global events
    this.setupGlobalEvents();

    // Update greeting based on time
    this.updateTimeBasedGreeting();

    this.initialized = true;
    console.log('Melody initialized successfully!');
  }

  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }
    try {
      const registration = await navigator.serviceWorker.register('sw.js');
      console.log('Service Worker registered:', registration.scope);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  async loadSettings() {
    const settings = await storage.getSetting('appSettings');
    if (settings) {
      state.batchUpdate({
        'theme': settings.theme || 'light',
        'language': settings.language || 'en',
        'notifications': settings.notifications !== false,
        'crossfade': settings.crossfade || false,
        'gapless': settings.gapless || false,
        'audioQuality': settings.audioQuality || 'high',
        'volume': settings.volume ?? 0.8,
        'playbackSpeed': settings.playbackSpeed || 1.0,
        'nickname': settings.nickname || ''
      });
    }
    const favoritesData = await storage.getSetting('favorites');
    if (favoritesData) {
      state.set('favorites', new Set(favoritesData));
    }
  }

  async checkFirstLaunch() {
    const nickname = localStorage.getItem('melody_nickname');
    const hasSeenGreeting = localStorage.getItem('melody_hasSeenGreeting');
    state.set('isFirstLaunch', !nickname);
    state.set('hasSeenGreeting', !!hasSeenGreeting);
    state.set('nickname', nickname || '');
  }

  setupGlobalEvents() {
    document.addEventListener('visibilitychange', () => {});
    window.addEventListener('online', () => this.showToast('Back online', 'success'));
    window.addEventListener('offline', () => this.showToast('Offline mode', 'warning'));
    window.addEventListener('beforeunload', () => this.saveState());

    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.code) {
        case 'Space': e.preventDefault(); audioService.togglePlayPause(); break;
        case 'ArrowRight': if (e.ctrlKey || e.metaKey) { e.preventDefault(); audioService.next(); } break;
        case 'ArrowLeft': if (e.ctrlKey || e.metaKey) { e.preventDefault(); audioService.previous(); } break;
        case 'ArrowUp': e.preventDefault(); audioService.adjustVolume(0.05); break;
        case 'ArrowDown': e.preventDefault(); audioService.adjustVolume(-0.05); break;
      }
    });

    let scrollTimeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const header = document.querySelector('.app-header');
        if (header) header.classList.toggle('scrolled', window.scrollY > 10);
      }, 10);
    }, { passive: true });
  }

  updateTimeBasedGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good Morning', icon = '☀️';
    if (hour >= 12 && hour < 17) { greeting = 'Good Afternoon'; }
    else if (hour >= 17 && hour < 21) { greeting = 'Good Evening'; icon = '🌙'; }
    else if (hour >= 21 || hour < 5) { greeting = 'Good Night'; icon = '🌌'; }
    state.set('timeGreeting', { text: greeting, icon });
  }

  async saveState() {
    const currentTrack = state.get('currentTrack');
    const currentTime = state.get('currentTime');
    const queue = state.get('queue');
    const queueIndex = state.get('queueIndex');
    if (currentTrack) {
      await storage.savePlaybackState({ track: currentTrack, position: currentTime, queue, queueIndex, timestamp: Date.now() });
    }
    await storage.saveSetting('appSettings', {
      theme: state.get('theme'), language: state.get('language'), notifications: state.get('notifications'),
      crossfade: state.get('crossfade'), gapless: state.get('gapless'), audioQuality: state.get('audioQuality'),
      volume: state.get('volume'), playbackSpeed: state.get('playbackSpeed'), nickname: state.get('nickname')
    });
    const favorites = state.get('favorites');
    if (favorites instanceof Set) await storage.saveSetting('favorites', Array.from(favorites));
  }

  showToast(message, type) {
    let container = document.querySelector('.toast-container');
    if (!container) { container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); }
    const toast = document.createElement('div');
    toast.className = 'toast toast--' + type + ' anim-fade-in-up';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'fadeOut 300ms forwards'; setTimeout(() => toast.remove(), 300); }, 3000);
  }

  getVersion() { return this.version; }
}

const app = new MelodyApp();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}
