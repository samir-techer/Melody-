/**
 * Melody PWA - Import Service
 * Handles file import, metadata extraction, duplicate detection
 * @version 1.0.0
 */


const SUPPORTED_FORMATS = ['.mp3', '.flac', '.m4a', '.aac', '.wav', '.ogg', '.wma'];

class ImportService {
  constructor() {
    this.isImporting = false;
  }

  /**
   * Check if file is supported
   */
  isSupported(file) {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    return SUPPORTED_FORMATS.includes(ext);
  }

  /**
   * Import files from file input
   */
  async importFiles(files, options = {}) {
    if (this.isImporting) return;

    this.isImporting = true;
    state.set('isImporting', true);
    state.set('importProgress', 0);

    try {
      // Filter supported files
      const supportedFiles = Array.from(files).filter(f => this.isSupported(f));

      if (supportedFiles.length === 0) {
        throw new Error('No supported audio files found');
      }

      // Get existing songs for duplicate detection
      const existingSongs = await storage.getAllSongs();
      const importedSongs = [];
      const duplicates = [];
      const total = supportedFiles.length;

      for (let i = 0; i < total; i++) {
        const file = supportedFiles[i];

        // Update progress
        state.set('importProgress', Math.round((i / total) * 100));

        // Extract metadata
        const metadata = await metadataService.extractMetadata(file);

        // Check for duplicates
        const dupCheck = isDuplicate(metadata, existingSongs, 0.9);

        if (dupCheck.isDuplicate) {
          duplicates.push({
            new: metadata,
            existing: dupCheck.match,
            similarity: dupCheck.similarity
          });

          // Handle duplicate based on option
          if (options.duplicateAction === 'skip') {
            continue;
          } else if (options.duplicateAction === 'replace') {
            // Delete old, save new
            await storage.deleteSong(dupCheck.match.id);
          } else if (options.duplicateAction === 'keep') {
            // Save both
          } else {
            // Default: ask user (handled by UI)
            continue;
          }
        }

        // Save song
        await storage.saveSong(metadata);
        importedSongs.push(metadata);
        existingSongs.push(metadata);
      }

      state.set('importProgress', 100);

      // Update library state
      await this.refreshLibrary();

      return {
        imported: importedSongs,
        duplicates,
        total: supportedFiles.length,
        skipped: duplicates.length - importedSongs.length
      };

    } finally {
      this.isImporting = false;
      state.set('isImporting', false);

      // Clear progress after a delay
      setTimeout(() => state.set('importProgress', 0), 2000);
    }
  }

  /**
   * Import from folder (directory picker)
   */
  async importFolder(options = {}) {
    if (!('showDirectoryPicker' in window)) {
      // Fallback: use file input with webkitdirectory
      return this.triggerFileInput({ directory: true, ...options });
    }

    try {
      const dirHandle = await window.showDirectoryPicker();
      const files = [];

      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          if (this.isSupported(file)) {
            files.push(file);
          }
        }
      }

      return this.importFiles(files, options);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[Melody Import] Directory import failed:', err);
      }
      return null;
    }
  }

  /**
   * Trigger hidden file input
   */
  triggerFileInput(options = {}) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = SUPPORTED_FORMATS.join(',');
      input.multiple = true;

      if (options.directory) {
        input.webkitdirectory = true;
        input.directory = true;
      }

      input.onchange = async () => {
        if (input.files && input.files.length > 0) {
          const result = await this.importFiles(input.files, options);
          resolve(result);
        } else {
          resolve(null);
        }
      };

      input.click();
    });
  }

  /**
   * Handle duplicate resolution
   */
  async resolveDuplicate(newSong, existingSong, action) {
    switch (action) {
      case 'replace':
        await storage.deleteSong(existingSong.id);
        await storage.saveSong(newSong);
        return { action: 'replaced', song: newSong };

      case 'keep':
        await storage.saveSong(newSong);
        return { action: 'kept', song: newSong };

      case 'skip':
      default:
        return { action: 'skipped', song: null };
    }
  }

  /**
   * Refresh library state from database
   */
  async refreshLibrary() {
    const [songs, albums, artists, playlists, genres, folders] = await Promise.all([
      storage.getAllSongs(),
      db.getAlbums(),
      db.getArtists(),
      db.getAllPlaylists(),
      db.getGenres(),
      db.getFolders()
    ]);

    state.batchUpdate({
      'songs': songs,
      'albums': albums,
      'artists': artists,
      'playlists': playlists,
      'genres': genres,
      'folders': folders,
      'recentlyAdded': songs.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0)).slice(0, 20),
      'recentlyPlayed': songs.filter(s => s.lastPlayed).sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0)).slice(0, 20),
      'mostPlayed': songs.filter(s => s.playCount > 0).sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 20)
    });
  }

  /**
   * Get import progress
   */
  getProgress() {
    return state.get('importProgress');
  }

  /**
   * Check if currently importing
   */
  isCurrentlyImporting() {
    return this.isImporting;
  }
}

// Singleton instance
const importService = new ImportService();

// Module: importService
