# Implementation Plan

- [x] 1. Add non-paginated export query to TransactionRepository





  - Add `findAllByUserAndDeleteFlagAndDateRangeAndOptionalCategory` method returning `List<Transaction>` with `JOIN FETCH t.category` to avoid N+1
  - Order results by `t.date ASC` for chronological CSV output
  - _Requirements: 1.9_

- [x] 2. Implement CSV export logic in TransactionService





  - [x] 2.1 Add `exportTransactionsCsv(String userEmail, String month, Long categoryId)` method


    - Parse `month` string (format `yyyy-MM`) to `YearMonth`; throw `BadRequestException` if format is invalid
    - Fetch user by email; throw `ResourceNotFoundException` if not found
    - Call the new repository method from task 1 with `DeleteFlag.ACTIVE`
    - _Requirements: 1.1, 1.7, 1.8_
  - [x] 2.2 Build CSV byte array from transaction list

    - Write header row: `Date,Title,Category,Type,Amount,Note`
    - Map each transaction: `date` → `yyyy-MM-dd`, `description` (or `categoryName` if null) → Title, `category.name` → Category, `type` → Type, `amount` → Amount, `description` → Note
    - Return UTF-8 encoded `byte[]`; return header-only CSV if list is empty
    - _Requirements: 1.4, 1.5_
  - [x] 2.3 Build export filename

    - If `categoryId` is null: `transactions_<month>.csv`
    - If `categoryId` is provided: `transactions_<month>_<categoryName>.csv` using the category name from the first transaction
    - _Requirements: 1.1, 1.2_

- [x] 3. Add export endpoint to TransactionController





  - Add `@GetMapping("/export")` method with `@AuthenticationPrincipal UserDetails`, `@RequestParam String month`, `@RequestParam(required = false) Long categoryId`
  - Call `transactionService.exportTransactionsCsv(...)` and return `ResponseEntity<byte[]>` with `Content-Type: text/csv` and `Content-Disposition: attachment; filename=<filename>`
  - _Requirements: 1.1, 1.2, 1.3, 1.6_

- [x] 4. Add `exportCsv` function to frontend transactions API





  - In `MoneyTrack_FE/lib/api/transactions.ts`, add `exportCsv(params: { month: string; categoryId?: number })` that calls `apiClient.get('/api/transactions/export', { params, responseType: 'blob' })` and returns the `Blob`
  - _Requirements: 4.1, 4.2_

- [x] 5. Add Export CSV button and modal to Transactions page





  - [x] 5.1 Add export state variables to `TransactionsContent`


    - Add `exportModalOpen`, `exportState` (`'loading' | 'success' | 'error'`), `csvBlob`, `csvFilename` state
    - _Requirements: 3.1, 3.7_
  - [x] 5.2 Implement `handleExport` async function


    - Format `month` param as `yyyy-MM` using current `year` and `month` state
    - Call `transactionsApi.exportCsv({ month: monthStr, categoryId })` — omit `categoryId` if undefined
    - On success: set `csvBlob`, `csvFilename`, `exportState = 'success'`
    - On error: set `exportState = 'error'`
    - _Requirements: 2.2, 2.3, 2.4, 4.3_

  - [x] 5.3 Implement `handleDownload` function


    - Create object URL from `csvBlob`, create and click a temporary `<a>` element with `download` attribute, then revoke the URL
    - _Requirements: 3.3, 4.4_
  - [x] 5.4 Add Export CSV button to the filter row


    - Place button after the category selector; disable it when `exportState === 'loading'` and modal is open
    - _Requirements: 2.1, 2.5_
  - [x] 5.5 Add export modal using `Dialog` component


    - Import `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` from `@/components/ui/dialog` and `Spinner` from `@/components/ui/spinner`
    - Render three states: loading (spinner + message), success ("File CSV đã sẵn sàng" + "Tải file" button), error (error message)
    - Show close button only when `exportState !== 'loading'`; reset state on modal close
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7_
