/**
 * Melody PWA - Duplicate Detector
 * Detects duplicate songs by multiple criteria
 * @version 1.0.0
 */

/**
 * Calculate similarity between two strings (0-1)
 */
function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;

  // Levenshtein distance
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return 1 - matrix[len1][len2] / maxLen;
}

/**
 * Find duplicate songs in a collection
 */
function findDuplicates(songs, options = {}) {
  const {
    threshold = 0.85,
    checkTitle = true,
    checkArtist = true,
    checkDuration = true,
    durationTolerance = 3
  } = options;

  const duplicates = [];
  const processed = new Set();

  for (let i = 0; i < songs.length; i++) {
    if (processed.has(i)) continue;

    const group = [songs[i]];
    processed.add(i);

    for (let j = i + 1; j < songs.length; j++) {
      if (processed.has(j)) continue;

      const similarity = calculateSongSimilarity(
        songs[i], songs[j],
        { checkTitle, checkArtist, checkDuration, durationTolerance }
      );

      if (similarity >= threshold) {
        group.push(songs[j]);
        processed.add(j);
      }
    }

    if (group.length > 1) {
      duplicates.push(group);
    }
  }

  return duplicates;
}

/**
 * Calculate similarity between two songs
 */
function calculateSongSimilarity(song1, song2, options = {}) {
  const {
    checkTitle = true,
    checkArtist = true,
    checkDuration = true,
    durationTolerance = 3
  } = options;

  let totalWeight = 0;
  let totalScore = 0;

  if (checkTitle && song1.title && song2.title) {
    const titleSim = stringSimilarity(song1.title, song2.title);
    totalScore += titleSim * 0.4;
    totalWeight += 0.4;
  }

  if (checkArtist && song1.artist && song2.artist) {
    const artistSim = stringSimilarity(song1.artist, song2.artist);
    totalScore += artistSim * 0.3;
    totalWeight += 0.3;
  }

  if (checkDuration && song1.duration && song2.duration) {
    const diff = Math.abs(song1.duration - song2.duration);
    const durationSim = diff <= durationTolerance ? 1 : Math.max(0, 1 - (diff - durationTolerance) / 30);
    totalScore += durationSim * 0.2;
    totalWeight += 0.2;
  }

  if (song1.album && song2.album) {
    const albumSim = stringSimilarity(song1.album, song2.album);
    totalScore += albumSim * 0.1;
    totalWeight += 0.1;
  }

  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

/**
 * Check if a new song is a duplicate
 */
function isDuplicate(newSong, existingSongs, threshold = 0.9) {
  for (const existing of existingSongs) {
    const similarity = calculateSongSimilarity(newSong, existing);
    if (similarity >= threshold) {
      return { isDuplicate: true, match: existing, similarity };
    }
  }
  return { isDuplicate: false, match: null, similarity: 0 };
}

/**
 * Get best quality song from duplicate group
 */
function getBestQuality(songs) {
  return songs.reduce((best, song) => {
    const bestBitrate = best.bitrate || 0;
    const songBitrate = song.bitrate || 0;
    const bestFormat = best.format?.toLowerCase() || '';
    const songFormat = song.format?.toLowerCase() || '';
    const bestScore = (bestFormat.includes('flac') ? 100 : 0) + bestBitrate;
    const songScore = (songFormat.includes('flac') ? 100 : 0) + songBitrate;
    return songScore > bestScore ? song : best;
  });
}

/**
 * Merge metadata from duplicate songs
 */
function mergeMetadata(songs) {
  const merged = { ...songs[0] };

  for (const song of songs.slice(1)) {
    for (const [key, value] of Object.entries(song)) {
      if (!merged[key] && value) {
        merged[key] = value;
      }
      if (key === 'coverArt' && value) {
        const currentSize = merged.coverArtSize || 0;
        const newSize = song.coverArtSize || 0;
        if (newSize > currentSize) {
          merged.coverArt = value;
          merged.coverArtSize = newSize;
        }
      }
    }
  }

  return merged;
}

/**
 * Format duplicate group for display
 */
function formatDuplicateGroup(group) {
  const best = getBestQuality(group);
  return {
    id: 'dup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    songs: group,
    best,
    count: group.length,
    title: best.title || 'Unknown',
    artist: best.artist || 'Unknown Artist'
  };
}
