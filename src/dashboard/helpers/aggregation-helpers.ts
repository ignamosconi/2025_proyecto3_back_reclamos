// src/dashboard/helpers/aggregation-helpers.ts

import { Types } from 'mongoose';

/**
 * Build match stage for date filtering
 */
export function buildDateMatch(
  startDate?: string | Date,
  endDate?: string | Date,
  specificDay?: string | Date,
  field: string = 'createdAt',
): Record<string, any> {
  const match: Record<string, any> = {};

  if (specificDay) {
    const day = typeof specificDay === 'string' ? new Date(specificDay) : specificDay;
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);
    match[field] = { $gte: start, $lte: end };
  } else if (startDate || endDate) {
    match[field] = {};
    if (startDate) {
      const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
      start.setHours(0, 0, 0, 0);
      match[field].$gte = start;
    }
    if (endDate) {
      const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
      end.setHours(23, 59, 59, 999);
      match[field].$lte = end;
    }
  }

  return Object.keys(match).length > 0 ? match : {};
}

/**
 * Build ObjectId filter
 */
export function buildObjectIdFilter(field: string, value?: string | string[]): Record<string, any> {
  if (!value) return {};
  if (Array.isArray(value)) {
    return { [field]: { $in: value.map((id) => new Types.ObjectId(id)) } };
  }
  return { [field]: new Types.ObjectId(value) };
}

/**
 * Group by month from date field
 */
export function groupByMonth(field: string = 'createdAt') {
  return {
    $group: {
      _id: {
        year: { $year: `$${field}` },
        month: { $month: `$${field}` },
      },
      count: { $sum: 1 },
      items: { $push: '$$ROOT' },
    },
  };
}

/**
 * Group by week from date field
 */
export function groupByWeek(field: string = 'createdAt') {
  return {
    $group: {
      _id: {
        year: { $year: `$${field}` },
        week: { $week: `$${field}` },
      },
      count: { $sum: 1 },
      items: { $push: '$$ROOT' },
    },
  };
}

/**
 * Group by day from date field
 */
export function groupByDay(field: string = 'createdAt') {
  return {
    $group: {
      _id: {
        year: { $year: `$${field}` },
        month: { $month: `$${field}` },
        day: { $dayOfMonth: `$${field}` },
      },
      count: { $sum: 1 },
      items: { $push: '$$ROOT' },
    },
  };
}

