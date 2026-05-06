import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getYearOptions } from './year';

/**
 * Validates: Requirements 1.2
 *
 * Property 1: year options list is always 3 descending years from current year
 *
 * For any year value Y, getYearOptions(Y) should return exactly [Y, Y-1, Y-2]:
 * - length is always 3
 * - first element equals Y (current year)
 * - second element equals Y-1
 * - third element equals Y-2
 */
describe('getYearOptions', () => {
  it('returns [currentYear, currentYear-1, currentYear-2] for a known year', () => {
    expect(getYearOptions(2025)).toEqual([2025, 2024, 2023]);
  });

  it('property: always returns exactly 3 descending years starting from currentYear', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2000, max: 2100 }),
        (year) => {
          const options = getYearOptions(year);
          return (
            options.length === 3 &&
            options[0] === year &&
            options[1] === year - 1 &&
            options[2] === year - 2
          );
        }
      )
    );
  });
});
