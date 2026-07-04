/**
 * Melody PWA - Media Session Service
 * Integrates with Media Session API for lock screen & Bluetooth controls
 * @version 1.0.0
 */


class MediaSessionService {
  constructor() {
    this.initialized = false;
  }

  init() {
    if (!('mediaSession' in navigator)) {
      console.warn('[Melody MediaSession] Media Session API not supported');
      return;
    }

    this.initialized = true;
    this.setupActionHandlers();

    // Subscribe to state changes
    state.subscribe('currentTrack', (track) => {
      if (track) this.updateMetadata(track);
    });

    state.subscribe('isPlaying', (isPlaying) => {
      this.updatePlaybackState(isPlaying);
    });
  }

  /**
   * Setup Media Session action handlers
   */
  setupActionHandlers() {
    const actions = {
      play: () => audioService.play(),
      pause: () => audioService.pause(),
      previoustrack: () => audioService.previous(),
      nexttrack: () => audioService.next(),
      seekbackward: (details) => {
        const skipTime = details.seekOffset || 10;
        audioService.skipBackward(skipTime);
      },
      seekforward: (details) => {
        const skipTime = details.seekOffset || 10;
        audioService.skipForward(skipTime);
      },
      seekto: (details) => {
        if (details.seekTime) {
          audioService.seek(details.seekTime);
        }
      },
      stop: () => audioService.pause()
    };

    for (const [action, handler] of Object.entries(actions)) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (err) {
        console.warn(`[Melody MediaSession] Action "${action}" not supported:`, err);
      }
    }
  }

  /**
   * Update media metadata
   */
  updateMetadata(track) {
    if (!this.initialized) return;

    const artwork = [];

    // Add cover art if available
    if (track.coverArt) {
      // Provide multiple sizes for different contexts
      artwork.push(
        { src: track.coverArt, sizes: '96x96', type: 'image/jpeg' },
        { src: track.coverArt, sizes: '128x128', type: 'image/jpeg' },
        { src: track.coverArt, sizes: '192x192', type: 'image/jpeg' },
        { src: track.coverArt, sizes: '256x256', type: 'image/jpeg' },
        { src: track.coverArt, sizes: '384x384', type: 'image/jpeg' },
        { src: track.coverArt, sizes: '512x512', type: 'image/jpeg' }
      );
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title || 'Unknown Title',
      artist: track.artist || 'Unknown Artist',
      album: track.album || '',
      artwork: artwork.length > 0 ? artwork : undefined
    });

    // Update position state for seek bar
    this.updatePositionState();
  }

  /**
   * Update playback state
   */
  updatePlaybackState(isPlaying) {
    if (!this.initialized) return;

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    this.updatePositionState();
  }

  /**
   * Update position state for seek bar
   */
  updatePositionState() {
    if (!this.initialized) return;

    const audio = audioService.getAudioElement();
    if (!audio) return;

    try {
      navigator.mediaSession.setPositionState({
        duration: audio.duration || 0,
        playbackRate: audio.playbackRate || 1,
        position: audio.currentTime || 0
      });
    } catch (err) {
      // Some browsers don't support this
    }
  }

  /**
   * Clear metadata
   */
  clear() {
    if (!this.initialized) return;
    navigator.mediaSession.metadata = null;
  }
}

// Singleton instance
const mediaSession = new MediaSessionService();

// Module: mediaSession
