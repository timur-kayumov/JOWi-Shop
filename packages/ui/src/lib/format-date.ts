/**
 * Date formatting utilities with localization support (RU/UZ)
 */

type Locale = 'ru' | 'uz';

const MONTHS_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

const MONTHS_UZ = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
];

/**
 * Format date to "10 ноября 2025, 23:00"
 */
export function formatDate(date: Date | string, locale: Locale = 'ru'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const day = d.getDate();
  const monthIndex = d.getMonth();
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  const months = locale === 'ru' ? MONTHS_RU : MONTHS_UZ;
  const month = months[monthIndex];

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

/**
 * Format date without time: "10 ноября 2025"
 */
export function formatDateShort(date: Date | string, locale: Locale = 'ru'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const day = d.getDate();
  const monthIndex = d.getMonth();
  const year = d.getFullYear();

  const months = locale === 'ru' ? MONTHS_RU : MONTHS_UZ;
  const month = months[monthIndex];

  return `${day} ${month} ${year}`;
}

/**
 * Format time only: "23:00"
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

/**
 * Format date relative to now: "только что", "5 минут назад", "вчера", "3 дня назад"
 * Falls back to full date format for dates older than 7 days
 */
export function formatRelativeDate(date: Date | string, locale: Locale = 'ru'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (locale === 'ru') {
    if (diffSec < 60) return 'только что';
    if (diffMin < 60) {
      if (diffMin === 1) return '1 минуту назад';
      if (diffMin < 5) return `${diffMin} минуты назад`;
      return `${diffMin} минут назад`;
    }
    if (diffHours < 24) {
      if (diffHours === 1) return '1 час назад';
      if (diffHours < 5) return `${diffHours} часа назад`;
      return `${diffHours} часов назад`;
    }
    if (diffDays === 1) return 'вчера';
    if (diffDays < 7) {
      if (diffDays < 5) return `${diffDays} дня назад`;
      return `${diffDays} дней назад`;
    }
  } else {
    // Uzbek
    if (diffSec < 60) return 'hozirgina';
    if (diffMin < 60) return `${diffMin} daqiqa oldin`;
    if (diffHours < 24) return `${diffHours} soat oldin`;
    if (diffDays === 1) return 'kecha';
    if (diffDays < 7) return `${diffDays} kun oldin`;
  }

  // Fallback to full date for dates older than 7 days
  return formatDate(d, locale);
}
