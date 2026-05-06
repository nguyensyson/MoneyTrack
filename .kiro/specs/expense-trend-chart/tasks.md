# Tasks

## Task List

- [x] 1. Backend — DTO và Projection
  - [x] 1.1 Tạo interface `DailyExpenseProjection` tại `dto/response/DailyExpenseProjection.java` với hai method `getDayOfMonth(): int` và `getTotalAmount(): BigDecimal`
  - [x] 1.2 Tạo class `ExpenseTrendResponse` tại `dto/response/ExpenseTrendResponse.java` với hai field `List<BigDecimal> currentMonth` và `List<BigDecimal> previousMonth`, dùng `@Getter @Builder`

- [x] 2. Backend — Repository Query
  - [x] 2.1 Thêm method `findDailyExpenseTotals` vào `TransactionRepository` với JPQL aggregation query `GROUP BY FUNCTION('DAY', t.date)`, filter theo `user`, `deleteFlag`, `type`, `startDate`, `endDate`, trả về `List<DailyExpenseProjection>`

- [x] 3. Backend — Service
  - [x] 3.1 Tạo interface `ExpenseTrendService` tại `service/ExpenseTrendService.java` với method `getExpenseTrend(String userEmail): ExpenseTrendResponse`
  - [x] 3.2 Tạo class `ExpenseTrendServiceImpl` tại `service/impl/ExpenseTrendServiceImpl.java` implement `ExpenseTrendService`:
    - Xác định `currentYearMonth = YearMonth.now()` và `previousYearMonth = currentYearMonth.minusMonths(1)`
    - Khởi tạo mảng `BigDecimal[]` kích thước = số ngày trong tháng, điền `BigDecimal.ZERO`
    - Gọi `findDailyExpenseTotals` cho từng tháng, map projection vào index `dayOfMonth - 1`
    - Trả về `ExpenseTrendResponse` với cả hai mảng

- [x] 4. Backend — Controller
  - [x] 4.1 Inject `ExpenseTrendService` vào `TransactionController` và thêm endpoint `GET /expense-trend` trả về `ResponseEntity<ExpenseTrendResponse>`

- [x] 7. Frontend — Types và API
  - [x] 7.1 Thêm interface `ExpenseTrendResponse` vào `MoneyTrack_FE/lib/types/api.ts` với `currentMonth: number[]` và `previousMonth: number[]`
  - [x] 7.2 Thêm method `getExpenseTrend` vào `MoneyTrack_FE/lib/api/transactions.ts` gọi `GET /api/transactions/expense-trend` qua `apiClient`

- [x] 8. Frontend — Component `ExpenseTrendChart`
  - [x] 8.1 Cài đặt `chart.js` và `react-chartjs-2` vào `MoneyTrack_FE` (nếu chưa có)
  - [x] 8.2 Tạo file `MoneyTrack_FE/components/ExpenseTrendChart.tsx`:
    - Dùng `useFetch` để gọi `transactionsApi.getExpenseTrend()`
    - Loading state: hiển thị spinner `animate-spin`
    - Error state: hiển thị thông báo lỗi tiếng Việt
    - Data state: render `<Line>` chart với config:
      - `tension: 0.4`
      - Dataset "Tháng này": `borderColor: '#ef4444'`
      - Dataset "Tháng trước": `borderColor: '#94a3b8'`
      - X-axis labels: `[1, 2, ..., N]` (N = `currentMonth.length`)
      - `responsive: true`, `maintainAspectRatio: false`
      - Tooltip formatter hiển thị số tiền định dạng VND (`toLocaleString('vi-VN')`)
      - Legend hiển thị hai series

- [x] 9. Frontend — Tích hợp vào trang chủ
  - [x] 9.1 Import và render `<ExpenseTrendChart />` trong `MoneyTrack_FE/app/(main)/page.tsx`, bọc trong `<ChartCard title="Xu hướng chi tiêu">`, đặt bên dưới section pie chart hiện tại


