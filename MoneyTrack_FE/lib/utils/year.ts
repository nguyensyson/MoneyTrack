/**
 * Trả về mảng 3 năm gần nhất, bắt đầu từ currentYear giảm dần.
 *
 * Ví dụ: getYearOptions(2025) → [2025, 2024, 2023]
 */
export function getYearOptions(currentYear: number): number[] {
  return [currentYear, currentYear - 1, currentYear - 2];
}
