# Transaction Category Edit Bug — Bugfix Design

## Overview

Popup chỉnh sửa giao dịch (`TransactionModal`) sử dụng `<Select>/<SelectItem>` dạng flat list, chỉ render danh mục cha từ `categories: ApiCategory[]` mà không duyệt qua `children`. Khi `categoryId` của giao dịch là một danh mục con, `Select` không tìm thấy giá trị khớp và hiển thị trống.

Fix: thay thế `<Select>/<SelectItem>` trong phần chọn danh mục của `TransactionModal` bằng `CategorySelector` component (đã có sẵn), đồng thời thêm hàm convert `ApiCategory[]` → `CategoryWithChildren[]` theo đúng format mà `CategorySelector` yêu cầu — tương tự cách `TransactionForm` đang làm ở trang tạo giao dịch.

## Glossary

- **Bug_Condition (C)**: Điều kiện kích hoạt bug — `categoryId` của giao dịch là danh mục con (không tồn tại ở cấp top-level của `categories`)
- **Property (P)**: Hành vi đúng khi bug condition thỏa — ô chọn danh mục hiển thị đúng tên danh mục con
- **Preservation**: Các hành vi hiện tại phải giữ nguyên sau khi fix — hiển thị danh mục cha, lọc theo type, reset categoryId, submit đúng payload
- **TransactionModal**: Component tại `MoneyTrack_FE/components/transaction-modal.tsx` — dialog dùng cho cả tạo mới và chỉnh sửa giao dịch
- **CategorySelector**: Component tại `MoneyTrack_FE/components/category-selector.tsx` — dropdown hỗ trợ hierarchical rendering với tìm kiếm đệ quy
- **ApiCategory**: Interface tại `MoneyTrack_FE/lib/types/api.ts` — `{ id: number; name: string; type: 'INCOME'|'EXPENSE'; parentId?: number|null; children?: ApiCategory[] }`
- **CategoryWithChildren**: Interface export từ `category-selector.tsx` — `Category & { children: CategoryWithChildren[] }`, dùng `id: string` (không phải `number`)
- **filteredCategories**: Danh sách danh mục đã lọc theo `type` (INCOME/EXPENSE) hiện tại trong modal

## Bug Details

### Bug Condition

Bug xảy ra khi `TransactionModal` nhận một giao dịch có `categoryId` là danh mục con — tức là ID đó không tồn tại ở cấp top-level của mảng `categories`, mà chỉ nằm bên trong `children` của một danh mục cha. `<Select value={categoryId}>` không tìm thấy `<SelectItem value={String(c.id)}>` khớp → hiển thị trống.

**Formal Specification:**

```
FUNCTION isBugCondition(transaction, categories)
  INPUT: transaction of type ApiTransaction, categories of type ApiCategory[]
  OUTPUT: boolean

  topLevelIds ← { String(c.id) | c IN categories }
  RETURN String(transaction.categoryId) NOT IN topLevelIds
END FUNCTION
```

### Examples

- **Bug**: Giao dịch có `categoryId = 15` (danh mục con "Ăn sáng" thuộc cha "Ăn uống") → modal mở ra, ô danh mục hiển thị trống (placeholder "Chọn danh mục")
- **Bug**: Giao dịch có `categoryId = 23` (danh mục con "Lương tháng" thuộc cha "Thu nhập cố định") → ô danh mục hiển thị trống
- **No bug**: Giao dịch có `categoryId = 5` (danh mục cha "Ăn uống") → ô danh mục hiển thị đúng "Ăn uống"
- **Edge case**: Giao dịch có `categoryId` không tồn tại trong cả cha lẫn con → hiển thị placeholder (hành vi này giữ nguyên sau fix)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Giao dịch có `categoryId` là danh mục cha phải tiếp tục hiển thị đúng tên danh mục cha
- Khi người dùng thay đổi `type` (INCOME/EXPENSE), danh sách danh mục phải lọc đúng và `categoryId` phải reset về rỗng
- Khi submit form, payload gửi lên API phải có `categoryId` dạng `number` (không phải string)
- Khi mở modal tạo mới (`transaction = null`), ô danh mục phải bắt đầu trống

**Scope:**
Tất cả input không thỏa `isBugCondition` (categoryId là danh mục cha, hoặc modal ở chế độ tạo mới) phải hoàn toàn không bị ảnh hưởng bởi fix này.

**Lưu ý:** Hành vi đúng khi bug condition thỏa được định nghĩa trong Correctness Properties (Property 1) bên dưới.

## Hypothesized Root Cause

Dựa trên phân tích code:

1. **Flat list rendering**: `filteredCategories` được tạo bằng `categories.filter(c => c.type === type)` — chỉ lấy top-level categories, không duyệt `children`. Các `<SelectItem>` chỉ render danh mục cha.

2. **Không có recursive lookup**: `<Select value={categoryId}>` của shadcn/ui so khớp `value` với `value` của từng `<SelectItem>`. Vì danh mục con không được render thành `<SelectItem>`, giá trị không bao giờ khớp.

3. **Inconsistency với TransactionForm**: `TransactionForm` đã giải quyết vấn đề này bằng cách dùng `CategorySelector` với conversion `ApiCategory[]` → `CategoryWithChildren[]` (map `id` sang `string`, lowercase `type`, map `children` đệ quy). `TransactionModal` chưa được cập nhật tương tự.

4. **Type mismatch tiềm ẩn**: `ApiCategory.id` là `number`, nhưng `CategoryWithChildren.id` (kế thừa từ `Category` trong `types/index.ts`) là `string`. Cần convert khi mapping.

## Correctness Properties

Property 1: Bug Condition — Subcategory Displayed Correctly

_For any_ giao dịch `t` và danh sách `categories` mà `isBugCondition(t, categories)` trả về `true` (tức `String(t.categoryId)` không có trong top-level IDs), khi render `TransactionModal` với `transaction = t`, component SHALL hiển thị đúng tên danh mục con tương ứng với `t.categoryId` trong ô chọn danh mục — không hiển thị placeholder trống.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation — Parent Category Unaffected

_For any_ giao dịch `t` và danh sách `categories` mà `isBugCondition(t, categories)` trả về `false` (tức `String(t.categoryId)` có trong top-level IDs), khi render `TransactionModal` với `transaction = t`, component SHALL hiển thị đúng tên danh mục cha — hành vi giống hệt trước khi fix.

**Validates: Requirements 3.1**

## Fix Implementation

### Changes Required

**File**: `MoneyTrack_FE/components/transaction-modal.tsx`

**Specific Changes:**

1. **Thêm import `CategorySelector` và `CategoryWithChildren`**:
   ```ts
   import { CategorySelector, CategoryWithChildren } from '@/components/category-selector';
   ```

2. **Thêm hàm convert `ApiCategory[]` → `CategoryWithChildren[]`** (useMemo hoặc utility function):
   ```ts
   const toSelectorCategories = (apiCats: ApiCategory[]): CategoryWithChildren[] =>
     apiCats.map((c) => ({
       id: String(c.id),
       name: c.name,
       type: c.type.toLowerCase() as any,
       color: '',
       parentId: c.parentId ? String(c.parentId) : undefined,
       children: Array.isArray(c.children)
         ? c.children.map((child) => ({
             id: String(child.id),
             name: child.name,
             type: child.type ? child.type.toLowerCase() as any : c.type.toLowerCase() as any,
             color: '',
             parentId: String(child.parentId),
             children: [],
           }))
         : [],
     }));
   ```

3. **Tính `filteredSelectorCategories`** từ `filteredCategories` đã convert:
   ```ts
   const filteredSelectorCategories = useMemo(
     () => toSelectorCategories(filteredCategories),
     [filteredCategories]
   );
   ```

4. **Thay thế `<Select>/<SelectItem>` trong phần Category** bằng `CategorySelector`:
   ```tsx
   {/* Trước */}
   <Select value={categoryId} onValueChange={setCategoryId}>
     <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
     <SelectContent>
       {filteredCategories.map((c) => (
         <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
       ))}
     </SelectContent>
   </Select>

   {/* Sau */}
   <CategorySelector
     categories={filteredSelectorCategories}
     value={categoryId}
     onChange={setCategoryId}
     placeholder="Chọn danh mục"
   />
   ```

5. **Giữ nguyên** `handleSubmit` — `categoryId` vẫn là string, `Number(categoryId)` vẫn hoạt động đúng.

6. **Thêm import `useMemo`** từ React nếu chưa có.

## Testing Strategy

### Validation Approach

Chiến lược hai giai đoạn: (1) chạy exploratory tests trên code **chưa fix** để xác nhận root cause, (2) sau khi fix, chạy fix-checking và preservation-checking tests để xác nhận fix đúng và không có regression.

### Exploratory Bug Condition Checking

**Goal**: Xác nhận root cause trên code chưa fix — `<Select>` không render danh mục con nên không tìm thấy giá trị khớp.

**Test Plan**: Render `TransactionModal` với một giao dịch có `categoryId` là danh mục con. Assert rằng ô danh mục hiển thị trống. Chạy trên code **chưa fix** để quan sát failure.

**Test Cases**:
1. **Subcategory ID not in flat list**: Render modal với `transaction.categoryId = 15` (subcategory), `categories` chỉ có top-level IDs `[1, 2, 3]` → ô danh mục hiển thị trống (sẽ fail sau khi fix)
2. **Multiple subcategories**: Render với nhiều giao dịch khác nhau có subcategory IDs → tất cả đều hiển thị trống
3. **SelectItem count**: Assert số lượng `<SelectItem>` render bằng số danh mục cha, không bao gồm con

**Expected Counterexamples**:
- `categorySelectValue` là `""` hoặc `undefined` thay vì `"15"`
- Displayed text là placeholder "Chọn danh mục" thay vì tên danh mục con

### Fix Checking

**Goal**: Xác nhận rằng với mọi input thỏa `isBugCondition`, component đã fix hiển thị đúng tên danh mục con.

**Pseudocode:**
```
FOR ALL (transaction, categories) WHERE isBugCondition(transaction, categories) DO
  rendered ← renderTransactionModal_fixed(transaction, categories)
  ASSERT rendered.categoryDisplayText = findCategoryName(transaction.categoryId, categories)
  ASSERT rendered.categoryDisplayText ≠ "Chọn danh mục"
END FOR
```

### Preservation Checking

**Goal**: Xác nhận rằng với mọi input không thỏa `isBugCondition`, hành vi không thay đổi.

**Pseudocode:**
```
FOR ALL (transaction, categories) WHERE NOT isBugCondition(transaction, categories) DO
  ASSERT renderTransactionModal_fixed(transaction, categories).categoryDisplayText
       = renderTransactionModal_original(transaction, categories).categoryDisplayText
END FOR
```

**Testing Approach**: Property-based testing phù hợp cho preservation checking vì:
- Tự động sinh nhiều test case với các `categoryId` cha khác nhau
- Bắt được edge case (cha không có con, cha có nhiều con, v.v.)
- Đảm bảo hành vi không đổi trên toàn bộ input domain

**Test Cases**:
1. **Parent category preserved**: Giao dịch có `categoryId` là danh mục cha → tên vẫn hiển thị đúng sau fix
2. **Type filter preserved**: Thay đổi `type` → danh sách lọc đúng, `categoryId` reset về `""`
3. **Submit payload preserved**: Submit form → `categoryId` trong payload là `number`
4. **New transaction modal**: `transaction = null` → `categoryId` bắt đầu là `""`

### Unit Tests

- Test `toSelectorCategories`: convert đúng `id` sang string, lowercase `type`, map `children` đệ quy
- Test render `CategorySelector` thay vì `Select` trong phần danh mục
- Test hiển thị đúng tên danh mục con khi `categoryId` là subcategory ID
- Test edge case: `children = undefined` hoặc `children = []` không gây lỗi

### Property-Based Tests

- Sinh ngẫu nhiên `ApiCategory[]` với cấu trúc cha-con, verify `toSelectorCategories` luôn map đúng (id là string, children là array)
- Sinh ngẫu nhiên `transaction.categoryId` là top-level ID, verify displayed text luôn khớp tên danh mục cha (preservation property)
- Sinh ngẫu nhiên `transaction.categoryId` là subcategory ID, verify displayed text luôn khớp tên danh mục con (fix property)

### Integration Tests

- Mở modal edit giao dịch có subcategory → ô danh mục hiển thị đúng tên
- Thay đổi type trong modal → danh sách cập nhật, categoryId reset
- Submit sau khi chọn danh mục con → API nhận đúng `categoryId` dạng number
- Trang tạo giao dịch (`/transactions/create`) không bị ảnh hưởng
