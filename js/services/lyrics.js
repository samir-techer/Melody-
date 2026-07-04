/**
 * Melody PWA - Lyrics Service
 * Fetch, parse, and display synchronized lyrics
 * @version 1.0.0
 */


class LyricsService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get lyrics for a song
   * Priority: 1. Embedded, 2. Cached, 3. Online fetch
   */
  async getLyrics(song) {
    if (!song) return null;

    // Check memory cache
    if (this.cache.has(song.id)) {
      return this.cache.get(song.id);
    }

    // Check IndexedDB
    const cached = await storage.getLyrics(song.id);
    if (cached) {
      const parsed = this.parseLyrics(cached);
      this.cache.set(song.id, parsed);
      return parsed;
    }

    // Use embedded lyrics
    if (song.lyrics) {
      const parsed = this.parseLyrics(song.lyrics);
      this.cache.set(song.id, parsed);
      return parsed;
    }

    // Try to fetch online
    if (navigator.onLine && song.artist && song.title) {
      try {
        const onlineLyrics = await this.fetchOnlineLyrics(song.artist, song.title);
        if (onlineLyrics) {
          await storage.saveLyrics(song.id, onlineLyrics);
          const parsed = this.parseLyrics(onlineLyrics);
          this.cache.set(song.id, parsed);
          return parsed;
        }
      } catch (err) {
        console.warn('[Melody Lyrics] Online fetch failed:', err);
      }
    }

    return null;
  }

  /**
   * Parse lyrics text into structured format
   * Supports LRC format ([mm:ss.xx]) and plain text
   */
  parseLyrics(lyricsText) {
    if (!lyricsText) return null;

    const lines = lyricsText.split('\n');
    const parsed = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check for LRC timestamp [mm:ss.xx] or [mm:ss.xxx]
      const lrcMatch = trimmed.match(/^(\[\d{2}:\d{2}\.\d{2,3}\])+(.*)$/);

      if (lrcMatch) {
        // Extract all timestamps
        const timestampMatches = trimmed.match(/\[\d{2}:\d{2}\.\d{2,3}\]/g);
        const text = trimmed.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();

        if (text && timestampMatches) {
          for (const ts of timestampMatches) {
            const time = this.parseLrcTimestamp(ts);
            parsed.push({ time, text, isSynced: true });
          }
        }
      } else {
        // Plain text line
        parsed.push({ time: null, text: trimmed, isSynced: false });
      }
    }

    // Sort by time if synced
    const hasSynced = parsed.some(l => l.isSynced);
    if (hasSynced) {
      parsed.sort((a, b) => {
        if (a.time === null) return 1;
        if (b.time === null) return -1;
        return a.time - b.time;
      });
    }

    return {
      lines: parsed,
      isSynced: hasSynced,
      raw: lyricsText
    };
  }

  /**
   * Parse LRC timestamp [mm:ss.xx] to seconds
   */
  parseLrcTimestamp(timestamp) {
    const match = timestamp.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\]/);
    if (!match) return 0;

    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);

    return minutes * 60 + seconds + milliseconds / 1000;
  }

  /**
   * Get current lyric line based on playback time
   */
  getCurrentLine(lyrics, currentTime) {
    if (!lyrics || !lyrics.isSynced || !lyrics.lines) return null;

    let currentLine = null;
    let nextLine = null;

    for (let i = 0; i < lyrics.lines.length; i++) {
      const line = lyrics.lines[i];
      if (line.time === null) continue;

      if (line.time <= currentTime) {
        currentLine = { ...line, index: i };
        nextLine = lyrics.lines[i + 1] || null;
      } else {
        break;
      }
    }

    return { current: currentLine, next: nextLine };
  }

  /**
   * Fetch lyrics from online sources
   */
  async fetchOnlineLyrics(artist, title) {
    // Try multiple sources
    const sources = [
      () => this.fetchFromLRCLIB(artist, title),
      () => this.fetchFromChartLyrics(artist, title),
    ];

    for (const source of sources) {
      try {
        const lyrics = await source();
        if (lyrics) return lyrics;
      } catch (err) {
        // Try next source
      }
    }

    return null;
  }

  /**
   * Fetch from LRCLIB (free, no API key)
   */
  async fetchFromLRCLIB(artist, title) {
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
    const response = await fetch(url);

    if (!response.ok) return null;

    const data = await response.json();

    // Prefer synced lyrics, fallback to plain
    if (data.syncedLyrics) return data.syncedLyrics;
    if (data.plainLyrics) return data.plainLyrics;

    return null;
  }

  /**
   * Fetch from ChartLyrics
   */
  async fetchFromChartLyrics(artist, title) {
    const url = `http://api.chartlyrics.com/apiv1.asmx/SearchLyricDirect?artist=${encodeURIComponent(artist)}&song=${encodeURIComponent(title)}`;

    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const text = await response.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');
      const lyric = xml.querySelector('Lyric');

      return lyric ? lyric.textContent : null;
    } catch {
      return null;
    }
  }

  /**
   * Save lyrics manually
   */
  async saveLyrics(songId, lyricsText) {
    await storage.saveLyrics(songId, lyricsText);
    this.cache.delete(songId);
    return this.parseLyrics(lyricsText);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
const lyricsService = new LyricsService();

// Module: lyricsService
