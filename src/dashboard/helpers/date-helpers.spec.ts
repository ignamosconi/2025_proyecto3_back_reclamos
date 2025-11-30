import {
  getDateRange,
  getMonthRange,
  getWeekRange,
  getDayRange,
  daysBetween,
  formatDateForQuery,
} from './date-helpers';
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from 'date-fns';

describe('Date Helpers', () => {
  describe('getDateRange', () => {
    // Decision Table Testing
    // | specificDay | startDate | endDate | Result |
    // |-------------|-----------|---------|--------|
    // | Yes         | -         | -       | specificDay range |
    // | No          | Yes       | Yes     | startDate - endDate |
    // | No          | Yes       | No      | Last 30 days (Default) |
    // | No          | No        | Yes     | Last 30 days (Default) |
    // | No          | No        | No      | Last 30 days (Default) |

    it('should return range for specificDay when provided (Date object)', () => {
      const day = new Date('2023-10-10T12:00:00Z');
      const result = getDateRange(undefined, undefined, day);
      expect(result.start).toEqual(startOfDay(day));
      expect(result.end).toEqual(endOfDay(day));
    });

    it('should return range for specificDay when provided (string)', () => {
      const dayStr = '2023-10-10';
      const result = getDateRange(undefined, undefined, dayStr);
      const day = new Date(dayStr);
      expect(result.start).toEqual(startOfDay(day));
      expect(result.end).toEqual(endOfDay(day));
    });

    it('should return range for startDate and endDate when both provided (Date objects)', () => {
      const start = new Date('2023-10-01');
      const end = new Date('2023-10-05');
      const result = getDateRange(start, end);
      expect(result.start).toEqual(start);
      expect(result.end).toEqual(end);
    });

    it('should return range for startDate and endDate when both provided (strings)', () => {
      const startStr = '2023-10-01';
      const endStr = '2023-10-05';
      const result = getDateRange(startStr, endStr);
      expect(result.start).toEqual(new Date(startStr));
      expect(result.end).toEqual(new Date(endStr));
    });

    // Edge Cases / Default Fallback
    it('should return last 30 days when only startDate is provided', () => {
      const start = new Date('2023-10-01');
      const result = getDateRange(start);
      const now = new Date();
      // Allow small difference in execution time
      expect(result.end.getDate()).toEqual(now.getDate());
      expect(result.start.getDate()).toEqual(subDays(now, 30).getDate());
    });

    it('should return last 30 days when only endDate is provided', () => {
      const end = new Date('2023-10-05');
      const result = getDateRange(undefined, end);
      const now = new Date();
      expect(result.end.getDate()).toEqual(now.getDate());
      expect(result.start.getDate()).toEqual(subDays(now, 30).getDate());
    });

    it('should return last 30 days when no arguments are provided', () => {
      const result = getDateRange();
      const now = new Date();
      expect(result.end.getDate()).toEqual(now.getDate());
      expect(result.start.getDate()).toEqual(subDays(now, 30).getDate());
    });
  });

  describe('getMonthRange', () => {
    it('should return start and end of the month', () => {
      const date = new Date('2023-10-15');
      const result = getMonthRange(date);
      expect(result.start).toEqual(startOfMonth(date));
      expect(result.end).toEqual(endOfMonth(date));
    });
  });

  describe('getWeekRange', () => {
    it('should return start and end of the week', () => {
      const date = new Date('2023-10-15'); // Sunday
      const result = getWeekRange(date);
      expect(result.start).toEqual(startOfWeek(date, { weekStartsOn: 1 }));
      expect(result.end).toEqual(endOfWeek(date, { weekStartsOn: 1 }));
    });
  });

  describe('getDayRange', () => {
    it('should return start and end of the day', () => {
      const date = new Date('2023-10-15T12:30:00');
      const result = getDayRange(date);
      expect(result.start).toEqual(startOfDay(date));
      expect(result.end).toEqual(endOfDay(date));
    });
  });

  describe('daysBetween', () => {
    it('should calculate days between two dates correctly', () => {
      const start = new Date('2023-10-01');
      const end = new Date('2023-10-05');
      expect(daysBetween(start, end)).toBe(4);
    });

    it('should return 0 for same date', () => {
      const date = new Date('2023-10-01');
      expect(daysBetween(date, date)).toBe(0);
    });

    it('should handle dates in reverse order (absolute difference)', () => {
      const start = new Date('2023-10-05');
      const end = new Date('2023-10-01');
      expect(daysBetween(start, end)).toBe(4);
    });
  });

  describe('formatDateForQuery', () => {
    it('should return Date object if input is string', () => {
      const dateStr = '2023-10-01';
      const result = formatDateForQuery(dateStr);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString().startsWith('2023-10-01')).toBe(true);
    });

    it('should return Date object if input is Date', () => {
      const date = new Date('2023-10-01');
      const result = formatDateForQuery(date);
      expect(result).toBe(date);
    });
  });
});
