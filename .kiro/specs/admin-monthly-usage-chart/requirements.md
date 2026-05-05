# Requirements Document

## Introduction

Tính năng này bổ sung một biểu đồ cột (bar chart) vào màn hình Admin Dashboard, hiển thị số lượt giao dịch được tạo trên hệ thống theo từng tháng. Dữ liệu được lấy từ một API mới dành riêng cho admin, truy vấn trực tiếp từ database và trả về danh sách các cặp (tháng, số lượng). Phía frontend hiển thị biểu đồ bằng thư viện recharts, tách thành component riêng, có xử lý loading/error state và responsive layout.

## Glossary

- **Admin_Dashboard**: Trang quản trị tại `/admin/dashboard`, chỉ dành cho người dùng có role `ADMIN`.
- **Monthly_Usage_API**: Endpoint `GET /api/admin/statistics/monthly-transactions` trả về thống kê số lượng giao dịch theo tháng.
- **MonthlyUsageChart**: React component độc lập hiển thị biểu đồ cột số lượng giao dịch theo tháng.
- **MonthlyTransactionCount**: Đối tượng dữ liệu gồm `month` (chuỗi định dạng `yyyy-MM`) và `count` (số nguyên không âm).
- **Admin_Statistics_Service**: Service phía backend xử lý logic truy vấn thống kê dành cho admin.
- **Transaction**: Bản ghi giao dịch tài chính trong database, có trường `date` kiểu `LocalDate`.

---

## Requirements

### Requirement 1: API Thống Kê Số Lượng Giao Dịch Theo Tháng

**User Story:** As an admin, I want to retrieve monthly transaction counts from the system, so that I can monitor usage trends over time.

#### Acceptance Criteria

1. WHEN a request is sent to `GET /api/admin/statistics/monthly-transactions`, THE Monthly_Usage_API SHALL return an HTTP 200 response with a JSON array of `MonthlyTransactionCount` objects.
2. THE Monthly_Usage_API SHALL return `MonthlyTransactionCount` objects where each `month` field follows the format `yyyy-MM` (ví dụ: `"2026-01"`).
3. THE Monthly_Usage_API SHALL return the array sorted in ascending chronological order by `month`.
4. WHEN no transactions exist in the database, THE Monthly_Usage_API SHALL return an HTTP 200 response with an empty JSON array `[]`.
5. THE Monthly_Usage_API SHALL only count transactions where `delete_flag` is `ACTIVE`.
6. WHEN a request is made by a user without the `ADMIN` role, THE Monthly_Usage_API SHALL return an HTTP 403 Forbidden response.
7. WHEN a request is made without a valid JWT token, THE Monthly_Usage_API SHALL return an HTTP 401 Unauthorized response.

---

### Requirement 2: Truy Vấn Database Hiệu Quả

**User Story:** As a system operator, I want the monthly statistics query to be performant, so that the admin dashboard loads quickly even with large datasets.

#### Acceptance Criteria

1. THE Admin_Statistics_Service SHALL use a single aggregation query (GROUP BY) to compute transaction counts per month, thay vì load toàn bộ bản ghi rồi xử lý trong bộ nhớ.
2. THE Admin_Statistics_Service SHALL use the `date` field of `Transaction` to extract year and month for grouping.
3. THE Admin_Statistics_Service SHALL only include transactions with `delete_flag = ACTIVE` in the aggregation.

---

### Requirement 3: Component Biểu Đồ Cột Độc Lập

**User Story:** As an admin, I want to see a bar chart of monthly transaction counts on the dashboard, so that I can visually understand usage trends at a glance.

#### Acceptance Criteria

1. THE MonthlyUsageChart SHALL be implemented as a separate React component in the file `MoneyTrack_FE/app/admin/dashboard/MonthlyUsageChart.tsx`.
2. THE MonthlyUsageChart SHALL render a bar chart using the `recharts` library.
3. THE MonthlyUsageChart SHALL display the `month` values (formatted as `MM/yyyy`, ví dụ: `"01/2026"`) on the X-axis.
4. THE MonthlyUsageChart SHALL display the `count` values (số lượng giao dịch) on the Y-axis.
5. WHEN a user hovers over a bar, THE MonthlyUsageChart SHALL display a tooltip showing the month label and the exact transaction count.
6. THE MonthlyUsageChart SHALL be responsive, adapting its width to the parent container on all screen sizes.

---

### Requirement 4: Gọi API và Quản Lý State

**User Story:** As an admin, I want the dashboard to fetch real data from the backend, so that the chart always reflects the current system state.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL call `GET /api/admin/statistics/monthly-transactions` using the existing `apiClient` (axios instance) with the JWT token attached automatically.
2. WHILE data is being fetched from the Monthly_Usage_API, THE Admin_Dashboard SHALL display a loading indicator in place of the chart.
3. IF the Monthly_Usage_API returns an error response, THEN THE Admin_Dashboard SHALL display a user-friendly error message in place of the chart.
4. WHEN the Monthly_Usage_API returns an empty array, THE Admin_Dashboard SHALL display an empty state message indicating no data is available.
5. THE Admin_Dashboard SHALL add a new type `MonthlyTransactionCount` to `MoneyTrack_FE/lib/types/api.ts` with fields `month: string` and `count: number`.
6. THE Admin_Dashboard SHALL add a new function `getMonthlyTransactions` to `MoneyTrack_FE/lib/api/statistics.ts` that calls `GET /api/admin/statistics/monthly-transactions`.

---

### Requirement 5: Tích Hợp Biểu Đồ vào Admin Dashboard

**User Story:** As an admin, I want the monthly usage chart to appear on the dashboard page, so that I can see it alongside other summary statistics.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL render the `MonthlyUsageChart` component below the existing stats cards section.
2. THE Admin_Dashboard SHALL pass the fetched `MonthlyTransactionCount[]` data as a prop to `MonthlyUsageChart`.
3. THE Admin_Dashboard SHALL display a card container (sử dụng component `Card` hiện có) bao quanh `MonthlyUsageChart` với tiêu đề phù hợp.
