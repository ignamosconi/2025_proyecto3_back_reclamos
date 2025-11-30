import {
  buildDateMatch,
  buildObjectIdFilter,
  groupByMonth,
  groupByWeek,
  groupByDay,
} from './aggregation-helpers';
import { Types } from 'mongoose';

describe('Aggregation Helpers', () => {
  describe('buildDateMatch', () => {
    // Decision Table
    // | specificDay | startDate | endDate | Result |
    // |-------------|-----------|---------|--------|
    // | Yes         | -         | -       | $gte startOfDay, $lte endOfDay |
    // | No          | Yes       | No      | $gte startDate |
    // | No          | No        | Yes     | $lte endDate |
    // | No          | Yes       | Yes     | $gte startDate, $lte endDate |
    // | No          | No        | No      | {} |

    const field = 'createdAt';

    it('should return match for specificDay', () => {
      const day = '2023-10-10';
      const result = buildDateMatch(undefined, undefined, day, field);

      const start = new Date(day);
      start.setHours(0, 0, 0, 0);
      const end = new Date(day);
      end.setHours(23, 59, 59, 999);

      expect(result[field]).toEqual({ $gte: start, $lte: end });
    });

    it('should return match for startDate only', () => {
      const startStr = '2023-10-01';
      const result = buildDateMatch(startStr, undefined, undefined, field);

      const start = new Date(startStr);
      start.setHours(0, 0, 0, 0);

      expect(result[field]).toEqual({ $gte: start });
    });

    it('should return match for endDate only', () => {
      const endStr = '2023-10-05';
      const result = buildDateMatch(undefined, endStr, undefined, field);

      const end = new Date(endStr);
      end.setHours(23, 59, 59, 999);

      expect(result[field]).toEqual({ $lte: end });
    });

    it('should return match for both startDate and endDate', () => {
      const startStr = '2023-10-01';
      const endStr = '2023-10-05';
      const result = buildDateMatch(startStr, endStr, undefined, field);

      const start = new Date(startStr);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endStr);
      end.setHours(23, 59, 59, 999);

      expect(result[field]).toEqual({ $gte: start, $lte: end });
    });

    it('should return empty object if no dates provided', () => {
      const result = buildDateMatch(undefined, undefined, undefined, field);
      expect(result).toEqual({});
    });
  });

  describe('buildObjectIdFilter', () => {
    const field = 'userId';

    it('should return empty object if value is undefined', () => {
      expect(buildObjectIdFilter(field, undefined)).toEqual({});
    });

    it('should return single ObjectId match if value is string', () => {
      const id = new Types.ObjectId().toHexString();
      const result = buildObjectIdFilter(field, id);
      expect(result[field]).toBeInstanceOf(Types.ObjectId);
      expect(result[field].toHexString()).toBe(id);
    });

    it('should return $in match if value is array', () => {
      const ids = [
        new Types.ObjectId().toHexString(),
        new Types.ObjectId().toHexString(),
      ];
      const result = buildObjectIdFilter(field, ids);
      expect(result[field].$in).toHaveLength(2);
      expect(result[field].$in[0]).toBeInstanceOf(Types.ObjectId);
      expect(result[field].$in[0].toHexString()).toBe(ids[0]);
    });
  });

  describe('Grouping Functions', () => {
    it('groupByMonth should return correct stage', () => {
      const result = groupByMonth('testDate');
      expect(result.$group._id).toEqual({
        year: { $year: '$testDate' },
        month: { $month: '$testDate' },
      });
    });

    it('groupByWeek should return correct stage', () => {
      const result = groupByWeek('testDate');
      expect(result.$group._id).toEqual({
        year: { $year: '$testDate' },
        week: { $week: '$testDate' },
      });
    });

    it('groupByDay should return correct stage', () => {
      const result = groupByDay('testDate');
      expect(result.$group._id).toEqual({
        year: { $year: '$testDate' },
        month: { $month: '$testDate' },
        day: { $dayOfMonth: '$testDate' },
      });
    });
  });
});
