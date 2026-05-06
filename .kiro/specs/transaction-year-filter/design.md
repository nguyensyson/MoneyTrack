# Design Document

## Feature: transaction-year-filter

---

## Overview

Tính năng này bổ sung một Year Filter dropdown vào trang giao dịch (`/transactions`) của MoneyTrack FE, cho phép người dùng lọc danh sách giao dịch theo cả tháng lẫn năm. Hiện tại, trang chỉ lọc theo tháng và luôn dùng năm hiện tại.

Thay đổi bao gồm hai phần:

1. **Frontend** – thêm state `year`, render dropdown Year Filter, cập nhật tất cả các nơi dùng `year` (API call, tiêu đề, export).
2. **Backend** – cập nhật `TransactionController` và `TransactionServiceImpl` để nhận và xử lý tham số `year` riêng biệt thay vì chỉ dựa vào năm hiện tại khi parse `month`.

---

## Architecture

```mermaid
flowchart TD
    A[User chọn Year Filter] --> B[year state thay đổi]
    B --> C[page reset về 0]
    B --> D[useFetch re-trigger]
    D --> E[transactionsApi.getAll\n{ month, year, categoryId, page }]
    E --> F[GET /api/transactions\n?month=M&year=Y&categoryId=C]
    F --> G[TransactionController.getTransactions]
    G --> H[TransactionServiceImpl.getTransactions\nresolveYearMonth(month, year)]
    H --> I[TransactionRepository query\nstartDate..endDate]
    I --> J[Page<TransactionResponse>]
    J --> K[Render Transaction_List\ntiêu đề: Tháng M/Y]

    L[User click Export CSV] --> M[transactionsApi.exportCsv\n{ month: 'Y-MM', categoryId }]
    M --> N[GET /api/transactions/export\n?month=Y-MM]
    N --> O[File CSV: transactions_Y-MM.csv]
```

Không có thay đổi về kiến trúc tổng thể — đây là mở rộng tham số của luồng hiện có.

---

## Components and Interfaces

### Frontend: `TransactionsContent` (`app/(main)/transactions/page.tsx`)

**Thay đổi state:**

```typescript
// Trước
const [year] = useState(now.getFullYear()); // không thể thay đổi

// Sau
const [year, setYear] = useState(now.getFullYear()); // có thể thay đổi
```

**Year Filter dropdown** (thêm vào khu vực Filters, sau Month Filter):

```tsx
<Select
  value={String(year)}
  onValueChange={(v) => { setYear(Number(v)); setPage(0); }}
>
  <SelectTrigger className="w-28">
    <SelectValue placeholder="Năm" />
  </SelectTrigger>
  <SelectContent>
    {getYearOptions(now.getFullYear()).map((y) => (
      <SelectItem key={y} value={String(y)}>
        {y}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Helper function** (pure, dễ test):

```typescript
/** Trả về mảng 3 năm gần nhất, bắt đầu từ currentYear giảm dần */
export function getYearOptions(currentYear: number): number[] {
  return [currentYear, currentYear - 1, currentYear - 2];
}
```

**Tiêu đề danh sách** (cập nhật):

```tsx
// Trước
<ChartCard title={`Tháng ${month}/${year}`}>

// Sau — không thay đổi cú pháp, nhưng year giờ là state động
<ChartCard title={`Tháng ${month}/${year}`}>
```

**Export CSV** (cập nhật `monthStr` đã dùng `year` state — không thay đổi logic, chỉ cần đảm bảo `year` là state động):

```typescript
const monthStr = `${year}-${String(month).padStart(2, '0')}`;
```

### Backend: `TransactionController`

**Thay đổi endpoint `GET /api/transactions`:**

```java
// Trước
@GetMapping
public ResponseEntity<Page<TransactionResponse>> getTransactions(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestParam(defaultValue = "current") String month,
        @RequestParam(required = false) Long categoryId,
        @PageableDefault(size = 20, sort = "date") Pageable pageable)

// Sau
@GetMapping
public ResponseEntity<Page<TransactionResponse>> getTransactions(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestParam(required = false) Integer month,
        @RequestParam(required = false) Integer year,
        @RequestParam(required = false) Long categoryId,
        @PageableDefault(size = 20, sort = "date") Pageable pageable)
```

Tham số `month` chuyển từ `String` sang `Integer` (1–12), `year` là `Integer` mới. Cả hai đều optional — nếu null thì dùng tháng/năm hiện tại.

### Backend: `TransactionService` interface

```java
// Trước
Page<Transaction> getTransactions(String userEmail, String month,
                                  Long categoryId, Pageable pageable);

// Sau
Page<Transaction> getTransactions(String userEmail, Integer month, Integer year,
                                  Long categoryId, Pageable pageable);
```

### Backend: `TransactionServiceImpl`

Thay thế `resolveMonth(String month)` bằng `resolveYearMonth(Integer month, Integer year)`:

```java
private YearMonth resolveYearMonth(Integer month, Integer year) {
    YearMonth now = YearMonth.now();
    int resolvedYear  = (year  != null) ? year  : now.getYear();
    int resolvedMonth = (month != null) ? month : now.getMonthValue();
    return YearMonth.of(resolvedYear, resolvedMonth);
}
```

Logic cũ (`"current"`, `"previous"`, numeric string) được thay bằng logic đơn giản hơn với kiểu `Integer`.

---

## Data Models

Không có thay đổi về entity hay schema database. Tất cả thay đổi nằm ở lớp request/response parameter.

**Frontend `TransactionFilter`** (đã có sẵn trong `lib/types/api.ts`, không cần thay đổi):

```typescript
export interface TransactionFilter {
  month?: number;   // 1–12
  year?: number;    // e.g. 2025
  categoryId?: number;
  page?: number;
  size?: number;
}
```

**Backend request params** (sau thay đổi):

| Param       | Type    | Required | Default        | Mô tả                    |
|-------------|---------|----------|----------------|--------------------------|
| `month`     | Integer | No       | tháng hiện tại | 1–12                     |
| `year`      | Integer | No       | năm hiện tại   | e.g. 2025                |
| `categoryId`| Long    | No       | null           | lọc theo danh mục        |
| `page`      | int     | No       | 0              | trang (0-indexed)        |
| `size`      | int     | No       | 20             | số item mỗi trang        |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Year options list is always 3 descending years from current year

*For any* year value `Y`, calling `getYearOptions(Y)` should return exactly `[Y, Y-1, Y-2]` — a list of length 3, in descending order, starting from `Y`.

**Validates: Requirements 1.2**

---

### Property 2: API is called with both month and year for any filter combination

*For any* combination of selected month (1–12) and selected year (from the 3 available options), the `transactionsApi.getAll` call should include both `month` and `year` in its params object with the exact values that were selected.

**Validates: Requirements 2.1, 2.4**

---

### Property 3: Page resets to 0 on any year change

*For any* current page value `p > 0`, when the user selects any year from the Year Filter, the page state should become `0`.

**Validates: Requirements 2.2**

---

### Property 4: Transaction list title always reflects current month and year filter

*For any* month value (1–12) and any year value, the title rendered in the ChartCard should equal the string `Tháng ${month}/${year}`.

**Validates: Requirements 3.1**

---

### Property 5: Export uses correctly formatted year-month string

*For any* selected year `Y` and month `M`, the export API call's `month` parameter should equal `${Y}-${String(M).padStart(2, '0')}`, and the resulting filename should match `transactions_${Y}-${MM}.csv` (or `transactions_${Y}-${MM}_${categoryName}.csv` when a category filter is active).

**Validates: Requirements 4.1, 4.2**

---

## Error Handling

### Frontend

- **Year Filter** sử dụng cùng pattern `Select` với Month Filter — không có trạng thái lỗi riêng vì giá trị luôn là một trong 3 lựa chọn hợp lệ.
- Nếu API trả về lỗi khi đổi năm, lỗi đã được xử lý bởi `useFetch` hook hiện có (hiển thị `error` message).
- Export lỗi đã được xử lý bởi `exportState === 'error'` hiện có.

### Backend

- Nếu `month` nằm ngoài khoảng 1–12, Spring sẽ trả về `400 Bad Request` tự động (type mismatch hoặc có thể thêm `@Min(1) @Max(12)` validation).
- Nếu `year` là giá trị không hợp lý (ví dụ âm), `YearMonth.of()` sẽ ném `DateTimeException` — nên bắt và trả về `400 Bad Request` qua `GlobalExceptionHandler`.
- Nếu cả `month` và `year` đều null, service dùng tháng/năm hiện tại — hành vi backward-compatible.

---

## Testing Strategy

### Unit Tests (Example-based)

**Frontend:**
- Render `TransactionsContent`, assert Year Filter dropdown tồn tại trong DOM (Requirement 1.1).
- Assert giá trị mặc định của Year Filter bằng `new Date().getFullYear()` (Requirement 1.3).
- Mock API, chọn năm khác, assert danh sách được re-fetch với năm mới (Requirement 2.3).

**Backend:**
- `resolveYearMonth(null, null)` → trả về `YearMonth.now()`.
- `resolveYearMonth(3, 2023)` → trả về `YearMonth.of(2023, 3)`.
- `resolveYearMonth(12, null)` → trả về tháng 12 của năm hiện tại.

### Property-Based Tests

Sử dụng thư viện **fast-check** (TypeScript/JavaScript) cho frontend và **jqwik** (Java) cho backend.

Mỗi property test chạy tối thiểu **100 iterations**.

**Property 1 — `getYearOptions` (fast-check):**
```typescript
// Feature: transaction-year-filter, Property 1: year options list is always 3 descending years
fc.assert(fc.property(
  fc.integer({ min: 2000, max: 2100 }),
  (year) => {
    const options = getYearOptions(year);
    return options.length === 3
      && options[0] === year
      && options[1] === year - 1
      && options[2] === year - 2;
  }
));
```

**Property 2 — API params include month and year (fast-check + mock):**
```typescript
// Feature: transaction-year-filter, Property 2: API called with both month and year
fc.assert(fc.property(
  fc.integer({ min: 1, max: 12 }),
  fc.integer({ min: 2000, max: 2100 }),
  (month, year) => {
    const params = buildApiParams(month, year, undefined, 0, PAGE_SIZE);
    return params.month === month && params.year === year;
  }
));
```

**Property 3 — Page resets to 0 (fast-check):**
```typescript
// Feature: transaction-year-filter, Property 3: page resets to 0 on year change
fc.assert(fc.property(
  fc.integer({ min: 1, max: 100 }),
  fc.integer({ min: 2000, max: 2100 }),
  (currentPage, newYear) => {
    const { page } = simulateYearChange(currentPage, newYear);
    return page === 0;
  }
));
```

**Property 4 — Title format (fast-check):**
```typescript
// Feature: transaction-year-filter, Property 4: title reflects current month and year
fc.assert(fc.property(
  fc.integer({ min: 1, max: 12 }),
  fc.integer({ min: 2000, max: 2100 }),
  (month, year) => {
    const title = buildTitle(month, year);
    return title === `Tháng ${month}/${year}`;
  }
));
```

**Property 5 — Export format (fast-check):**
```typescript
// Feature: transaction-year-filter, Property 5: export uses correctly formatted year-month string
fc.assert(fc.property(
  fc.integer({ min: 1, max: 12 }),
  fc.integer({ min: 2000, max: 2100 }),
  fc.option(fc.string({ minLength: 1 })),
  (month, year, categoryName) => {
    const monthStr = buildMonthStr(year, month);
    const filename = buildExportFilename(monthStr, categoryName ?? undefined);
    const expected = `${year}-${String(month).padStart(2, '0')}`;
    const expectedFile = categoryName
      ? `transactions_${expected}_${categoryName}.csv`
      : `transactions_${expected}.csv`;
    return monthStr === expected && filename === expectedFile;
  }
));
```

**Backend Property — `resolveYearMonth` (jqwik):**
```java
// Feature: transaction-year-filter, Property 2: resolveYearMonth returns correct YearMonth
@Property
void resolveYearMonthReturnsCorrectValue(
    @ForAll @IntRange(min = 1, max = 12) int month,
    @ForAll @IntRange(min = 2000, max = 2100) int year) {
  YearMonth result = service.resolveYearMonth(month, year);
  assertThat(result).isEqualTo(YearMonth.of(year, month));
}
```

### Integration Tests

- End-to-end: gọi `GET /api/transactions?month=3&year=2023` với dữ liệu seed, assert chỉ trả về giao dịch tháng 3/2023.
- Export: gọi `GET /api/transactions/export?month=2023-03`, assert filename header và nội dung CSV.
