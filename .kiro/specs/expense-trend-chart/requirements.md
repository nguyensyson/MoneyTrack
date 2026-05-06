# Requirements Document

## Introduction

Tính năng này bổ sung một biểu đồ đường (line chart) vào trang chủ của người dùng (`MoneyTrack_FE/app/(main)/page.tsx`), hiển thị tổng số tiền chi tiêu (EXPENSE) theo từng ngày trong tháng, so sánh giữa tháng hiện tại và tháng trước. Dữ liệu được lấy từ một API mới `GET /api/transactions/expense-trend`, truy vấn từ database và trả về mảng tổng tiền theo ngày cho cả hai tháng. Phía frontend hiển thị biểu đồ bằng thư viện `chart.js` + `react-chartjs-2`, với đường cong cubic interpolation, tooltip khi hover, và legend phân biệt hai tháng.

## Glossary

- **Expense_Trend_API**: Endpoint `GET /api/transactions/expense-trend` trả về tổng chi tiêu theo từng ngày của tháng hiện tại và tháng trước.
- **ExpenseTrendChart**: React component độc lập hiển thị biểu đồ đường so sánh chi tiêu hai tháng.
- **DailyExpenseTotal**: Giá trị tổng tiền chi tiêu (EXPENSE) của một ngày cụ thể trong tháng, bằng 0 nếu ngày đó không có giao dịch.
- **ExpenseTrendResponse**: Đối tượng JSON gồm hai mảng `currentMonth` và `previousMonth`, mỗi mảng chứa các `DailyExpenseTotal` theo thứ tự ngày 1 đến ngày cuối tháng.
- **Transaction_Service**: Service phía backend xử lý logic nghiệp vụ liên quan đến giao dịch.
- **Transaction_Repository**: Repository phía backend thực hiện truy vấn database cho giao dịch.
- **Transaction**: Bản ghi giao dịch tài chính, có trường `type` (EXPENSE/INCOME/DEBT), `amount`, `date` (LocalDate), `user`, và `deleteFlag`.
- **Authenticated_User**: Người dùng đã đăng nhập, được xác thực qua JWT token hợp lệ.

---

## Requirements

### Requirement 1: API Trả Về Xu Hướng Chi Tiêu Theo Ngày

**User Story:** As a user, I want to retrieve my daily expense totals for the current and previous month, so that I can compare my spending trends over time.

#### Acceptance Criteria

1. WHEN a request is sent to `GET /api/transactions/expense-trend` with a valid JWT token, THE Expense_Trend_API SHALL return an HTTP 200 response with an `ExpenseTrendResponse` JSON object.
2. THE Expense_Trend_API SHALL return `currentMonth` as an array of `DailyExpenseTotal` values, indexed from day 1 to the last day of the current calendar month.
3. THE Expense_Trend_API SHALL return `previousMonth` as an array of `DailyExpenseTotal` values, indexed from day 1 to the last day of the previous calendar month.
4. WHEN a day has no EXPENSE transactions, THE Expense_Trend_API SHALL return `0` for that day's position in the array.
5. THE Expense_Trend_API SHALL only include transactions where `type = EXPENSE` and `deleteFlag = ACTIVE` in the aggregation.
6. THE Expense_Trend_API SHALL only include transactions belonging to the Authenticated_User making the request.
7. WHEN a request is made without a valid JWT token, THE Expense_Trend_API SHALL return an HTTP 401 Unauthorized response.

---

### Requirement 2: Truy Vấn Database Và Tổng Hợp Dữ Liệu

**User Story:** As a system operator, I want the expense trend query to aggregate data correctly, so that the chart reflects accurate daily totals.

#### Acceptance Criteria

1. THE Transaction_Service SHALL compute daily expense totals by grouping transactions on the `date` field and summing `amount` for each day.
2. THE Transaction_Service SHALL produce a result array whose length equals the number of days in the target month (28, 29, 30, or 31).
3. THE Transaction_Service SHALL fill positions with no matching transactions with the value `0`.
4. THE Transaction_Service SHALL determine "current month" and "previous month" based on the server's current date at the time of the request.
5. THE Transaction_Repository SHALL use a JPQL aggregation query (GROUP BY day) to compute per-day totals, rather than loading all transaction records into memory for in-application aggregation.

---

### Requirement 3: Component Biểu Đồ Đường Độc Lập

**User Story:** As a user, I want to see a smooth line chart comparing my spending day by day between this month and last month, so that I can visually identify spending patterns.

#### Acceptance Criteria

1. THE ExpenseTrendChart SHALL be implemented as a separate React component in the file `MoneyTrack_FE/components/ExpenseTrendChart.tsx`.
2. THE ExpenseTrendChart SHALL render a line chart using the `chart.js` library via `react-chartjs-2`.
3. THE ExpenseTrendChart SHALL use cubic interpolation (`tension: 0.4`) to render smooth curves for both data series.
4. THE ExpenseTrendChart SHALL display day numbers (1 to the last day of the month) on the X-axis.
5. THE ExpenseTrendChart SHALL display expense amount totals on the Y-axis.
6. THE ExpenseTrendChart SHALL render the current month's data series in a prominent red color with the legend label "Tháng này".
7. THE ExpenseTrendChart SHALL render the previous month's data series in a gray color with the legend label "Tháng trước".
8. WHEN a user hovers over a data point, THE ExpenseTrendChart SHALL display a tooltip showing the day number and the exact expense total for each series.
9. THE ExpenseTrendChart SHALL display a legend identifying the two data series.
10. THE ExpenseTrendChart SHALL be responsive, adapting its width to the parent container on all screen sizes.

---

### Requirement 4: Gọi API và Quản Lý State

**User Story:** As a user, I want the chart to load real data from the backend automatically, so that I always see my up-to-date spending trend.

#### Acceptance Criteria

1. THE ExpenseTrendChart SHALL call `GET /api/transactions/expense-trend` using the existing `apiClient` (axios instance) with the JWT token attached automatically.
2. WHILE data is being fetched from the Expense_Trend_API, THE ExpenseTrendChart SHALL display a loading indicator in place of the chart.
3. IF the Expense_Trend_API returns an error response, THEN THE ExpenseTrendChart SHALL display a user-friendly error message in place of the chart.
4. WHEN the Expense_Trend_API returns data where both `currentMonth` and `previousMonth` contain only zero values, THE ExpenseTrendChart SHALL still render the chart with flat zero lines.
5. THE ExpenseTrendChart SHALL add a new type `ExpenseTrendResponse` to `MoneyTrack_FE/lib/types/api.ts` with fields `currentMonth: number[]` and `previousMonth: number[]`.
6. THE ExpenseTrendChart SHALL add a new function `getExpenseTrend` to `MoneyTrack_FE/lib/api/transactions.ts` (hoặc file api tương ứng) that calls `GET /api/transactions/expense-trend`.

---

### Requirement 5: Tích Hợp Biểu Đồ vào Trang Chủ

**User Story:** As a user, I want the expense trend chart to appear on my home page, so that I can see my spending comparison as soon as I log in.

#### Acceptance Criteria

1. THE Main_Page SHALL render the `ExpenseTrendChart` component tại `MoneyTrack_FE/app/(main)/page.tsx`.
2. THE Main_Page SHALL display the `ExpenseTrendChart` inside a card container với tiêu đề phù hợp (ví dụ: "Xu hướng chi tiêu").
3. THE Main_Page SHALL display the `ExpenseTrendChart` below the existing summary statistics section.
