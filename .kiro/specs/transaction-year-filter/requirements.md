# Requirements Document

## Introduction

Trang giao dịch (Transactions Page) của MoneyTrack hiện tại chỉ cho phép lọc theo tháng, không có bộ lọc theo năm. Tính năng này bổ sung một input filter theo năm hiển thị 3 năm gần nhất, cho phép người dùng kết hợp lọc theo tháng và năm để xem giao dịch của bất kỳ tháng/năm nào trong khoảng thời gian đó.

## Glossary

- **Transactions_Page**: Trang `/transactions` trong ứng dụng MoneyTrack FE, nơi người dùng xem và quản lý danh sách giao dịch.
- **Year_Filter**: Dropdown input cho phép người dùng chọn năm để lọc danh sách giao dịch.
- **Month_Filter**: Dropdown input hiện có cho phép người dùng chọn tháng để lọc danh sách giao dịch.
- **Current_Year**: Năm hiện tại theo đồng hồ hệ thống của trình duyệt.
- **Filter_State**: Tập hợp các giá trị bộ lọc đang được áp dụng (tháng, năm, danh mục).
- **Transaction_List**: Danh sách giao dịch được trả về từ API dựa trên Filter_State hiện tại.
- **API**: Backend REST API của MoneyTrack, nhận tham số `month` và `year` để lọc giao dịch.

## Requirements

### Requirement 1: Hiển thị Year Filter

**User Story:** As a người dùng MoneyTrack, I want thấy một dropdown chọn năm trên trang giao dịch, so that tôi có thể lọc giao dịch theo năm mong muốn.

#### Acceptance Criteria

1. THE Transactions_Page SHALL hiển thị một Year_Filter dropdown trong khu vực bộ lọc, đặt cạnh Month_Filter hiện có.
2. THE Year_Filter SHALL liệt kê đúng 3 năm gần nhất tính từ Current_Year, bao gồm Current_Year (ví dụ: nếu Current_Year là 2025 thì hiển thị 2025, 2024, 2023).
3. WHEN Transactions_Page được tải lần đầu, THE Year_Filter SHALL có giá trị mặc định là Current_Year.

### Requirement 2: Lọc giao dịch theo năm

**User Story:** As a người dùng MoneyTrack, I want chọn một năm trong Year_Filter, so that danh sách giao dịch chỉ hiển thị các giao dịch thuộc tháng và năm đã chọn.

#### Acceptance Criteria

1. WHEN người dùng chọn một năm từ Year_Filter, THE Transactions_Page SHALL gửi request đến API với tham số `year` tương ứng với năm đã chọn.
2. WHEN người dùng chọn một năm từ Year_Filter, THE Transactions_Page SHALL reset về trang đầu tiên (page = 0) của danh sách kết quả.
3. WHEN người dùng thay đổi Year_Filter, THE Transaction_List SHALL được cập nhật để chỉ hiển thị giao dịch thuộc tháng và năm đang được chọn.
4. WHILE Year_Filter và Month_Filter đều có giá trị được chọn, THE API SHALL nhận đồng thời cả tham số `month` và `year` trong mỗi request lấy danh sách giao dịch.

### Requirement 3: Tiêu đề danh sách phản ánh bộ lọc hiện tại

**User Story:** As a người dùng MoneyTrack, I want tiêu đề của danh sách giao dịch hiển thị đúng tháng và năm đang được lọc, so that tôi biết mình đang xem dữ liệu của khoảng thời gian nào.

#### Acceptance Criteria

1. WHEN Filter_State thay đổi, THE Transactions_Page SHALL cập nhật tiêu đề của Transaction_List thành định dạng `Tháng {month}/{year}` phản ánh Month_Filter và Year_Filter hiện tại.

### Requirement 4: Đồng bộ Year Filter với tính năng Export CSV

**User Story:** As a người dùng MoneyTrack, I want file CSV được export ra phản ánh đúng năm đang được lọc, so that dữ liệu xuất ra khớp với những gì tôi đang xem trên màn hình.

#### Acceptance Criteria

1. WHEN người dùng thực hiện Export CSV, THE Transactions_Page SHALL đưa giá trị năm từ Year_Filter vào tham số `month` của request export theo định dạng `{year}-{MM}`.
2. WHEN export thành công, THE Transactions_Page SHALL đặt tên file CSV theo định dạng `transactions_{year}-{MM}.csv` hoặc `transactions_{year}-{MM}_{categoryName}.csv` nếu có lọc theo danh mục.
