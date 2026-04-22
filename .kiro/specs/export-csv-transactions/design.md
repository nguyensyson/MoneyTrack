# Design Document

## Overview

This feature adds CSV export functionality to the MoneyTrack application. Users can export their transaction list for a given month (optionally filtered by category) from the Transactions page. The backend provides a new GET endpoint `/api/transactions/export` that returns a CSV file. The frontend adds an "Export CSV" button and a modal to show export progress and trigger the download.

## Architecture

### Backend (Spring Boot)

- **Controller Layer**: `TransactionController` gains a new `@GetMapping("/export")` method.
- **Service Layer**: `TransactionService` gains a new `exportTransactionsCsv(...)` method that queries transactions and builds CSV content.
- **Repository Layer**: Reuses existing `TransactionRepository.findByUserAndDeleteFlagAndDateRangeAndOptionalCategory(...)` query, but without pagination (fetch all matching records).
- **Response**: Returns `ResponseEntity<byte[]>` with `Content-Type: text/csv` and `Content-Disposition: attachment; filename=...`.

### Frontend (Next.js)

- **API Client**: `MoneyTrack_FE/lib/api/transactions.ts` gains a new `exportCsv(...)` function that calls the backend with `responseType: 'blob'`.
- **UI Component**: `MoneyTrack_FE/app/(main)/transactions/page.tsx` adds an "Export CSV" button in the filter row.
- **Modal Component**: A new inline modal (using `Dialog` from `@/components/ui/dialog`) shows three states:
  1. Loading: "Đang chuẩn bị file CSV... Vui lòng chờ." + spinner
  2. Success: "File CSV đã sẵn sàng" + "Tải file" button
  3. Error: "Không thể export file. Vui lòng thử lại."

## Components and Interfaces

### Backend

#### 1. TransactionController

**New Method:**

```java
@GetMapping("/export")
public ResponseEntity<byte[]> exportCsv(
    @AuthenticationPrincipal UserDetails userDetails,
    @RequestParam String month,
    @RequestParam(required = false) Long categoryId
) throws IOException
```

- Validates `month` format (must match `yyyy-MM` regex).
- Calls `transactionService.exportTransactionsCsv(userDetails.getUsername(), month, categoryId)`.
- Returns CSV bytes with appropriate headers.

#### 2. TransactionService

**New Method:**

```java
public byte[] exportTransactionsCsv(String userEmail, String month, Long categoryId) throws IOException
```

- Parses `month` string to `YearMonth`, then derives `startDate` and `endDate`.
- Fetches user by email.
- Queries transactions using existing repository method (non-paginated).
- Builds CSV content:
  - Header: `Date,Title,Category,Type,Amount,Note`
  - Rows: one per transaction, fields escaped/quoted as needed.
- Returns CSV as `byte[]` (UTF-8 encoded).

**CSV Field Mapping:**

| CSV Column | Entity Field                  | Notes                                      |
|------------|-------------------------------|--------------------------------------------|
| Date       | `transaction.date`            | Format as `yyyy-MM-dd`                     |
| Title      | `transaction.description`     | If null/empty, use `category.name`         |
| Category   | `category.name`               | Fetch via `transaction.getCategory()`      |
| Type       | `transaction.type`            | Enum: `INCOME`, `EXPENSE`, `DEBT`          |
| Amount     | `transaction.amount`          | BigDecimal, format as plain string         |
| Note       | `transaction.description`     | Same as Title (or empty if null)           |

**Filename Logic:**

- If `categoryId` is null: `transactions_<month>.csv` (e.g. `transactions_2026-04.csv`)
- If `categoryId` is provided: `transactions_<month>_<categoryName>.csv` (e.g. `transactions_2026-04_Food.csv`)
  - Fetch category name from the first transaction's category, or query `CategoryRepository` if needed.

#### 3. TransactionRepository

**Reuse Existing Query (Non-Paginated Variant):**

The existing query is paginated. We need a non-paginated version:

```java
@Query("""
    SELECT t FROM Transaction t
    JOIN FETCH t.category c
    WHERE t.user = :user
      AND t.deleteFlag = :deleteFlag
      AND t.date >= :startDate
      AND t.date <= :endDate
      AND (:categoryId IS NULL OR t.category.id = :categoryId)
    ORDER BY t.date ASC
    """)
List<Transaction> findAllByUserAndDeleteFlagAndDateRangeAndOptionalCategory(
    @Param("user") User user,
    @Param("deleteFlag") DeleteFlag deleteFlag,
    @Param("startDate") LocalDate startDate,
    @Param("endDate") LocalDate endDate,
    @Param("categoryId") Long categoryId
);
```

- Returns `List<Transaction>` instead of `Page<Transaction>`.
- Orders by `date ASC` for chronological CSV output.
- Uses `JOIN FETCH t.category` to avoid N+1 queries.

### Frontend

#### 1. API Client (`lib/api/transactions.ts`)

**New Function:**

```typescript
exportCsv: (params: { month: string; categoryId?: number }) =>
  apiClient
    .get('/api/transactions/export', {
      params,
      responseType: 'blob',
    })
    .then((r) => r.data as Blob)
```

- `month` is formatted as `yyyy-MM` (e.g. `2026-04`).
- `categoryId` is optional; omit if "Tất cả danh mục" is selected.
- Returns a `Blob` containing the CSV file.

#### 2. Transactions Page (`app/(main)/transactions/page.tsx`)

**New State:**

```typescript
const [exportModalOpen, setExportModalOpen] = useState(false);
const [exportState, setExportState] = useState<'loading' | 'success' | 'error'>('loading');
const [csvBlob, setCsvBlob] = useState<Blob | null>(null);
const [csvFilename, setCsvFilename] = useState<string>('');
```

**New Handler:**

```typescript
const handleExport = async () => {
  setExportModalOpen(true);
  setExportState('loading');
  setCsvBlob(null);

  try {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const blob = await transactionsApi.exportCsv({
      month: monthStr,
      categoryId: categoryId,
    });

    // Extract filename from Content-Disposition header if available,
    // or construct default filename
    const filename = `transactions_${monthStr}${categoryId ? `_${categories?.find(c => c.id === categoryId)?.name}` : ''}.csv`;
    
    setCsvBlob(blob);
    setCsvFilename(filename);
    setExportState('success');
  } catch (err) {
    console.error(err);
    setExportState('error');
  }
};

const handleDownload = () => {
  if (!csvBlob) return;
  const url = URL.createObjectURL(csvBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = csvFilename;
  a.click();
  URL.revokeObjectURL(url);
};
```

**New UI Elements:**

- **Export Button** (in filter row):
  ```tsx
  <Button
    onClick={handleExport}
    disabled={exportModalOpen && exportState === 'loading'}
    variant="outline"
  >
    Export CSV
  </Button>
  ```

- **Export Modal** (using `Dialog` component):
  ```tsx
  <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
    <DialogContent showCloseButton={exportState !== 'loading'}>
      <DialogHeader>
        <DialogTitle>Export CSV</DialogTitle>
      </DialogHeader>
      {exportState === 'loading' && (
        <div className="flex items-center gap-3">
          <Spinner />
          <p>Đang chuẩn bị file CSV... Vui lòng chờ.</p>
        </div>
      )}
      {exportState === 'success' && (
        <div className="space-y-4">
          <p>File CSV đã sẵn sàng</p>
          <Button onClick={handleDownload} className="w-full">
            Tải file
          </Button>
        </div>
      )}
      {exportState === 'error' && (
        <p className="text-red-500">Không thể export file. Vui lòng thử lại.</p>
      )}
    </DialogContent>
  </Dialog>
  ```

## Data Models

No new entities or DTOs are required. The feature reuses existing `Transaction`, `Category`, and `User` entities.

**CSV Row Structure:**

```
Date,Title,Category,Type,Amount,Note
2026-04-01,Lunch,Food,EXPENSE,50000,Lunch at restaurant
2026-04-02,Salary,Income,INCOME,10000000,Monthly salary
```

## Error Handling

### Backend

1. **Missing or Invalid `month` Param:**
   - Throw `BadRequestException("Invalid month format. Expected yyyy-MM")`.
   - Returns HTTP 400 with error message via `GlobalExceptionHandler`.

2. **User Not Found:**
   - Throw `ResourceNotFoundException("User not found: <email>")`.
   - Returns HTTP 404.

3. **No Transactions Found:**
   - Return CSV with header only (not an error).

4. **IOException During CSV Generation:**
   - Catch and wrap in `RuntimeException` or return HTTP 500.
   - Log error for debugging.

### Frontend

1. **API Call Fails (Network/Auth Error):**
   - Catch error in `handleExport`.
   - Set `exportState` to `'error'`.
   - Display error message in modal.

2. **Blob is Empty or Invalid:**
   - Check `blob.size > 0` before setting success state.
   - If size is 0, treat as error.

3. **User Closes Modal Mid-Request:**
   - Allow closing only when `exportState !== 'loading'`.
   - Reset state when modal closes.

## Testing Strategy

### Backend

1. **Unit Tests (TransactionService):**
   - Test `exportTransactionsCsv` with:
     - Valid month, no category filter → returns CSV with all transactions.
     - Valid month, specific category → returns CSV with filtered transactions.
     - No transactions found → returns CSV with header only.
     - Invalid month format → throws `BadRequestException`.

2. **Integration Tests (TransactionController):**
   - Test `/api/transactions/export` endpoint with:
     - Valid JWT, valid params → returns 200 with CSV file.
     - Missing JWT → returns 401.
     - Invalid month format → returns 400.
     - Valid params, no data → returns 200 with header-only CSV.

### Frontend

1. **Manual Testing:**
   - Click Export CSV with various filter states (all categories, specific category).
   - Verify modal shows loading → success → download works.
   - Verify error state when backend is down or returns error.
   - Verify button is disabled during export.

2. **Edge Cases:**
   - Export with no transactions → should download CSV with header only.
   - Export with special characters in category name → filename should be safe.
   - Rapid clicks on Export button → should not trigger multiple requests.

## Security Considerations

1. **Authentication:**
   - Endpoint requires valid JWT token.
   - User can only export their own transactions (enforced via `@AuthenticationPrincipal`).

2. **Input Validation:**
   - `month` param is validated against regex `^\d{4}-\d{2}$`.
   - `categoryId` is optional; if provided, must be a valid Long.

3. **Data Leakage:**
   - No `email` param is accepted; user identity is derived from JWT.
   - Transactions are filtered by `user` entity, ensuring isolation.

## Performance Considerations

1. **Query Optimization:**
   - Use `JOIN FETCH` to load category in a single query.
   - Limit export to one month at a time (no date range spanning multiple months).

2. **CSV Generation:**
   - Use `StringBuilder` or `StringWriter` for efficient string concatenation.
   - For large datasets (>10k rows), consider streaming response (future enhancement).

3. **Frontend:**
   - Blob is held in memory temporarily; revoke object URL after download to free memory.
   - Disable export button during request to prevent duplicate calls.

## Future Enhancements

1. **Date Range Export:**
   - Allow exporting multiple months or custom date ranges.

2. **Excel Format:**
   - Add option to export as `.xlsx` instead of `.csv`.

3. **Email Delivery:**
   - For large exports, generate file asynchronously and email download link.

4. **Export History:**
   - Track export requests and allow re-downloading recent exports.
