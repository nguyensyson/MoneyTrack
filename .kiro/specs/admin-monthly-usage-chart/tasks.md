# Tasks

## Task List

- [x] 1. Backend: DTO và Projection
  - [x] 1.1 Tạo interface `MonthlyTransactionCountProjection` trong package `dto/response`
  - [x] 1.2 Tạo class `MonthlyTransactionCountResponse` trong package `dto/response`

- [x] 2. Backend: Repository Query
  - [x] 2.1 Thêm method `countActiveTransactionsByMonth` vào `TransactionRepository` với JPQL GROUP BY query

- [x] 3. Backend: Service Layer
  - [x] 3.1 Tạo interface `AdminStatisticsService` trong package `service`
  - [x] 3.2 Tạo class `AdminStatisticsServiceImpl` trong package `service/impl` implement `AdminStatisticsService`

- [x] 4. Backend: Controller
  - [x] 4.1 Tạo `AdminStatisticsController` tại `/api/admin/statistics` với endpoint `GET /monthly-transactions` được bảo vệ bởi `@PreAuthorize("hasRole('ADMIN')")`

- [x] 6. Frontend: Type và API Function
  - [x] 6.1 Thêm interface `MonthlyTransactionCount` vào `MoneyTrack_FE/lib/types/api.ts`
  - [x] 6.2 Thêm function `getMonthlyTransactions` vào `MoneyTrack_FE/lib/api/statistics.ts`

- [x] 7. Frontend: MonthlyUsageChart Component
  - [x] 7.1 Tạo file `MoneyTrack_FE/app/admin/dashboard/MonthlyUsageChart.tsx` với pure helper `formatMonth` (yyyy-MM → MM/yyyy) và recharts bar chart
  - [x] 7.2 Implement responsive layout dùng `ResponsiveContainer`, X-axis hiển thị `MM/yyyy`, Y-axis hiển thị count, Tooltip hiển thị month label và count

- [x] 8. Frontend: Admin Dashboard Integration
  - [x] 8.1 Cập nhật `MoneyTrack_FE/app/admin/dashboard/page.tsx`: thêm `useState` + `useEffect` để fetch data từ `getMonthlyTransactions()`
  - [x] 8.2 Implement loading state, error state, và empty state trong dashboard
  - [x] 8.3 Render `MonthlyUsageChart` bên trong `Card` container với tiêu đề phù hợp, đặt bên dưới stats cards grid


