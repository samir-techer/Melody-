/**
 * Melody PWA - Time Formatter
 * Duration formatting, time-based greetings, sleep timer
 * @version 1.0.0
 */

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format seconds to human readable (e.g., "3 min 42 sec")
 */
function formatDurationHuman(seconds) {
  if (!seconds || isNaN(seconds)) return '0 seconds';

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours} hr`);
  if (minutes > 0) parts.push(`${minutes} min`);
  if (secs > 0 && hours === 0) parts.push(`${secs} sec`);

  return parts.join(' ') || '0 seconds';
}

/**
 * Format duration for display in lists (compact)
 */
function formatDurationCompact(seconds) {
  if (!seconds || isNaN(seconds)) return '--:--';

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse time string to seconds
 */
function parseTimeString(str) {
  if (typeof str === 'number') return str;

  // Handle MM:SS or HH:MM:SS
  const parts = str.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return parseFloat(str) || 0;
}

/**
 * Get time-based greeting
 */
function getTimeGreeting(nickname = '') {
  const hour = new Date().getHours();
  let greeting = 'Good Morning';
  let icon = '☀️';

  if (hour >= 12 && hour < 17) {
    greeting = 'Good Afternoon';
    icon = '☀️';
  } else if (hour >= 17 && hour < 21) {
    greeting = 'Good Evening';
    icon = '🌙';
  } else if (hour >= 21 || hour < 5) {
    greeting = 'Good Night';
    icon = '🌌';
  }

  return nickname ? `${greeting}, ${nickname} ${icon}` : `${greeting} ${icon}`;
}

/**
 * Format date relative (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
}

/**
 * Format date for display
 */
function formatDate(timestamp, options = {}) {
  const date = new Date(timestamp);
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  return date.toLocaleDateString(undefined, defaultOptions);
}

/**
 * Format year only
 */
function formatYear(timestamp) {
  return new Date(timestamp).getFullYear().toString();
}

/**
 * Sleep timer presets
 */
const SLEEP_TIMER_PRESETS = [
  { label: '5 minutes', minutes: 5 },
  { label: '10 minutes', minutes: 10 },
  { label: '15 minutes', minutes: 15 },
  { label: '30 minutes', minutes: 30 },
  { label: '45 minutes', minutes: 45 },
  { label: '1 hour', minutes: 60 },
  { label: 'End of song', minutes: -1 }
];

/**
 * Create a sleep timer
 */
function createSleepTimer(minutes, onComplete) {
  if (minutes === -1) {
    // End of song - handled by audio service
    return { type: 'endOfSong', cancel: () => {} };
  }

  const ms = minutes * 60 * 1000;
  const timeoutId = setTimeout(() => {
    onComplete();
  }, ms);

  return {
    type: 'timer',
    endTime: Date.now() + ms,
    cancel: () => clearTimeout(timeoutId)
  };
}

/**
 * Get remaining time for sleep timer
 */
function getSleepTimerRemaining(timer) {
  if (!timer || timer.type !== 'timer') return null;
  const remaining = timer.endTime - Date.now();
  if (remaining <= 0) return '0:00';
  return formatDurationCompact(Math.ceil(remaining / 1000));
}

/**
 * Format playback speed
 */
function formatPlaybackSpeed(speed) {
  return `${speed.toFixed(2)}x`;
}

/**
 * Get playback speed presets
 */
const PLAYBACK_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

/**
 * Format track number (e.g., "01", "12")
 */
function formatTrackNumber(num) {
  if (!num || num < 1) return '';
  return num.toString().padStart(2, '0');
}

/**
 * Format disc number
 */
function formatDiscNumber(num) {
  if (!num || num < 2) return '';
  return `Disc ${num}`;
}

/**
 * Get current timestamp
 */
function now() {
  return Date.now();
}

/**
 * Check if timestamp is today
 */
function isToday(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Check if timestamp is this week
 */
function isThisWeek(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  const diff = today - date;
  return diff >= 0 && diff < 7 * 24 * 60 * 60 * 1000;
}
