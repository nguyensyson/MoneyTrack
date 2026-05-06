# Requirements Document

## Introduction

Tính năng Admin Dashboard Statistics API bổ sung một endpoint thống kê tổng hợp cho admin, trả về tổng số người dùng, tổng số giao dịch và tổng số danh mục đang hoạt động trong hệ thống. Phía frontend sẽ gọi API này để hiển thị dữ liệu thực tế thay cho các giá trị cố định (hardcode) hiện tại trên màn hình dashboard quản trị của ứng dụng MoneyTrack.

## Glossary

- **Admin_Dashboard**: Màn hình tổng quan dành cho người dùng có vai trò ADMIN, hiển thị các chỉ số thống kê hệ thống.
- **Statistics_API**: Endpoint REST `/api/admin/statistics/overview` trả về dữ liệu thống kê tổng hợp.
- **AdminStatisticsController**: Spring Boot REST controller xử lý các yêu cầu HTTP tới `/api/admin/statistics`.
- **AdminStatisticsService**: Interface service chứa logic nghiệp vụ thống kê dành cho admin.
- **AdminDashboardOverviewResponse**: DTO phản hồi chứa `totalUsers`, `totalTransactions`, `totalCategories`.
- **Active_Record**: Bản ghi có `deleteFlag = ACTIVE` (chưa bị xóa mềm).
- **Admin_Dashboard_Page**: Component React tại `app/admin/dashboard/page.tsx` hiển thị các thẻ thống kê.

## Requirements

### Requirement 1: API Thống Kê Tổng Hợp cho Admin

**User Story:** As an ADMIN, I want a statistics overview API endpoint, so that I can retrieve real system-wide counts for users, transactions, and categories.

#### Acceptance Criteria

1. WHEN an authenticated ADMIN sends a GET request to `/api/admin/statistics/overview`, THE Statistics_API SHALL return an HTTP 200 response containing `totalUsers`, `totalTransactions`, and `totalCategories` as integer values.
2. THE Statistics_API SHALL count all users registered in the system regardless of their role.
3. THE Statistics_API SHALL count only Active_Record transactions (where `deleteFlag = ACTIVE`).
4. THE Statistics_API SHALL count only Active_Record categories (where `deleteFlag = ACTIVE`).
5. WHEN an unauthenticated request is sent to `/api/admin/statistics/overview`, THE Statistics_API SHALL return an HTTP 401 response.
6. WHEN an authenticated USER (non-admin) sends a request to `/api/admin/statistics/overview`, THE Statistics_API SHALL return an HTTP 403 response.

---

### Requirement 2: DTO Phản Hồi Thống Kê

**User Story:** As a developer, I want a well-defined response DTO for the statistics endpoint, so that the frontend can reliably deserialize the response.

#### Acceptance Criteria

1. THE AdminDashboardOverviewResponse SHALL contain the field `totalUsers` of type `long`.
2. THE AdminDashboardOverviewResponse SHALL contain the field `totalTransactions` of type `long`.
3. THE AdminDashboardOverviewResponse SHALL contain the field `totalCategories` of type `long`.
4. WHEN the Statistics_API serializes the response, THE AdminDashboardOverviewResponse SHALL be serialized as a JSON object with keys `totalUsers`, `totalTransactions`, and `totalCategories`.

---

### Requirement 3: Tích Hợp Frontend – Gọi API Thống Kê

**User Story:** As an ADMIN, I want the dashboard to display real statistics fetched from the backend, so that I can see accurate system-wide data instead of hardcoded values.

#### Acceptance Criteria

1. WHEN the Admin_Dashboard_Page mounts, THE Admin_Dashboard_Page SHALL call the Statistics_API to fetch `totalUsers`, `totalTransactions`, and `totalCategories`.
2. WHILE the Admin_Dashboard_Page is fetching statistics data, THE Admin_Dashboard_Page SHALL display a loading indicator in place of each statistic value.
3. WHEN the Statistics_API returns a successful response, THE Admin_Dashboard_Page SHALL display the returned `totalUsers`, `totalTransactions`, and `totalCategories` values in the corresponding stat cards.
4. IF the Statistics_API call fails, THEN THE Admin_Dashboard_Page SHALL display an error message indicating that statistics could not be loaded.
5. THE Admin_Dashboard_Page SHALL remove all references to mock-data functions (`getAllUsers`, `getCategories`, `getTransactionsByMonth`) used for computing the three statistic values.

---

### Requirement 4: Kiểu Dữ Liệu Frontend cho Thống Kê Tổng Hợp

**User Story:** As a frontend developer, I want a TypeScript type for the admin overview statistics response, so that the API call is type-safe.

#### Acceptance Criteria

1. THE Admin_Dashboard_Page SHALL define or import a TypeScript interface `AdminDashboardOverview` with fields `totalUsers: number`, `totalTransactions: number`, and `totalCategories: number`.
2. WHEN the Statistics_API response is deserialized, THE Admin_Dashboard_Page SHALL map the JSON fields `totalUsers`, `totalTransactions`, and `totalCategories` to the corresponding fields of `AdminDashboardOverview`.
