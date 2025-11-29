// src/dashboard/helpers/date-helpers.ts

import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear } from 'date-fns';

/**
 * Get date range for filtering
 * If specificDay is provided, returns that day's range
 * If startDate and endDate are provided, uses those
 * Otherwise defaults to last 30 days
 */
export function getDateRange(
  startDate?: string | Date,
  endDate?: string | Date,
  specificDay?: string | Date,
): { start: Date; end: Date } {
  if (specificDay) {
    const day = typeof specificDay === 'string' ? new Date(specificDay) : specificDay;
    return {
      start: startOfDay(day),
      end: endOfDay(day),
    };
  }

  if (startDate && endDate) {
    return {
      start: typeof startDate === 'string' ? new Date(startDate) : startDate,
      end: typeof endDate === 'string' ? new Date(endDate) : endDate,
    };
  }

  // Default to last 30 days
  const end = new Date();
  const start = subDays(end, 30);
  return { start, end };
}

/**
 * Get start and end of a month
 */
export function getMonthRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

/**
 * Get start and end of a week
 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

/**
 * Get start and end of a day
 */
export function getDayRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfDay(date),
    end: endOfDay(date),
  };
}

/**
 * Calculate days between two dates
 */
export function daysBetween(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format date for MongoDB query
 */
export function formatDateForQuery(date: string | Date): Date {
  return typeof date === 'string' ? new Date(date) : date;
}

