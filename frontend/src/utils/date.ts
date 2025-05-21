// frontend/src/utils/date.ts
import {
  format,
  formatDistance,
  formatRelative,
  parseISO,
  isValid,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
} from 'date-fns';
import { DATE_FORMATS } from '@/config/constants';

/**
 * Format a date string using the default format
 */
export const formatDate = (
  dateString: string,
  dateFormat = DATE_FORMATS.default,
): string => {
  try {
    const date = parseISO(dateString);

    if (!isValid(date)) {
      return 'Invalid date';
    }

    return format(date, dateFormat);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Get relative time (e.g., "5 minutes ago", "2 days ago")
 */
export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);

    if (!isValid(date)) {
      return 'Invalid date';
    }

    return formatDistance(date, new Date(), { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid date';
  }
};

/**
 * Format date relative to another date (e.g., "yesterday", "last week")
 */
export const formatRelativeDate = (
  dateString: string,
  baseDate = new Date(),
): string => {
  try {
    const date = parseISO(dateString);

    if (!isValid(date)) {
      return 'Invalid date';
    }

    return formatRelative(date, baseDate);
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return 'Invalid date';
  }
};

/**
 * Calculate and format the time remaining until a date
 */
export const getTimeUntil = (dateString: string): string => {
  try {
    const date = parseISO(dateString);

    if (!isValid(date)) {
      return 'Invalid date';
    }

    const now = new Date();

    if (date < now) {
      return 'Expired';
    }

    const days = differenceInDays(date, now);

    if (days === 0) {
      return 'Today';
    }

    if (days === 1) {
      return 'Tomorrow';
    }

    if (days < 30) {
      return `${days} days`;
    }

    const months = differenceInMonths(date, now);

    if (months === 1) {
      return '1 month';
    }

    if (months < 12) {
      return `${months} months`;
    }

    const years = differenceInYears(date, now);

    if (years === 1) {
      return '1 year';
    }

    return `${years} years`;
  } catch (error) {
    console.error('Error calculating time until date:', error);
    return 'Invalid date';
  }
};
