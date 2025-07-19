/**
 * Date formatting utilities
 */

/**
 * Format a date string to a localized date format
 * @param dateStr The date string to format
 * @param options Optional Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(dateStr?: string, options?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return 'N/A';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };

  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateStr;
  }
}

/**
 * Format a date as a relative time (e.g., "2 days ago")
 * @param dateStr The date string to format
 * @returns Formatted relative time string
 */
export function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'N/A';

  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return formatDate(dateStr);
    }
  } catch (e) {
    console.error('Error formatting relative date:', e);
    return dateStr;
  }
}
