# Implementation Plan: transaction-year-filter

## Overview

Thêm Year Filter dropdown vào trang giao dịch, cập nhật backend để nhận tham số `year` riêng biệt, và đảm bảo tiêu đề danh sách cùng tính năng Export CSV phản ánh đúng năm đang được chọn.

Thứ tự triển khai: Backend trước (thay đổi API signature) → Frontend sau (thêm UI + kết nối API mới).

## Tasks

- [x] 1. Cập nhật Backend: `TransactionService` interface và `TransactionServiceImpl`
  - [x] 1.1 Thêm `resolveYearMonth` và cập nhật signature `getTransactions` trong `TransactionServiceImpl`
    - Thêm private method `resolveYearMonth(Integer month, Integer year)` thay thế `resolveMonth(String month)`
    - Cập nhật `getTransactions` nhận `Integer month, Integer year` thay vì `String month`
    - Xóa method `resolveMonth(String month)` cũ
    - File: `MoneyTrack_BE/src/main/java/com/money/moneytrack_be/service/impl/TransactionServiceImpl.java`
    - _Requirements: 2.1, 2.4_

  - [x] 1.2 Cập nhật `TransactionService` interface để khớp với signature mới
    - Thay `Page<Transaction> getTransactions(String userEmail, String month, Long categoryId, Pageable pageable)` bằng `Page<Transaction> getTransactions(String userEmail, Integer month, Integer year, Long categoryId, Pageable pageable)`
    - File: `MoneyTrack_BE/src/main/java/com/money/moneytrack_be/service/TransactionService.java`
    - _Requirements: 2.1, 2.4_



- [x] 2. Cập nhật Backend: `TransactionController`
  - [x] 2.1 Cập nhật endpoint `GET /api/transactions` để nhận `month` và `year` là `Integer`
    - Thay `@RequestParam(defaultValue = "current") String month` bằng `@RequestParam(required = false) Integer month`
    - Thêm `@RequestParam(required = false) Integer year`
    - Cập nhật lời gọi `transactionService.getTransactions(...)` để truyền cả `month` và `year`
    - Thêm `@Min(1) @Max(12)` validation cho `month` nếu không null (tùy chọn, Spring sẽ trả 400 tự động khi type mismatch)
    - File: `MoneyTrack_BE/src/main/java/com/money/moneytrack_be/controller/TransactionController.java`
    - _Requirements: 2.1, 2.4_


- [x] 4. Thêm helper function `getYearOptions` vào Frontend
  - [x] 4.1 Tạo và export hàm `getYearOptions` trong file page hoặc utils
    - Thêm `export function getYearOptions(currentYear: number): number[]` trả về `[currentYear, currentYear - 1, currentYear - 2]`
    - Đặt hàm này ở đầu file `app/(main)/transactions/page.tsx` (hoặc tách ra `lib/utils/year.ts` nếu cần tái sử dụng)
    - _Requirements: 1.2_


- [x] 5. Cập nhật Frontend: state và Year Filter dropdown
  - [x] 5.1 Chuyển `year` từ constant thành state có thể thay đổi trong `TransactionsContent`
    - Thay `const [year] = useState(now.getFullYear())` bằng `const [year, setYear] = useState(now.getFullYear())`
    - File: `MoneyTrack_FE/app/(main)/transactions/page.tsx`
    - _Requirements: 1.3, 2.2_

  - [x] 5.2 Thêm Year Filter dropdown vào khu vực Filters, sau Month Filter
    - Render `<Select>` với `value={String(year)}` và `onValueChange={(v) => { setYear(Number(v)); setPage(0); }}`
    - Dùng `getYearOptions(now.getFullYear())` để render các `<SelectItem>`
    - Đặt dropdown sau Month Filter và trước Category Filter
    - File: `MoneyTrack_FE/app/(main)/transactions/page.tsx`
    - _Requirements: 1.1, 1.2, 1.3, 2.2_


- [x] 6. Cập nhật Frontend: tiêu đề danh sách và Export CSV
  - [x] 6.1 Xác nhận tiêu đề `ChartCard` dùng `year` state động (không phải constant)
    - Kiểm tra `<ChartCard title={`Tháng ${month}/${year}`}>` đang dùng `year` từ state mới (sau task 5.1)
    - Không cần thay đổi cú pháp — chỉ đảm bảo `year` là state động
    - File: `MoneyTrack_FE/app/(main)/transactions/page.tsx`
    - _Requirements: 3.1_

  - [x] 6.2 Xác nhận `monthStr` trong `handleExport` dùng `year` state động
    - Kiểm tra `const monthStr = \`${year}-${String(month).padStart(2, '0')}\`` đang dùng `year` từ state mới
    - Không cần thay đổi cú pháp — chỉ đảm bảo `year` là state động
    - File: `MoneyTrack_FE/app/(main)/transactions/page.tsx`
    - _Requirements: 4.1, 4.2_



## Notes

- Tasks đánh dấu `*` là tùy chọn và có thể bỏ qua để triển khai nhanh hơn
- Mỗi task tham chiếu đến requirements cụ thể để đảm bảo traceability
- Backend phải được cập nhật trước Frontend để tránh breaking change
- Property tests dùng **fast-check** (Frontend) và **jqwik** (Backend)
- Vì `year` trong `TransactionsContent` đã được truyền vào `useFetch` dependency array, việc chuyển thành state là đủ để trigger re-fetch tự động
