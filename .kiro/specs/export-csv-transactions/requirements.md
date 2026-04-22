# Requirements Document

## Introduction

Tính năng Export CSV cho phép người dùng xuất danh sách giao dịch của tháng đang xem ra file CSV. Người dùng có thể lọc theo danh mục trước khi export. Backend Spring Boot cung cấp API trả về file CSV, frontend Next.js thêm nút Export vào trang Transactions và hiển thị popup trạng thái trong quá trình chuẩn bị và tải file.

## Requirements

### Requirement 1 – Backend API Export CSV

**User Story:** As a USER, I want to call an API to export my transactions for a specific month as a CSV file, so that I can download and analyze my financial data offline.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/transactions/export` with a valid JWT token, `month` param (format `yyyy-MM`, e.g. `2026-04`), THEN the system SHALL return a CSV file with `Content-Type: text/csv` and `Content-Disposition: attachment; filename="transactions_2026-04.csv"`.
2. WHEN the `categoryId` query param is provided, THEN the system SHALL filter transactions by that category and include the category name in the filename, e.g. `transactions_2026-04_Food.csv`.
3. WHEN `categoryId` is not provided, THEN the system SHALL export all transactions for that month regardless of category.
4. WHEN the export is requested, THEN the CSV SHALL include the following columns in order: `Date,Title,Category,Type,Amount,Note` — mapped from `transaction.date`, `transaction.description`, `category.name`, `transaction.type`, `transaction.amount`, `transaction.description`.
5. WHEN there are no transactions matching the filter, THEN the system SHALL still return a valid CSV file containing only the header row.
6. WHEN the JWT token is missing or invalid, THEN the system SHALL return HTTP 401.
7. WHEN the `month` param is missing or has an invalid format, THEN the system SHALL return HTTP 400 with an error message.
8. WHEN the authenticated user requests export, THEN the system SHALL only export transactions belonging to that user (identified via `@AuthenticationPrincipal`), ignoring any `email` param.
9. WHEN building the export query, THEN the system SHALL reuse the existing `TransactionRepository.findByUserAndDeleteFlagAndDateRangeAndOptionalCategory` query (non-paginated variant).

### Requirement 2 – Frontend Export Button

**User Story:** As a USER, I want to see an Export CSV button on the Transactions page near the existing filters, so that I can trigger an export with the current filter state.

#### Acceptance Criteria

1. WHEN the Transactions page renders, THEN the system SHALL display an "Export CSV" button in the filter row, adjacent to the month and category selectors.
2. WHEN the user clicks Export CSV, THEN the system SHALL read the current `month`, `year`, and `categoryId` state from the page.
3. WHEN `categoryId` is `undefined` (i.e. "Tất cả danh mục" is selected), THEN the system SHALL NOT include `categoryId` in the export request params.
4. WHEN a specific category is selected, THEN the system SHALL include `categoryId` in the export request params.
5. WHEN the export is in progress, THEN the Export CSV button SHALL be disabled to prevent duplicate requests.

### Requirement 3 – Export Progress Popup

**User Story:** As a USER, I want to see a popup showing the export status, so that I know when the file is ready to download.

#### Acceptance Criteria

1. WHEN the user clicks Export CSV, THEN the system SHALL immediately open a modal dialog showing "Đang chuẩn bị file CSV... Vui lòng chờ." with a loading spinner.
2. WHEN the API call completes successfully, THEN the system SHALL update the modal to show "File CSV đã sẵn sàng" and display a "Tải file" button.
3. WHEN the user clicks "Tải file", THEN the system SHALL trigger a browser file download of the CSV blob received from the API.
4. WHEN the API call fails, THEN the system SHALL update the modal to show the error message "Không thể export file. Vui lòng thử lại."
5. WHEN the modal is in success or error state, THEN the system SHALL display a close/dismiss button so the user can close the modal.
6. WHEN the modal is in loading state, THEN the system SHALL NOT show a close button (to prevent accidental dismissal mid-request).
7. WHEN the modal is closed after a successful download, THEN the system SHALL reset its internal state so the next export starts fresh.

### Requirement 4 – Frontend API Integration

**User Story:** As a developer, I want the export API call to follow the existing axios/apiClient pattern, so that auth headers are automatically attached and the code stays consistent.

#### Acceptance Criteria

1. WHEN the export function is called, THEN the system SHALL use `apiClient` from `@/lib/api/client` with `responseType: 'blob'` to receive the CSV binary data.
2. WHEN the export function is added, THEN it SHALL be placed in `MoneyTrack_FE/lib/api/transactions.ts` alongside existing transaction API methods.
3. WHEN constructing the `month` param for the API, THEN the system SHALL format it as `yyyy-MM` (e.g. `2026-04`) using the current `month` (number) and `year` (number) state values from the page.
4. WHEN the blob is received, THEN the system SHALL create a temporary object URL, programmatically click a hidden anchor element to trigger download, then revoke the URL.
