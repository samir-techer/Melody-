/**
 * Melody PWA - Audio Service
 * Core audio playback engine with gapless, crossfade, speed control
 * @version 1.0.0
 */


class AudioService {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'metadata';
    this.audio.crossOrigin = 'anonymous';

    // Secondary audio for crossfade
    this.audioB = new Audio();
    this.audioB.preload = 'metadata';

    this.currentAudio = this.audio;
    this.crossfadeDuration = 2; // seconds
    this.isCrossfading = false;

    // Audio context for advanced features
    this.audioContext = null;
    this.sourceNode = null;
    this.gainNode = null;
    this.analyser = null;

    // Sleep timer
    this.sleepTimerId = null;

    this.setupEventListeners();
  }

  init() {
    // Initialize audio context on first user interaction
    const initAudioContext = () => {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.setupAudioNodes();
      }
      document.removeEventListener('click', initAudioContext);
      document.removeEventListener('touchstart', initAudioContext);
    };

    document.addEventListener('click', initAudioContext, { once: true });
    document.addEventListener('touchstart', initAudioContext, { once: true });

    // Subscribe to state changes
    state.subscribe('volume', (vol) => this.setVolume(vol));
    state.subscribe('playbackSpeed', (speed) => this.setPlaybackSpeed(speed));
    state.subscribe('isMuted', (muted) => this.setMute(muted));
  }

  setupAudioNodes() {
    if (!this.audioContext) return;

    this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
    this.gainNode = this.audioContext.createGain();
    this.analyser = this.audioContext.createAnalyser();

    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    this.sourceNode.connect(this.gainNode);
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  setupEventListeners() {
    // Time update
    this.audio.addEventListener('timeupdate', () => {
      state.set('currentTime', this.audio.currentTime);

      // Check sleep timer
      if (this.sleepTimerId) {
        // Timer handled separately
      }
    });

    // Loaded metadata
    this.audio.addEventListener('loadedmetadata', () => {
      state.set('duration', this.audio.duration);
    });

    // Playback ended
    this.audio.addEventListener('ended', () => this.onTrackEnded());

    // Error handling
    this.audio.addEventListener('error', (e) => {
      console.error('[Melody Audio] Playback error:', e);
      state.set('isPlaying', false);
    });

    // Can play
    this.audio.addEventListener('canplay', () => {
      // Ready to play
    });
  }

  /**
   * Load and play a track
   */
  async loadTrack(track) {
    if (!track || !track.audioUrl) {
      console.error('[Melody Audio] Invalid track');
      return;
    }

    // Resume audio context if suspended
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Store previous track for crossfade
    const previousTrack = state.get('currentTrack');

    state.set('currentTrack', track);
    state.set('currentTime', 0);
    state.set('duration', track.duration || 0);

    // Set source
    this.audio.src = track.audioUrl;
    this.audio.load();

    // Apply current settings
    this.audio.volume = state.get('isMuted') ? 0 : state.get('volume');
    this.audio.playbackRate = state.get('playbackSpeed') || 1.0;

    // Auto-play
    try {
      await this.audio.play();
      state.set('isPlaying', true);

      // Increment play count
      if (track.id) {
        storage.incrementPlayCount(track.id);
      }
    } catch (err) {
      console.warn('[Melody Audio] Auto-play prevented:', err);
      state.set('isPlaying', false);
    }
  }

  /**
   * Toggle play/pause
   */
  async togglePlayPause() {
    if (!state.get('currentTrack')) return;

    if (this.audio.paused) {
      // Resume audio context
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      await this.audio.play();
      state.set('isPlaying', true);
    } else {
      this.audio.pause();
      state.set('isPlaying', false);
    }
  }

  /**
   * Play
   */
  async play() {
    if (this.audio.paused) {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      await this.audio.play();
      state.set('isPlaying', true);
    }
  }

  /**
   * Pause
   */
  pause() {
    this.audio.pause();
    state.set('isPlaying', false);
  }

  /**
   * Seek to position
   */
  seek(time) {
    if (this.audio && !isNaN(time)) {
      this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration || 0));
      state.set('currentTime', this.audio.currentTime);
    }
  }

  /**
   * Skip forward
   */
  skipForward(seconds = 10) {
    this.seek(this.audio.currentTime + seconds);
  }

  /**
   * Skip backward
   */
  skipBackward(seconds = 10) {
    this.seek(this.audio.currentTime - seconds);
  }

  /**
   * Next track
   */
  next() {
    const queue = state.get('queue') || [];
    const currentIndex = state.get('queueIndex') || 0;
    const shuffle = state.get('shuffle');
    const repeatMode = state.get('repeatMode');

    if (repeatMode === 'one') {
      // Repeat current
      this.seek(0);
      this.play();
      return;
    }

    let nextIndex;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = currentIndex + 1;
    }

    if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        // End of queue
        this.pause();
        this.seek(0);
        return;
      }
    }

    state.set('queueIndex', nextIndex);
    const nextTrack = queue[nextIndex];
    if (nextTrack) {
      this.loadTrack(nextTrack);
    }
  }

  /**
   * Previous track
   */
  previous() {
    const queue = state.get('queue') || [];
    const currentIndex = state.get('queueIndex') || 0;

    // If more than 3 seconds in, restart current track
    if (this.audio.currentTime > 3) {
      this.seek(0);
      return;
    }

    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }

    state.set('queueIndex', prevIndex);
    const prevTrack = queue[prevIndex];
    if (prevTrack) {
      this.loadTrack(prevTrack);
    }
  }

  /**
   * On track ended
   */
  onTrackEnded() {
    const repeatMode = state.get('repeatMode');

    if (repeatMode === 'one') {
      this.seek(0);
      this.play();
      return;
    }

    this.next();
  }

  /**
   * Set volume
   */
  setVolume(volume) {
    const clamped = Math.max(0, Math.min(1, volume));
    this.audio.volume = clamped;
    if (this.gainNode) {
      this.gainNode.gain.value = clamped;
    }
    state.set('volume', clamped);

    if (clamped > 0 && state.get('isMuted')) {
      state.set('isMuted', false);
    }
  }

  /**
   * Adjust volume
   */
  adjustVolume(delta) {
    const current = state.get('volume') || 0.8;
    this.setVolume(current + delta);
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    const isMuted = !state.get('isMuted');
    state.set('isMuted', isMuted);
    this.audio.volume = isMuted ? 0 : (state.get('volume') || 0.8);
  }

  setMute(muted) {
    this.audio.volume = muted ? 0 : (state.get('volume') || 0.8);
  }

  /**
   * Set playback speed
   */
  setPlaybackSpeed(speed) {
    const clamped = Math.max(0.5, Math.min(2.0, speed));
    this.audio.playbackRate = clamped;
    state.set('playbackSpeed', clamped);
  }

  /**
   * Get frequency data for visualizer
   */
  getFrequencyData() {
    if (!this.analyser) return new Uint8Array(0);

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  /**
   * Get waveform data
   */
  getWaveformData() {
    if (!this.analyser) return new Uint8Array(0);

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  /**
   * Set sleep timer
   */
  setSleepTimer(minutes) {
    this.clearSleepTimer();

    if (minutes <= 0) return;

    const ms = minutes * 60 * 1000;
    this.sleepTimerId = setTimeout(() => {
      this.pause();
      state.set('sleepTimer', null);
    }, ms);

    state.set('sleepTimer', { endTime: Date.now() + ms });
  }

  /**
   * Clear sleep timer
   */
  clearSleepTimer() {
    if (this.sleepTimerId) {
      clearTimeout(this.sleepTimerId);
      this.sleepTimerId = null;
    }
    state.set('sleepTimer', null);
  }

  /**
   * Get current audio element
   */
  getAudioElement() {
    return this.audio;
  }

  /**
   * Get audio context
   */
  getAudioContext() {
    return this.audioContext;
  }
}

// Singleton instance
const audioService = new AudioService();

// Module: audioService
