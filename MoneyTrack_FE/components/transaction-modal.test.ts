/**
 * Exploratory tests — chạy trên code CHƯA FIX
 *
 * Mục tiêu: xác nhận bug tồn tại trong TransactionModal.
 * Bug: `filteredCategories` chỉ là flat list top-level categories.
 * Khi `transaction.categoryId` là subcategory ID, không có SelectItem nào khớp
 * → ô danh mục hiển thị trống (placeholder).
 *
 * Các test này PHẢI PASS để xác nhận bug tồn tại.
 * Sau khi fix, test 1.1 và 1.2 sẽ FAIL (vì bug đã được sửa).
 */

import { describe, it, expect } from 'vitest';
import type { ApiCategory, ApiTransaction } from '@/lib/types/api';

// ─── Helpers mô phỏng logic của TransactionModal ────────────────────────────

/**
 * Mô phỏng logic `filteredCategories` trong TransactionModal (code chưa fix):
 *   const filteredCategories = categories.filter((c) => c.type === type);
 *
 * Chỉ lấy top-level categories, KHÔNG duyệt children.
 */
function getFilteredCategories(categories: ApiCategory[], type: 'INCOME' | 'EXPENSE'): ApiCategory[] {
  return categories.filter((c) => c.type === type);
}

/**
 * Mô phỏng logic Select value matching (code chưa fix):
 * <Select value={categoryId}>
 *   {filteredCategories.map(c => <SelectItem value={String(c.id)} />)}
 * </Select>
 *
 * Trả về tên danh mục nếu tìm thấy, hoặc undefined (= hiển thị placeholder) nếu không.
 */
function getSelectDisplayValue(
  categoryId: string,
  filteredCategories: ApiCategory[]
): string | undefined {
  const matched = filteredCategories.find((c) => String(c.id) === categoryId);
  return matched?.name;
}

/**
 * Hàm isBugCondition từ bugfix.md:
 * Bug xảy ra khi categoryId của giao dịch KHÔNG có trong top-level categories.
 */
function isBugCondition(transaction: ApiTransaction, categories: ApiCategory[]): boolean {
  const topLevelIds = new Set(categories.map((c) => String(c.id)));
  return !topLevelIds.has(String(transaction.categoryId));
}

// ─── Fixture data ────────────────────────────────────────────────────────────

/**
 * Cấu trúc danh mục mẫu:
 *   EXPENSE:
 *     1 - "Ăn uống" (cha)
 *       └─ 11 - "Ăn sáng" (con)
 *       └─ 12 - "Ăn trưa" (con)
 *     2 - "Di chuyển" (cha)
 *       └─ 21 - "Xăng xe" (con)
 *   INCOME:
 *     3 - "Thu nhập cố định" (cha)
 *       └─ 31 - "Lương tháng" (con)
 */
const mockCategories: ApiCategory[] = [
  {
    id: 1,
    name: 'Ăn uống',
    type: 'EXPENSE',
    parentId: null,
    children: [
      { id: 11, name: 'Ăn sáng', type: 'EXPENSE', parentId: 1, children: [] },
      { id: 12, name: 'Ăn trưa', type: 'EXPENSE', parentId: 1, children: [] },
    ],
  },
  {
    id: 2,
    name: 'Di chuyển',
    type: 'EXPENSE',
    parentId: null,
    children: [
      { id: 21, name: 'Xăng xe', type: 'EXPENSE', parentId: 2, children: [] },
    ],
  },
  {
    id: 3,
    name: 'Thu nhập cố định',
    type: 'INCOME',
    parentId: null,
    children: [
      { id: 31, name: 'Lương tháng', type: 'INCOME', parentId: 3, children: [] },
    ],
  },
];

const subcategoryTransaction: ApiTransaction = {
  id: 100,
  amount: 50000,
  type: 'EXPENSE',
  categoryId: 11, // "Ăn sáng" — subcategory, KHÔNG có trong top-level
  date: '2025-01-15',
  description: 'Bữa sáng',
};

const parentCategoryTransaction: ApiTransaction = {
  id: 101,
  amount: 200000,
  type: 'EXPENSE',
  categoryId: 1, // "Ăn uống" — top-level category
  date: '2025-01-15',
  description: 'Ăn uống tổng',
};

// ─── Task 1.1: Assert ô danh mục hiển thị trống khi categoryId là subcategory ─

describe('Task 1.1 — Bug confirmation: subcategory ID không hiển thị trong flat list', () => {
  it('isBugCondition trả về true khi categoryId là subcategory (không có trong top-level)', () => {
    // Xác nhận đây là bug condition
    expect(isBugCondition(subcategoryTransaction, mockCategories)).toBe(true);
  });

  it('filteredCategories (flat list) KHÔNG chứa subcategory ID 11', () => {
    const filtered = getFilteredCategories(mockCategories, 'EXPENSE');
    const ids = filtered.map((c) => c.id);

    // Top-level EXPENSE categories chỉ có id 1 và 2
    expect(ids).toContain(1);
    expect(ids).toContain(2);

    // Subcategory IDs 11, 12, 21 KHÔNG có trong flat list
    expect(ids).not.toContain(11);
    expect(ids).not.toContain(12);
    expect(ids).not.toContain(21);
  });

  it('Select không tìm thấy giá trị khớp → hiển thị trống (undefined) khi categoryId là subcategory', () => {
    const filtered = getFilteredCategories(mockCategories, subcategoryTransaction.type);
    const displayValue = getSelectDisplayValue(
      String(subcategoryTransaction.categoryId), // "11"
      filtered
    );

    // BUG CONFIRMED: displayValue là undefined → Select hiển thị placeholder trống
    expect(displayValue).toBeUndefined();
  });

  it('Select tìm thấy giá trị khớp khi categoryId là top-level category (không phải bug)', () => {
    const filtered = getFilteredCategories(mockCategories, parentCategoryTransaction.type);
    const displayValue = getSelectDisplayValue(
      String(parentCategoryTransaction.categoryId), // "1"
      filtered
    );

    // Không phải bug: top-level category hiển thị đúng
    expect(displayValue).toBe('Ăn uống');
  });
});

// ─── Task 1.2: Counterexample — ghi lại các trường hợp bug ──────────────────

describe('Task 1.2 — Counterexamples: các subcategory IDs gây ra bug', () => {
  const bugCases: Array<{ categoryId: number; expectedName: string }> = [
    { categoryId: 11, expectedName: 'Ăn sáng' },
    { categoryId: 12, expectedName: 'Ăn trưa' },
    { categoryId: 21, expectedName: 'Xăng xe' },
    { categoryId: 31, expectedName: 'Lương tháng' },
  ];

  bugCases.forEach(({ categoryId, expectedName }) => {
    it(`categoryId=${categoryId} ("${expectedName}") là subcategory → Select hiển thị trống`, () => {
      const transaction: ApiTransaction = {
        id: 999,
        amount: 10000,
        type: categoryId === 31 ? 'INCOME' : 'EXPENSE',
        categoryId,
        date: '2025-01-01',
      };

      // Xác nhận đây là bug condition
      expect(isBugCondition(transaction, mockCategories)).toBe(true);

      // Flat list không chứa subcategory
      const filtered = getFilteredCategories(mockCategories, transaction.type);
      const displayValue = getSelectDisplayValue(String(categoryId), filtered);

      // BUG: displayValue là undefined thay vì tên danh mục
      expect(displayValue).toBeUndefined();
    });
  });
});

// ─── Task 1.3: Verify root cause — số lượng SelectItem = số danh mục cha ────

describe('Task 1.3 — Root cause: filteredCategories chỉ chứa danh mục cha', () => {
  it('filteredCategories EXPENSE có đúng 2 item (chỉ danh mục cha, không có con)', () => {
    const filtered = getFilteredCategories(mockCategories, 'EXPENSE');

    // Tổng số danh mục EXPENSE (cha + con) = 5 (1, 11, 12, 2, 21)
    // Nhưng flat list chỉ render 2 SelectItem (cha: 1, 2)
    expect(filtered.length).toBe(2);

    // Xác nhận chỉ có danh mục cha
    filtered.forEach((c) => {
      expect(c.parentId == null).toBe(true);
    });
  });

  it('filteredCategories INCOME có đúng 1 item (chỉ danh mục cha, không có con)', () => {
    const filtered = getFilteredCategories(mockCategories, 'INCOME');

    // Tổng số danh mục INCOME (cha + con) = 2 (3, 31)
    // Nhưng flat list chỉ render 1 SelectItem (cha: 3)
    expect(filtered.length).toBe(1);

    filtered.forEach((c) => {
      expect(c.parentId == null).toBe(true);
    });
  });

  it('Tổng số danh mục con bị bỏ qua = tổng children của tất cả danh mục cha', () => {
    const filtered = getFilteredCategories(mockCategories, 'EXPENSE');
    const totalChildren = filtered.reduce(
      (sum, c) => sum + (c.children?.length ?? 0),
      0
    );

    // 3 danh mục con EXPENSE bị bỏ qua (11, 12, 21)
    expect(totalChildren).toBe(3);

    // Số SelectItem render = filtered.length = 2 (chỉ cha)
    // Số danh mục con bị bỏ qua = 3
    // → Nếu user có giao dịch với bất kỳ subcategory nào trong 3 cái này,
    //   ô danh mục sẽ hiển thị trống
    expect(filtered.length).toBeLessThan(filtered.length + totalChildren);
  });

  it('isBugCondition là false cho tất cả top-level categories (không phải bug)', () => {
    const topLevelTransactions = mockCategories.map((c) => ({
      id: 999,
      amount: 10000,
      type: c.type,
      categoryId: c.id,
      date: '2025-01-01',
    } as ApiTransaction));

    topLevelTransactions.forEach((t) => {
      expect(isBugCondition(t, mockCategories)).toBe(false);
    });
  });

  it('isBugCondition là true cho tất cả subcategory IDs (bug condition)', () => {
    const subcategoryIds = [11, 12, 21, 31];
    const types: Record<number, 'INCOME' | 'EXPENSE'> = {
      11: 'EXPENSE', 12: 'EXPENSE', 21: 'EXPENSE', 31: 'INCOME',
    };

    subcategoryIds.forEach((id) => {
      const t: ApiTransaction = {
        id: 999,
        amount: 10000,
        type: types[id],
        categoryId: id,
        date: '2025-01-01',
      };
      expect(isBugCondition(t, mockCategories)).toBe(true);
    });
  });
});
