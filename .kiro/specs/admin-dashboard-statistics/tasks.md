# Implementation Plan: Admin Dashboard Statistics API

## Overview

Mở rộng backend Spring Boot với endpoint `GET /api/admin/statistics/overview` trả về ba chỉ số tổng hợp hệ thống, đồng thời refactor trang `app/admin/dashboard/page.tsx` để gọi API thực thay cho mock-data. Các thay đổi bám sát pattern đã có trong codebase, không tạo thêm controller hay service mới.

## Tasks

- [x] 1. Thêm jqwik dependency vào pom.xml
  - Thêm dependency `net.jqwik:jqwik:1.9.3` với scope `test` vào `MoneyTrack_BE/pom.xml`
  - Đây là thư viện property-based testing tích hợp với JUnit 5, cần thiết cho các property test ở task 4
  - _Requirements: 1.1, 1.3, 1.4, 2.4_

- [x] 2. Mở rộng Repository với query methods mới
  - [x] 2.1 Thêm `countByDeleteFlag(DeleteFlag deleteFlag)` vào `TransactionRepository`
    - Thêm method signature vào interface `TransactionRepository.java`
    - Spring Data JPA tự sinh query, không cần viết JPQL thủ công
    - _Requirements: 1.3_
  - [x] 2.2 Thêm `countByDeleteFlag(DeleteFlag deleteFlag)` vào `CategoryRepository`
    - Thêm method signature vào interface `CategoryRepository.java`
    - Spring Data JPA tự sinh query, không cần viết JPQL thủ công
    - _Requirements: 1.4_

- [x] 3. Tạo DTO `AdminDashboardOverviewResponse`
  - Tạo file `MoneyTrack_BE/src/main/java/com/money/moneytrack_be/dto/response/AdminDashboardOverviewResponse.java`
  - Khai báo ba field `long totalUsers`, `long totalTransactions`, `long totalCategories`
  - Sử dụng Lombok `@Getter`, `@Builder`, `@AllArgsConstructor` nhất quán với các DTO hiện có
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. Mở rộng `AdminStatisticsService` và `AdminStatisticsServiceImpl`
  - [x] 4.1 Thêm method `getOverviewStatistics()` vào interface `AdminStatisticsService`
    - Thêm signature `AdminDashboardOverviewResponse getOverviewStatistics();` vào `AdminStatisticsService.java`
    - _Requirements: 1.1_
  - [x] 4.2 Implement `getOverviewStatistics()` trong `AdminStatisticsServiceImpl`
    - Inject thêm `UserRepository` và `CategoryRepository` vào `AdminStatisticsServiceImpl`
    - Gọi `userRepository.count()`, `transactionRepository.countByDeleteFlag(ACTIVE)`, `categoryRepository.countByDeleteFlag(ACTIVE)`
    - Build và trả về `AdminDashboardOverviewResponse` qua builder
    - _Requirements: 1.2, 1.3, 1.4_
  
- [x] 5. Thêm endpoint `/overview` vào `AdminStatisticsController`
  - Thêm handler method `getOverview()` vào `AdminStatisticsController.java`
  - Annotate với `@GetMapping("/overview")` và `@PreAuthorize("hasRole('ADMIN')")`
  - Trả về `ResponseEntity.ok(adminStatisticsService.getOverviewStatistics())`
  - _Requirements: 1.1, 1.5, 1.6_
  

- [ ] 7. Cài đặt test dependencies cho frontend
  - Cài `jest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jest-environment-jsdom`, `fast-check`, `@types/jest` vào `devDependencies` của `MoneyTrack_FE/package.json`
  - Tạo file cấu hình `jest.config.ts` và `jest.setup.ts` trong `MoneyTrack_FE/`
  - _Requirements: 3.3, 4.2_

- [x] 8. Thêm TypeScript interface `AdminDashboardOverview`
  - Thêm interface vào `MoneyTrack_FE/lib/types/api.ts`:
    ```typescript
    export interface AdminDashboardOverview {
      totalUsers: number;
      totalTransactions: number;
      totalCategories: number;
    }
    ```
  - _Requirements: 4.1, 4.2_

- [x] 9. Thêm hàm `statisticsApi.getOverview()` vào API client
  - Mở `MoneyTrack_FE/lib/api/statistics.ts`, import `AdminDashboardOverview` từ `@/lib/types/api`
  - Thêm method `getOverview` vào object `statisticsApi`:
    ```typescript
    getOverview: () =>
      apiClient
        .get<AdminDashboardOverview>('/api/admin/statistics/overview')
        .then((r) => r.data),
    ```
  - _Requirements: 3.1, 4.1_

- [x] 10. Refactor `app/admin/dashboard/page.tsx` – thay mock-data bằng API call
  - Xóa các import `getAllUsers`, `getCategories`, `getTransactionsByMonth` từ `@/lib/mock-data`
  - Xóa các dòng tính `totalUsers`, `totalTransactions`, `totalCategories` từ mock-data
  - Thêm import `AdminDashboardOverview` từ `@/lib/types/api`
  - Thêm ba state: `overview`, `overviewLoading` (khởi tạo `true`), `overviewError`
  - Thêm `useEffect` gọi `statisticsApi.getOverview()` với cleanup `cancelled` flag
  - Cập nhật các stat card để hiển thị loading spinner khi `overviewLoading`, thông báo lỗi khi `overviewError`, và giá trị thực từ `overview` khi thành công
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_


- [ ] 11. Final checkpoint – Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks đánh dấu `*` là optional và có thể bỏ qua để triển khai MVP nhanh hơn
- Mỗi task tham chiếu đến requirements cụ thể để đảm bảo traceability
- Backend dùng **jqwik** cho property-based tests (cần thêm dependency vào pom.xml ở task 1)
- Frontend dùng **fast-check** cho property-based tests (cần cài thêm ở task 7)
- Property tests validate các đặc tính đúng đắn phổ quát; unit tests validate các ví dụ cụ thể và edge cases
- Loading state và error state của overview được quản lý độc lập với chart data đã có, tránh ảnh hưởng lẫn nhau
