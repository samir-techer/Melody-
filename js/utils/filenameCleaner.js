/**
 * Melody PWA - Filename Cleaner
 * Automatically cleans and formats music filenames into proper metadata
 * @version 1.0.0
 */

// Patterns to remove from filenames
const REMOVE_PATTERNS = [
  // Official tags
  /\bofficial\b/gi,
  /\blyrics\b/gi,
  /\bofficial audio\b/gi,
  /\bofficial video\b/gi,
  /\bofficial music video\b/gi,
  /\bvideo oficial\b/gi,
  /\baudio oficial\b/gi,

  // Quality tags
  /\bhd\b/gi,
  /\b4k\b/gi,
  /\b1080p\b/gi,
  /\b720p\b/gi,
  /\b320kbps\b/gi,
  /\b256kbps\b/gi,
  /\b192kbps\b/gi,
  /\b128kbps\b/gi,
  /\bvbr\b/gi,
  /\blossless\b/gi,
  /\bflac\b/gi,
  /\bhq\b/gi,
  /\blq\b/gi,

  // File format tags
  /\bmp3\b/gi,
  /\bflac\b/gi,
  /\bm4a\b/gi,
  /\bwav\b/gi,
  /\baac\b/gi,
  /\bogg\b/gi,
  /\bwma\b/gi,

  // Platform tags
  /\byoutube\b/gi,
  /\bspotify\b/gi,
  /\bapple music\b/gi,
  /\btidal\b/gi,
  /\bsoundcloud\b/gi,
  /\bbandcamp\b/gi,

  // Random IDs and codes
  /\b[a-f0-9]{8,}\b/gi,
  /\b\d{6,}\b/g,
  /\bvid\d+\b/gi,
  /\btrack\d+\b/gi,

  // Brackets and their contents
  /\[.*?\]/g,
  /\(.*?\)/g,
  /\{.*?\}/g,

  // Extra dashes and underscores at edges
  /^[-_\s]+/,
  /[-_\s]+$/,
];

// Artist - Title separators
const SEPARATORS = [
  ' - ',
  ' – ',
  ' — ',
  ' _ ',
  ' | ',
  ' ~ ',
  ' // ',
  ' \ ',
  '-',
  '_',
];

/**
 * Clean a single filename
 */
function cleanFilename(filename) {
  if (!filename) return { title: '', artist: '' };

  // Remove file extension
  let clean = filename.replace(/\.[^/.]+$/, '');

  // Apply all removal patterns
  for (const pattern of REMOVE_PATTERNS) {
    clean = clean.replace(pattern, '');
  }

  // Clean up multiple spaces
  clean = clean.replace(/\s+/g, ' ').trim();

  // Try to split artist and title
  let artist = '';
  let title = clean;

  for (const sep of SEPARATORS) {
    const parts = clean.split(sep);
    if (parts.length >= 2) {
      artist = parts[0].trim();
      title = parts.slice(1).join(sep).trim();
      break;
    }
  }

  // Fix capitalization
  title = fixCapitalization(title);
  artist = fixCapitalization(artist);

  return { title, artist };
}

/**
 * Fix capitalization of a string
 */
function fixCapitalization(str) {
  if (!str) return '';

  // Split by spaces and capitalize each word
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (!word) return '';

      // Don't capitalize small words unless they're the first word
      const smallWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'in', 'of', 'with'];
      if (smallWords.includes(word.toLowerCase())) {
        return word.toLowerCase();
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace(/^(\w)/, m => m.toUpperCase()); // Ensure first letter is capitalized
}

/**
 * Clean album name from filename
 */
function cleanAlbumName(filename) {
  const { title } = cleanFilename(filename);
  return title;
}

/**
 * Extract track number from filename
 */
function extractTrackNumber(filename) {
  const match = filename.match(/^(\d+)[\s._-]/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Clean a batch of filenames
 */
function cleanFilenames(filenames) {
  return filenames.map(name => ({
    original: name,
    ...cleanFilename(name)
  }));
}

/**
 * Detect if filename follows "Artist - Title" pattern
 */
function detectArtistTitlePattern(filename) {
  const clean = filename.replace(/\.[^/.]+$/, '');

  for (const sep of SEPARATORS) {
    if (clean.includes(sep)) {
      const parts = clean.split(sep);
      if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
        return {
          hasPattern: true,
          separator: sep,
          artist: parts[0].trim(),
          title: parts[1].trim()
        };
      }
    }
  }

  return { hasPattern: false };
}

/**
 * Remove common prefixes
 */
function removePrefix(str, prefixes) {
  for (const prefix of prefixes) {
    if (str.toLowerCase().startsWith(prefix.toLowerCase())) {
      return str.slice(prefix.length).trim();
    }
  }
  return str;
}

/**
 * Remove common suffixes
 */
function removeSuffix(str, suffixes) {
  for (const suffix of suffixes) {
    if (str.toLowerCase().endsWith(suffix.toLowerCase())) {
      return str.slice(0, -suffix.length).trim();
    }
  }
  return str;
}

/**
 * Sanitize filename for filesystem
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}
