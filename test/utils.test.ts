import { describe, it, expect } from 'vitest';
import { formatDate, formatRelativeTime } from '../utils/format';

describe('Utils - Format', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const now = new Date('2025-10-09T11:00:00Z').toDateString();
      const result = formatDate(now);
      expect(result).toMatch(/\d{1,2}/); // Or more specific regex for date format
      // Alternatively, if expecting a specific format:
      expect(result).toBe('Oct 9, 2025'); // Hardcode if needed, but prefer dynamic
    });
    it('should return N/A for undefined dates', () => {
      const formatted = formatDate(undefined);
      expect(formatted).toBe('N/A');
    });

    it('should handle custom format options', () => {
      const date = '2025-10-08';
      const formatted = formatDate(date, { month: 'long' });
      expect(formatted).toContain('October');
    });
  });

  it('should return N/A for undefined dates', () => {
    const formatted = formatRelativeTime(undefined);
    expect(formatted).toBe('N/A');
  });

  it('should format recent dates as "just now"', () => {
    const now = new Date();
    const recentDate = new Date(now.getTime() - 30 * 1000); // 30 seconds ago
    const formatted = formatRelativeTime(recentDate.toISOString());
    expect(formatted).toBe('just now');
  });
});
