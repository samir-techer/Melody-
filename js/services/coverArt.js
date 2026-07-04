/**
 * Melody PWA - Cover Art Service
 * Fetches and caches high-resolution album artwork
 * @version 1.0.0
 */


const COVER_ART_SOURCES = {
  musicbrainz: 'https://coverartarchive.org/release/{mbid}/front-500',
  deezer: 'https://api.deezer.com/search?q=artist:"{artist}" album:"{album}"',
  lastfm: 'https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=YOUR_API_KEY&artist={artist}&album={album}&format=json'
};

class CoverArtService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  /**
   * Get cover art for a song
   * Priority: 1. Embedded, 2. Cached, 3. Online search, 4. Default
   */
  async getCoverArt(song) {
    if (!song) return this.getDefaultCover();

    const cacheKey = `${song.artist || ''}_${song.album || ''}_${song.title || ''}`;

    // Check memory cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Check IndexedDB
    const cached = await storage.getCoverArt(song.id);
    if (cached) {
      const url = URL.createObjectURL(cached);
      this.cache.set(cacheKey, url);
      return url;
    }

    // Use embedded cover art
    if (song.coverArt) {
      this.cache.set(cacheKey, song.coverArt);
      return song.coverArt;
    }

    // Try to fetch online (if online)
    if (navigator.onLine && song.artist && song.album) {
      try {
        const onlineUrl = await this.fetchOnlineCoverArt(song.artist, song.album);
        if (onlineUrl) {
          this.cache.set(cacheKey, onlineUrl);
          return onlineUrl;
        }
      } catch (err) {
        console.warn('[Melody CoverArt] Online fetch failed:', err);
      }
    }

    // Generate placeholder
    const placeholder = this.generatePlaceholder(song);
    this.cache.set(cacheKey, placeholder);
    return placeholder;
  }

  /**
   * Fetch cover art from online sources
   */
  async fetchOnlineCoverArt(artist, album) {
    // Try MusicBrainz -> Cover Art Archive
    try {
      const mbUrl = `https://musicbrainz.org/ws/2/release/?query=artist:${encodeURIComponent(artist)}%20AND%20release:${encodeURIComponent(album)}&fmt=json`;
      const mbResponse = await fetch(mbUrl, {
        headers: { 'User-Agent': 'MelodyMusicPlayer/1.0' }
      });

      if (mbResponse.ok) {
        const mbData = await mbResponse.json();
        if (mbData.releases && mbData.releases.length > 0) {
          const releaseId = mbData.releases[0].id;
          const coverUrl = `https://coverartarchive.org/release/${releaseId}/front-500`;

          // Verify the image exists
          const imgCheck = await fetch(coverUrl, { method: 'HEAD' });
          if (imgCheck.ok) {
            return coverUrl;
          }
        }
      }
    } catch (err) {
      // Silent fail
    }

    // Try Deezer
    try {
      const dzUrl = `https://api.deezer.com/search/album?q=artist:"${encodeURIComponent(artist)}" album:"${encodeURIComponent(album)}"`;
      const dzResponse = await fetch(dzUrl);

      if (dzResponse.ok) {
        const dzData = await dzResponse.json();
        if (dzData.data && dzData.data.length > 0 && dzData.data[0].cover_big) {
          return dzData.data[0].cover_big;
        }
      }
    } catch (err) {
      // Silent fail
    }

    return null;
  }

  /**
   * Generate a placeholder cover with initials
   */
  generatePlaceholder(song) {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');

    // Background - warm tone based on hash of title
    const hash = this.simpleHash(song.title || song.artist || 'M');
    const hue = (hash % 30) + 25; // Warm colors: 25-55
    const saturation = 15 + (hash % 10);
    const lightness = 85 + (hash % 10);

    ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    ctx.fillRect(0, 0, 500, 500);

    // Subtle pattern
    ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 500; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(500, i);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 500);
      ctx.stroke();
    }

    // Center circle
    ctx.fillStyle = `hsl(${hue}, ${saturation + 5}%, ${lightness - 15}%)`;
    ctx.beginPath();
    ctx.arc(250, 250, 120, 0, Math.PI * 2);
    ctx.fill();

    // Initials
    const initials = this.getInitials(song.title || song.artist || 'M');
    ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness - 35}%)`;
    ctx.font = 'bold 120px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, 250, 250);

    return canvas.toDataURL('image/png');
  }

  /**
   * Get default cover art SVG
   */
  getDefaultCover() {
    return '/assets/images/default-cover.svg';
  }

  /**
   * Get initials from string
   */
  getInitials(str) {
    if (!str) return 'M';
    const words = str.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Simple hash function
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Preload cover art for a list of songs
   */
  async preloadCovers(songs) {
    const promises = songs.map(song => this.getCoverArt(song));
    return Promise.allSettled(promises);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
const coverArtService = new CoverArtService();

// Module: coverArtService
