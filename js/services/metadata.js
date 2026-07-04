/**
 * Melody PWA - Metadata Service
 * Parse and extract metadata from audio files
 * Uses jsmediatags for browser-based ID3 parsing
 * @version 1.0.0
 */


// Dynamically load jsmediatags
let jsmediatags = null;

async function loadJsmediatags() {
  if (jsmediatags) return jsmediatags;

  try {
    // Try to load from CDN
    if (typeof window.jsmediatags !== 'undefined') {
      jsmediatags = window.jsmediatags;
      return jsmediatags;
    }

    // Load script dynamically
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsmediatags/3.9.5/jsmediatags.min.js';
      script.onload = () => {
        jsmediatags = window.jsmediatags;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return jsmediatags;
  } catch (err) {
    console.warn('[Melody Metadata] jsmediatags not available, using fallback');
    return null;
  }
}

class MetadataService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Extract metadata from an audio file
   */
  async extractMetadata(file) {
    const tags = await this.readTags(file);
    const cleaned = cleanFilename(file.name);

    const metadata = {
      id: this.generateSongId(file),
      title: tags.title || cleaned.title || this.removeExtension(file.name),
      artist: tags.artist || cleaned.artist || 'Unknown Artist',
      album: tags.album || '',
      albumArtist: tags.albumArtist || tags.artist || cleaned.artist || '',
      genre: tags.genre || '',
      composer: tags.composer || '',
      year: tags.year || tags.date || '',
      trackNumber: tags.track ? parseInt(tags.track, 10) : null,
      discNumber: tags.disc ? parseInt(tags.disc, 10) : null,
      duration: tags.duration || 0,
      bitrate: tags.bitrate || 0,
      sampleRate: tags.sampleRate || 0,
      format: this.getFormat(file.name),
      size: file.size,
      dateAdded: Date.now(),
      playCount: 0,
      lastPlayed: null,
      isFavorite: false,
      folderPath: file.webkitRelativePath || '',
      audioUrl: URL.createObjectURL(file),
      coverArt: null,
      lyrics: tags.lyrics || '',
      comments: tags.comment || ''
    };

    // Extract cover art if available
    if (tags.picture) {
      metadata.coverArt = await this.pictureToDataURL(tags.picture);
      // Also save to IndexedDB
      await this.saveCoverArt(metadata.id, tags.picture);
    }

    return metadata;
  }

  /**
   * Read ID3 tags using jsmediatags
   */
  async readTags(file) {
    const jmt = await loadJsmediatags();
    if (!jmt) return this.fallbackTags(file);

    return new Promise((resolve) => {
      jmt.read(file, {
        onSuccess: (tag) => {
          const tags = tag.tags || {};
          resolve({
            title: tags.title,
            artist: tags.artist,
            album: tags.album,
            albumArtist: tags.albumartist,
            genre: tags.genre,
            composer: tags.composer,
            year: tags.year,
            track: tags.track,
            disc: tags.disc,
            picture: tags.picture,
            lyrics: tags.lyrics,
            comment: tags.comment,
            duration: tags.duration
          });
        },
        onError: () => {
          resolve(this.fallbackTags(file));
        }
      });
    });
  }

  /**
   * Fallback when jsmediatags fails
   */
  fallbackTags(file) {
    return {
      title: null,
      artist: null,
      album: null,
      albumArtist: null,
      genre: null,
      composer: null,
      year: null,
      track: null,
      disc: null,
      picture: null,
      lyrics: null,
      comment: null,
      duration: null
    };
  }

  /**
   * Convert picture data to Data URL
   */
  pictureToDataURL(picture) {
    if (!picture || !picture.data) return null;

    const format = picture.format || 'image/jpeg';
    const bytes = new Uint8Array(picture.data);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return `data:${format};base64,${base64}`;
  }

  /**
   * Save cover art to IndexedDB
   */
  async saveCoverArt(songId, picture) {
    if (!picture || !picture.data) return;

    try {
      const format = picture.format || 'image/jpeg';
      const bytes = new Uint8Array(picture.data);
      const blob = new Blob([bytes], { type: format });
      await storage.saveCoverArt(songId, blob);
    } catch (err) {
      console.warn('[Melody Metadata] Failed to save cover art:', err);
    }
  }

  /**
   * Get cover art from IndexedDB
   */
  async getCoverArt(songId) {
    const blob = await storage.getCoverArt(songId);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }

  /**
   * Generate unique song ID
   */
  generateSongId(file) {
    // Use file name + size + last modified as unique identifier
    const hash = btoa(`${file.name}_${file.size}_${file.lastModified}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    return `song_${hash}_${Date.now()}`;
  }

  /**
   * Remove file extension
   */
  removeExtension(filename) {
    return filename.replace(/\.[^/.]+$/, '');
  }

  /**
   * Get audio format from filename
   */
  getFormat(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const formats = {
      mp3: 'MP3',
      flac: 'FLAC',
      m4a: 'M4A',
      aac: 'AAC',
      wav: 'WAV',
      ogg: 'OGG',
      wma: 'WMA'
    };
    return formats[ext] || ext.toUpperCase();
  }

  /**
   * Get MIME type from format
   */
  getMimeType(format) {
    const types = {
      mp3: 'audio/mpeg',
      flac: 'audio/flac',
      m4a: 'audio/mp4',
      aac: 'audio/aac',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      wma: 'audio/x-ms-wma'
    };
    return types[format.toLowerCase()] || 'audio/mpeg';
  }

  /**
   * Update metadata for a song
   */
  async updateMetadata(songId, updates) {
    const song = await storage.getSong(songId);
    if (!song) return null;

    const updated = { ...song, ...updates, updatedAt: Date.now() };
    await storage.saveSong(updated);
    return updated;
  }

  /**
   * Batch extract metadata from multiple files
   */
  async batchExtract(files, onProgress) {
    const results = [];
    const total = files.length;

    for (let i = 0; i < total; i++) {
      try {
        const metadata = await this.extractMetadata(files[i]);
        results.push(metadata);

        if (onProgress) {
          onProgress({
            current: i + 1,
            total,
            percent: Math.round(((i + 1) / total) * 100),
            currentFile: files[i].name
          });
        }
      } catch (err) {
        console.warn(`[Melody Metadata] Failed to extract metadata for ${files[i].name}:`, err);

        // Still add with basic info
        const cleaned = cleanFilename(files[i].name);
        results.push({
          id: this.generateSongId(files[i]),
          title: cleaned.title || this.removeExtension(files[i].name),
          artist: cleaned.artist || 'Unknown Artist',
          album: '',
          format: this.getFormat(files[i].name),
          size: files[i].size,
          dateAdded: Date.now(),
          audioUrl: URL.createObjectURL(files[i]),
          folderPath: files[i].webkitRelativePath || '',
          error: err.message
        });
      }
    }

    return results;
  }

  /**
   * Search for metadata online (MusicBrainz, etc.)
   */
  async searchOnlineMetadata(title, artist, album) {
    // This is a placeholder for online metadata lookup
    // In a real implementation, this would call MusicBrainz API, Last.fm, etc.
    console.log('[Melody Metadata] Online metadata search not yet implemented');
    return null;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
const metadataService = new MetadataService();

// Module: metadataService
