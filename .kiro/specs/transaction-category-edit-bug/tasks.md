# Transaction Category Edit Bug — Tasks

## Tasks

- [x] 1. Exploratory testing trên code chưa fix
  - [x] 1.1 Viết test render `TransactionModal` với `transaction.categoryId` là subcategory ID và assert ô danh mục hiển thị trống (xác nhận bug tồn tại)
  - [x] 1.2 Chạy test trên code chưa fix và ghi lại counterexample (expected: test pass = bug confirmed)
  - [x] 1.3 Verify root cause: assert số lượng item render trong dropdown bằng số danh mục cha, không bao gồm con

- [x] 2. Implement fix trong `TransactionModal`
  - [x] 2.1 Thêm import `CategorySelector` và `CategoryWithChildren` từ `@/components/category-selector`
  - [x] 2.2 Thêm import `useMemo` từ React (nếu chưa có)
  - [x] 2.3 Thêm hàm `toSelectorCategories(apiCats: ApiCategory[]): CategoryWithChildren[]` để convert `ApiCategory[]` sang format `CategoryWithChildren[]` (map `id` sang string, lowercase `type`, map `children` đệ quy)
  - [x] 2.4 Tính `filteredSelectorCategories` bằng `useMemo` từ `filteredCategories` đã convert
  - [x] 2.5 Thay thế `<Select>/<SelectItem>` trong phần chọn danh mục bằng `<CategorySelector categories={filteredSelectorCategories} value={categoryId} onChange={setCategoryId} placeholder="Chọn danh mục" />`
  - [x] 2.6 Xóa import `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` nếu không còn dùng ở nơi nào khác trong file


- [x] 5. Kiểm tra tổng thể và dọn dẹp
  - [x] 5.2 Kiểm tra TypeScript diagnostics trên `transaction-modal.tsx` — không có lỗi type
